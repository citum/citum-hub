/*
SPDX-License-Identifier: MPL-2.0
SPDX-FileCopyrightText: © 2023-2026 Bruce D'Arcus
*/

use axum::{
    extract::{Path, State, Query},
    routing::{get, post},
    Router, Json,
    response::{Redirect, IntoResponse},
};
use std::sync::Arc;
use std::net::SocketAddr;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use citum_schema::{Style, TemplatePreset, citation::{Citation, CitationItem, CitationMode}, CitationField};
use citum_engine::{processor::Processor, Reference, render::html::Html as HtmlRenderer};
use intent_engine::{StyleIntent, DecisionPackage};
use sqlx::{postgres::PgPoolOptions, Pool, Postgres, FromRow};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use dotenvy::dotenv;
use oauth2::{AuthorizationCode, TokenResponse};

mod auth;
mod preview_data;

struct AppState {
    db: Pool<Postgres>,
    oauth_client: oauth2::basic::BasicClient,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct StyleRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub intent: Value,
    pub citum: String,
    pub is_public: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[sqlx(skip)]
    pub description: Option<String>,
    #[sqlx(skip)]
    pub fields: Vec<CitationField>,
}

fn process_style_metadata(mut row: StyleRow) -> StyleRow {
    match serde_yaml::from_str::<Style>(&row.citum) {
        Ok(style) => {
            row.description = style.info.description.clone();
            row.fields = style.info.fields.clone();
        },
        Err(e) => {
            eprintln!("ERROR: Failed to parse metadata for {}: {}", row.title, e);
        }
    }
    row
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PreviewSet {
    pub in_text_parenthetical: Option<String>,
    pub in_text_narrative: Option<String>,
    pub note: Option<String>,
    pub bibliography: Option<String>,
}

#[derive(Deserialize)]
#[serde(untagged)]
enum PreviewRequestPayload {
    Style(Box<Style>),
    Intent(StyleIntent),
}

#[tokio::main]
async fn main() {
    if dotenv().is_err() {
        dotenvy::from_path(".env").ok();
        dotenvy::from_path("client/.env").ok();
    }
    tracing_subscriber::fmt::init();

    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("Failed to connect to database");

    let oauth_client = auth::create_oauth_client();

    let state = Arc::new(AppState {
        db: pool,
        oauth_client,
    });

    let app = Router::new()
        .route("/", get(health_check))
        .route("/api/auth/github", get(github_auth))
        .route("/api/auth/github/callback", get(github_callback))
        .route("/api/references", get(get_references))
        .route("/api/styles", get(list_user_styles).post(create_style))
        .route("/api/hub", get(list_public_styles))
        .route("/api/styles/:id", get(get_style).post(update_style))
        .route("/api/styles/:id/fork", post(fork_style))
        .route("/api/styles/:id/bookmark", post(bookmark_style))
        .route("/api/library/bookmarks", get(list_bookmarks))
        .route("/api/v1/preview", post(preview_set_handler))
        .route("/api/v1/decide", post(decide_handler))
        .with_state(state.clone());

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Citum Hub Main Server listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "Citum Hub API is running"
}

// --- Auth Handlers ---

async fn github_auth(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let (auth_url, _csrf_token) = auth::get_auth_url(&state.oauth_client);
    Redirect::temporary(auth_url.as_str())
}

#[derive(Deserialize)]
struct AuthQuery {
    code: String,
    #[serde(rename = "state")]
    _state: String,
}

async fn github_callback(
    State(state): State<Arc<AppState>>,
    Query(query): Query<AuthQuery>,
) -> impl IntoResponse {
    let token_res = state.oauth_client
        .exchange_code(AuthorizationCode::new(query.code))
        .request_async(oauth2::reqwest::async_http_client)
        .await
        .expect("Failed to exchange code");

    let client = reqwest::Client::new();
    let github_user: auth::GithubUser = client
        .get("https://api.github.com/user")
        .header("User-Agent", "citum-hub")
        .header("Authorization", format!("Bearer {}", token_res.access_token().secret()))
        .send()
        .await
        .expect("Failed to get GitHub user")
        .json()
        .await
        .expect("Failed to parse GitHub user");

    let user_email = github_user.email.clone().unwrap_or_else(|| github_user.login.clone());
    
    let user = sqlx::query_as::<_, auth::User>(
        "INSERT INTO users (email, github_id) VALUES ($1, $2) ON CONFLICT (github_id) DO UPDATE SET email = $1 RETURNING id, email, role"
    )
    .bind(&user_email)
    .bind(github_user.id.to_string())
    .fetch_one(&state.db)
    .await
    .expect("Failed to create/get user");

    let token = auth::create_jwt(user.id, &user.role);
    let frontend_url = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:5173".to_string());
    Redirect::temporary(&format!("{}/auth/callback?token={}", frontend_url, token))
}

// --- Preview and Decision Handlers ---

async fn preview_set_handler(
    Json(payload): Json<PreviewRequestPayload>
) -> impl IntoResponse {
    let (style, class, field) = match payload {
        PreviewRequestPayload::Style(style) => {
            use citum_schema::options::Processing;
            let class = match style.options.as_ref().and_then(|o| o.processing.as_ref()) {
                Some(Processing::Note) => "note",
                _ => "in_text",
            };
            (*style, class.to_string(), None)
        },
        PreviewRequestPayload::Intent(intent) => {
            let class = match intent.class {
                Some(intent_engine::CitationClass::AuthorDate) | Some(intent_engine::CitationClass::Numeric) | Some(intent_engine::CitationClass::Label) => "in_text",
                Some(intent_engine::CitationClass::Footnote) | Some(intent_engine::CitationClass::Endnote) => "note",
                None => "in_text",
            };
            let field = intent.field.clone();
            (intent.to_style(), class.to_string(), field)
        }
    };
    
    Json(generate_preview_set_internal(&style, &class, field.as_deref()))
}

fn generate_preview_set_internal(style: &Style, class: &str, field: Option<&str>) -> PreviewSet {
    let mut set = PreviewSet::default();

    // Get field-specific references from Rust-constructed data
    let references = preview_data::refs_for_field(field);

    if references.is_empty() {
        eprintln!("WARNING: No references available for preview generation");
        return set;
    }

    let cite_ids: Vec<String> = references.keys().cloned().collect();

    // Ensure the style has a citation spec — when intent is partially filled
    // (e.g., only 'field' answered), to_style() returns no citation template.
    // Default to APA with parentheses so the processor always renders something useful.
    let mut effective_style = style.clone();

    let processing = effective_style.options.as_ref().and_then(|o| o.processing.as_ref());
    let is_author_date_like = matches!(
        processing,
        Some(citum_schema::options::Processing::AuthorDate | citum_schema::options::Processing::Label(_)) | None
    );

    if effective_style.citation.is_none() {
        use citum_schema::CitationSpec;
        effective_style.citation = Some(CitationSpec {
            use_preset: Some(TemplatePreset::Apa),
            wrap: if is_author_date_like {
                Some(citum_schema::template::WrapPunctuation::Parentheses)
            } else {
                None
            },
            ..Default::default()
        });
    } else if class != "note" && is_author_date_like {
        if let Some(ref mut citation) = effective_style.citation {
            if citation.wrap.is_none() {
                // Saved author-date styles may omit parenthetical wrapping.
                citation.wrap = Some(citum_schema::template::WrapPunctuation::Parentheses);
            }

            if citation.integral.is_none() {
                // Narrative previews should avoid inheriting parenthetical wrapping.
                citation.integral = Some(Box::new(citum_schema::CitationSpec {
                    wrap: Some(citum_schema::template::WrapPunctuation::None),
                    ..Default::default()
                }));
            }
        }
    }
    if effective_style.bibliography.is_none() {
        use citum_schema::BibliographySpec;
        effective_style.bibliography = Some(BibliographySpec {
            use_preset: Some(TemplatePreset::Apa),
            ..Default::default()
        });
    }

    let processor = Processor::new(effective_style, references);

    // 1. Non-integral (parenthetical) citation — multi-cite with all refs
    let parenthetical_citation = Citation {
        id: Some("preview-parenthetical".to_string()),
        items: cite_ids.iter().map(|id| CitationItem { id: id.clone(), ..Default::default() }).collect(),
        mode: CitationMode::NonIntegral,
        ..Default::default()
    };

    match processor.process_citation_with_format::<HtmlRenderer>(&parenthetical_citation) {
        Ok(res) => {
            if !res.trim().is_empty() {
                if class == "note" {
                    set.note = Some(res);
                } else {
                    set.in_text_parenthetical = Some(res);
                }
            }
        },
        Err(e) => eprintln!("Parenthetical citation rendering failed: {}", e),
    }

    // 2. Integral (narrative) citation — single item for cleaner demo
    if class != "note" {
        let narrative_citation = Citation {
            id: Some("preview-narrative".to_string()),
            items: vec![
                CitationItem { id: cite_ids[0].clone(), ..Default::default() },
            ],
            mode: CitationMode::Integral,
            ..Default::default()
        };

        match processor.process_citation_with_format::<HtmlRenderer>(&narrative_citation) {
            Ok(res) => {
                if !res.trim().is_empty() {
                    set.in_text_narrative = Some(res);
                }
            },
            Err(e) => eprintln!("Narrative citation rendering failed: {}", e),
        }
    }

    // 3. Bibliography
    let bib_res = processor.render_bibliography_with_format::<HtmlRenderer>();
    if !bib_res.trim().is_empty() {
        set.bibliography = Some(bib_res);
    }

    set
}

async fn decide_handler(
    Json(intent): Json<StyleIntent>,
) -> Json<DecisionPackage> {
    let mut package = intent.decide();

    // Determine class string for preview generation
    let class = match &intent.class {
        Some(intent_engine::CitationClass::Footnote) | Some(intent_engine::CitationClass::Endnote) => "note",
        _ => "in_text",
    };

    let style = intent.to_style();
    let field = intent.field.as_deref();
    let preview = generate_preview_set_internal(&style, class, field);
    package.in_text_parenthetical = preview.in_text_parenthetical.clone();
    package.in_text_narrative = preview.in_text_narrative;
    package.note = preview.note;
    package.bibliography = preview.bibliography;

    // Also generate per-choice previews
    for choice_preview in &mut package.previews {
        if let Ok(mut intent_val) = serde_json::to_value(&intent) {
            if let Some(obj) = intent_val.as_object_mut() {
                if let Some(choice_obj) = choice_preview.choice_value.as_object() {
                    for (k, v) in choice_obj {
                        obj.insert(k.clone(), v.clone());
                    }
                }
            }
            if let Ok(temp_intent) = serde_json::from_value::<StyleIntent>(intent_val) {
                let temp_class = match &temp_intent.class {
                    Some(intent_engine::CitationClass::Footnote) | Some(intent_engine::CitationClass::Endnote) => "note",
                    _ => "in_text",
                };
                let temp_style = temp_intent.to_style();
                let temp_field = temp_intent.field.as_deref();
                let p = generate_preview_set_internal(&temp_style, temp_class, temp_field);
                let mut html = String::new();
                if let Some(it) = p.in_text_parenthetical { html.push_str(&format!("<div class='preview-cit'>{}</div>", it)); }
                if let Some(n) = p.note { html.push_str(&format!("<div class='preview-note'>{}</div>", n)); }
                if let Some(b) = p.bibliography { html.push_str(&format!("<div class='preview-bib mt-2'>{}</div>", b)); }
                choice_preview.html = html;
            }
        }
    }

    Json(package)
}

async fn get_references() -> Json<Vec<Reference>> {
    // Return the default cross-field set for the references endpoint
    let refs = preview_data::default_refs();
    Json(refs.values().cloned().collect())
}

// --- Style Database Handlers ---

async fn list_user_styles(
    State(state): State<Arc<AppState>>,
    user: auth::AuthenticatedUser
) -> Json<Vec<StyleRow>> {
    let styles = sqlx::query_as::<_, StyleRow>(
        "SELECT id, user_id, title, intent, citum, is_public, created_at, updated_at FROM styles WHERE user_id = $1 ORDER BY updated_at DESC"
    )
    .bind(user.id)
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let styles = styles.into_iter().map(process_style_metadata).collect();
    Json(styles)
}

async fn list_public_styles(State(state): State<Arc<AppState>>) -> Json<Vec<StyleRow>> {
    let styles = sqlx::query_as::<_, StyleRow>(
        "SELECT id, user_id, title, intent, citum, is_public, created_at, updated_at FROM styles WHERE is_public = true ORDER BY updated_at DESC"
    )
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let styles = styles.into_iter().map(process_style_metadata).collect();
    Json(styles)
}

async fn get_style(
    State(state): State<Arc<AppState>>,
    user: auth::OptionalUser,
    Path(id): Path<Uuid>
) -> impl IntoResponse {
    let user_id = user.0;
    let style = sqlx::query_as::<_, StyleRow>(
        "SELECT id, user_id, title, intent, citum, is_public, created_at, updated_at FROM styles WHERE id = $1 AND (is_public = true OR user_id = $2)"
    )
    .bind(id)
    .bind(user_id)
    .fetch_optional(&state.db)
    .await
    .unwrap_or(None);

    match style {
        Some(s) => Json(process_style_metadata(s)).into_response(),
        None => (axum::http::StatusCode::NOT_FOUND, "Style not found").into_response(),
    }
}

async fn create_style(
    State(state): State<Arc<AppState>>,
    user: auth::AuthenticatedUser,
    Json(payload): Json<StyleIntent>
) -> Json<StyleRow> {
    let style_obj = payload.to_style();
    let title = style_obj.info.title.clone().unwrap_or_else(|| "Untitled Style".to_string());
    let citum = serde_yaml::to_string(&style_obj).unwrap_or_default();
    let intent_val = serde_json::to_value(&payload).unwrap();

    let style = sqlx::query_as::<_, StyleRow>(
        "INSERT INTO styles (user_id, title, intent, citum, is_public) VALUES ($1, $2, $3, $4, false) RETURNING id, user_id, title, intent, citum, is_public, created_at, updated_at"
    )
    .bind(user.id)
    .bind(title)
    .bind(intent_val)
    .bind(citum)
    .fetch_one(&state.db)
    .await
    .expect("Failed to create style");

    Json(process_style_metadata(style))
}

async fn update_style(
    State(state): State<Arc<AppState>>,
    user: auth::AuthenticatedUser,
    Path(id): Path<Uuid>,
    Json(payload): Json<StyleIntent>
) -> Json<StyleRow> {
    let style_obj = payload.to_style();
    let title = style_obj.info.title.clone().unwrap_or_else(|| "Untitled Style".to_string());
    let citum = serde_yaml::to_string(&style_obj).unwrap_or_default();
    let intent_val = serde_json::to_value(&payload).unwrap();
    let is_public = true;

    let style = sqlx::query_as::<_, StyleRow>(
        "UPDATE styles SET title = $1, intent = $2, citum = $3, is_public = $4, updated_at = NOW() WHERE id = $5 AND user_id = $6 RETURNING id, user_id, title, intent, citum, is_public, created_at, updated_at"
    )
    .bind(title)
    .bind(intent_val)
    .bind(citum)
    .bind(is_public)
    .bind(id)
    .bind(user.id)
    .fetch_one(&state.db)
    .await
    .expect("Failed to update style");

    Json(process_style_metadata(style))
}

async fn fork_style(
    State(state): State<Arc<AppState>>,
    user: auth::AuthenticatedUser,
    Path(id): Path<Uuid>
) -> impl IntoResponse {
    let original = sqlx::query!(
        "SELECT title, intent, citum FROM styles WHERE id = $1 AND (is_public = true OR user_id = $2)",
        id,
        user.id
    )
    .fetch_optional(&state.db)
    .await
    .expect("Failed to fetch original style");

    match original {
        Some(orig) => {
            let style = sqlx::query_as::<_, StyleRow>(
                "INSERT INTO styles (user_id, title, intent, citum, is_public) VALUES ($1, $2, $3, $4, false) RETURNING id, user_id, title, intent, citum, is_public, created_at, updated_at"
            )
            .bind(user.id)
            .bind(format!("{} (Fork)", orig.title))
            .bind(orig.intent)
            .bind(orig.citum)
            .fetch_one(&state.db)
            .await
            .expect("Failed to fork style");
            Json(process_style_metadata(style)).into_response()
        },
        None => (axum::http::StatusCode::NOT_FOUND, "Style not found").into_response(),
    }
}

async fn bookmark_style(
    State(state): State<Arc<AppState>>,
    user: auth::AuthenticatedUser,
    Path(id): Path<Uuid>
) -> impl IntoResponse {
    sqlx::query!(
        "INSERT INTO bookmarks (user_id, style_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        user.id,
        id
    )
    .execute(&state.db)
    .await
    .expect("Failed to bookmark style");
    axum::http::StatusCode::OK
}

async fn list_bookmarks(
    State(state): State<Arc<AppState>>,
    user: auth::AuthenticatedUser
) -> Json<Vec<StyleRow>> {
    let styles = sqlx::query_as::<_, StyleRow>(
        "SELECT s.id, s.user_id, s.title, s.intent, s.citum, s.is_public, s.created_at, s.updated_at 
         FROM styles s JOIN bookmarks b ON s.id = b.style_id 
         WHERE b.user_id = $1 ORDER BY s.updated_at DESC"
    )
    .bind(user.id)
    .fetch_all(&state.db)
    .await
    .unwrap_or_default();

    let styles = styles.into_iter().map(process_style_metadata).collect();
    Json(styles)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn saved_author_date_styles_render_parenthetical_and_narrative_previews() {
        let style: Style = serde_json::from_value(json!({
            "info": {
                "title": "Saved Author-Date Style"
            },
            "options": {
                "processing": "author-date"
            },
            "citation": {
                "use-preset": "apa"
            },
            "bibliography": {
                "use-preset": "apa"
            }
        }))
        .expect("style should deserialize");

        let preview = generate_preview_set_internal(&style, "in_text", None);

        let parenthetical = preview
            .in_text_parenthetical
            .expect("expected parenthetical preview for saved style");
        let narrative = preview
            .in_text_narrative
            .expect("expected narrative preview for saved style");
        let bibliography = preview
            .bibliography
            .expect("expected bibliography preview for saved style");

        assert!(
            parenthetical.contains('('),
            "parenthetical preview should include parentheses: {parenthetical}"
        );
        assert!(
            !narrative.trim().is_empty(),
            "narrative preview should not be empty"
        );
        assert!(
            !bibliography.trim().is_empty(),
            "bibliography preview should not be empty"
        );
    }
}

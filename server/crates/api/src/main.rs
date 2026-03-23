/*
SPDX-License-Identifier: AGPL-3.0-or-later
SPDX-FileCopyrightText: © 2023-2026 Bruce D'Arcus
*/

#![warn(missing_docs)]

//! Citum Hub API standalone server.
//!
//! Provides API endpoints for rendering citations and bibliographies, 
//! exposing the functionality of `citum_engine` over HTTP.

use axum::{
    extract::State,
    routing::post,
    Router,
    Json,
};
use std::net::SocketAddr;
use std::sync::Arc;
use std::collections::HashMap;
use citum_schema::citation::{CitationLocator, LocatorSegment, LocatorType, LocatorValue};
use citum_engine::{Processor, Reference, Bibliography, Citation, CitationItem};
use citum_engine::render::html::Html;
use serde::{Deserialize, Serialize};
use intent_engine::{StyleIntent, DecisionPackage};

/// Shared application state for the standalone API server.
struct AppState {
    /// In-memory cache of default references for preview generation.
    references: HashMap<String, Reference>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let state = Arc::new(AppState {
        references: HashMap::new(), // In a real app, populate this from a file or DB
    });

    let app = Router::new()
        .route("/api/v1/preview", post(preview_set_handler))
        .route("/api/v1/decide", post(decide_handler))
        .route("/api/v1/generate", post(generate_handler))
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    println!("Citum Hub Standalone API listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

/// A comprehensive set of previews for different citation modes.
#[derive(Default, Serialize, Deserialize)]
struct PreviewSet {
    /// Rendered parenthetical in-text citation preview.
    in_text_parenthetical: Option<String>,
    /// Rendered narrative in-text citation preview.
    in_text_narrative: Option<String>,
    /// Rendered footnote or endnote citation preview.
    note: Option<String>,
    /// Rendered bibliography preview.
    bibliography: Option<String>,
}

async fn preview_set_handler(
    State(state): State<Arc<AppState>>,
    Json(intent): Json<StyleIntent>
) -> Json<PreviewSet> {
    Json(generate_preview_set(&intent, &state.references))
}

fn generate_preview_set(intent: &StyleIntent, references: &HashMap<String, Reference>) -> PreviewSet {
    let mut set = PreviewSet::default();
    let style = intent.to_style();
    
    // Choose references based on field intent
    let standard_item_id = match intent.field.as_deref() {
        Some("sciences") => "watson1953",
        Some("humanities") => "manuscript1800",
        Some("social_science") => "smith2010",
        _ => "kuhn1962",
    };

    let mut cite_ids_1 = vec!["doe2020a".to_string(), "doe2020b".to_string()];
    if references.contains_key(standard_item_id) {
        cite_ids_1.push(standard_item_id.to_string());
    } else {
        cite_ids_1.push("kuhn1962".to_string());
    }

    let cite_ids_2 = ["genetics1999".to_string()];

    // Make sure we have these references
    let mut bib_refs = Vec::new();
    for id in cite_ids_1.iter().chain(cite_ids_2.iter()) {
        if let Some(r) = references.get(id) {
            bib_refs.push((id.clone(), r.clone()));
        }
    }

    if bib_refs.is_empty() {
        return set;
    }

    let bib: Bibliography = bib_refs.into_iter().collect();
    let processor = Processor::new(style, bib);
    
    // Citation 1: Disambiguation + standard
    let items_1: Vec<CitationItem> = cite_ids_1.iter().map(|id| {
        CitationItem { 
            id: id.clone(), 
            ..Default::default() 
        }
    }).collect();

    // Citation 2: Et al + locators
    let items_2: Vec<CitationItem> = cite_ids_2.iter().map(|id| {
        CitationItem { 
            id: id.clone(), 
            locator: Some(CitationLocator::Single(LocatorSegment {
                label: LocatorType::Page,
                value: LocatorValue::Text("15-18".to_string()),
            })),
            ..Default::default() 
        }
    }).collect();

    // --- Parenthetical Citations ---
    let mut parenthetical_citations = vec![];
    
    let cite1_paren = Citation {
        id: Some("preview-parenthetical-1".to_string()),
        items: items_1.clone(),
        ..Default::default()
    };
    if let Ok(res) = processor.process_citation_with_format::<Html>(&cite1_paren) {
        if !res.trim().is_empty() { parenthetical_citations.push(res); }
    }

    let cite2_paren = Citation {
        id: Some("preview-parenthetical-2".to_string()),
        position: Some(citum_schema::citation::Position::Subsequent),
        items: items_2.clone(),
        ..Default::default()
    };
    if let Ok(res) = processor.process_citation_with_format::<Html>(&cite2_paren) {
        if !res.trim().is_empty() { parenthetical_citations.push(res); }
    }

    // --- Narrative Citations ---
    let mut narrative_citations = vec![];

    let cite1_narrative = Citation {
        id: Some("preview-narrative-1".to_string()),
        mode: citum_schema::CitationMode::Integral,
        items: items_1.clone(),
        ..Default::default()
    };
    if let Ok(res) = processor.process_citation_with_format::<Html>(&cite1_narrative) {
        if !res.trim().is_empty() { narrative_citations.push(res); }
    }

    let cite2_narrative = Citation {
        id: Some("preview-narrative-2".to_string()),
        mode: citum_schema::CitationMode::Integral,
        position: Some(citum_schema::citation::Position::Subsequent),
        items: items_2.clone(),
        ..Default::default()
    };
    if let Ok(res) = processor.process_citation_with_format::<Html>(&cite2_narrative) {
        if !res.trim().is_empty() { narrative_citations.push(res); }
    }

    // Output both narrative and parenthetical for ALL classes.
    let parenthetical_preview = parenthetical_citations.join("; ");
    let narrative_preview = narrative_citations.join("; ");
    
    if !parenthetical_preview.is_empty() {
        set.in_text_parenthetical = Some(parenthetical_preview.clone());
    }
    if !narrative_preview.is_empty() {
        set.in_text_narrative = Some(narrative_preview);
    }

    // For Note styles, explicitly provide the note body using the parenthetical generation
    match intent.class {
        Some(intent_engine::CitationClass::Footnote) | Some(intent_engine::CitationClass::Endnote) => {
            if !parenthetical_preview.is_empty() {
                set.note = Some(parenthetical_citations.join("<br>"));
            }
        },
        _ => {}
    }

    // Bibliography
    if intent.has_bibliography == Some(true) || intent.has_bibliography.is_none() {
        let bib_res = processor.render_bibliography_with_format::<Html>();
        let bib_str = bib_res.trim();
        if !bib_str.is_empty() {
            set.bibliography = Some(bib_str.to_string());
        }
    }
    
    set
}

async fn decide_handler(
    State(state): State<Arc<AppState>>,
    Json(intent): Json<StyleIntent>
) -> Json<DecisionPackage> {
    let mut package = intent.decide();

    let current_previews = generate_preview_set(&intent, &state.references);
    package.in_text_parenthetical = current_previews.in_text_parenthetical;
    package.in_text_narrative = current_previews.in_text_narrative;
    package.note = current_previews.note;
    package.bibliography = current_previews.bibliography;

    for preview in &mut package.previews {
        match serde_json::to_value(&intent) {
            Ok(mut intent_val) => {
                if let Some(obj) = intent_val.as_object_mut() {
                    if let Some(choice_obj) = preview.choice_value.as_object() {
                        for (k, v) in choice_obj {
                            obj.insert(k.clone(), v.clone());
                        }
                    }
                }

                if let Ok(temp_intent) = serde_json::from_value::<StyleIntent>(intent_val) {
                    let p_set = generate_preview_set(&temp_intent, &state.references);
                    let mut html = String::new();
                    if let Some(it) = p_set.in_text_parenthetical { html.push_str(&format!("<div class='preview-cit-p'>{}</div>", it)); }
                    if let Some(itn) = p_set.in_text_narrative { html.push_str(&format!("<div class='preview-cit-n mt-2'>{}</div>", itn)); }
                    if let Some(nt) = p_set.note { html.push_str(&format!("<div class='preview-note'>{}</div>", nt)); }
                    if let Some(bb) = p_set.bibliography { html.push_str(&format!("<div class='preview-bib'>{}</div>", bb)); }
                    preview.html = html;
                }
            },
            Err(e) => println!("Error serializing intent: {}", e),
        }
    }

    Json(package)
}

async fn generate_handler(Json(intent): Json<StyleIntent>) -> (axum::http::HeaderMap, String) {
    let style = intent.to_style();
    let citum = serde_yaml::to_string(&style).unwrap_or_else(|_| "# Error generating Citum".to_string());
    
    let mut headers = axum::http::HeaderMap::new();
    headers.insert(
        axum::http::header::CONTENT_TYPE,
        axum::http::HeaderValue::from_static("application/x-yaml"),
    );
    headers.insert(
        axum::http::header::CONTENT_DISPOSITION,
        axum::http::HeaderValue::from_static("attachment; filename=\"custom-style.yaml\""),
    );

    (headers, citum)
}

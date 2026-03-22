//! Authentication utilities for the Citum Hub server.
//!
//! Provides GitHub OAuth integration, JWT creation/validation, and Axum extractors
//! for protecting routes with user authentication.

use oauth2::{
    basic::BasicClient, AuthUrl, ClientId, ClientSecret, CsrfToken, RedirectUrl, Scope, TokenUrl,
};

/// Generates the GitHub authorization URL and a CSRF token for the OAuth flow.
pub fn get_auth_url(client: &BasicClient) -> (oauth2::url::Url, CsrfToken) {
    client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("user:email".to_string()))
        .url()
}
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// JWT claims representing an authenticated user session.
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// The subject (user ID) of the token.
    pub sub: Uuid,
    /// Expiration timestamp of the token.
    pub exp: i64,
    /// The user's role (e.g., "user", "admin").
    pub role: String,
}

/// A user record from the database.
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    /// The unique UUID of the user.
    pub id: Uuid,
    /// The user's email address (typically from GitHub).
    pub email: String,
    /// The user's authorization role.
    pub role: String,
}

/// Initializes the GitHub OAuth client using environment variables.
pub fn create_oauth_client() -> BasicClient {
    let client_id = std::env::var("GITHUB_CLIENT_ID").expect("GITHUB_CLIENT_ID must be set");
    let client_secret =
        std::env::var("GITHUB_CLIENT_SECRET").expect("GITHUB_CLIENT_SECRET must be set");

    let mut client = BasicClient::new(
        ClientId::new(client_id),
        Some(ClientSecret::new(client_secret)),
        AuthUrl::new("https://github.com/login/oauth/authorize".to_string()).unwrap(),
        Some(TokenUrl::new("https://github.com/login/oauth/access_token".to_string()).unwrap()),
    );

    if let Ok(url) = std::env::var("REDIRECT_URL") {
        println!("Using REDIRECT_URL: {}", url);
        client = client.set_redirect_uri(RedirectUrl::new(url).unwrap());
    }

    client
}

/// Creates a JSON Web Token for the specified user and role, valid for 7 days.
pub fn create_jwt(user_id: Uuid, role: &str) -> String {
    let expiration = Utc::now()
        .checked_add_signed(Duration::days(7))
        .expect("valid timestamp")
        .timestamp();

    let claims = Claims {
        sub: user_id,
        exp: expiration,
        role: role.to_string(),
    };

    let secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_ref()),
    )
    .unwrap()
}

/// Decodes and validates a JSON Web Token, returning the underlying claims if valid.
pub fn decode_jwt(token: &str) -> Result<Claims, String> {
    let secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::new(Algorithm::HS256),
    )
    .map(|data| data.claims)
    .map_err(|e| e.to_string())
}

/// Response payload from the GitHub user API.
#[derive(Debug, Deserialize)]
pub struct GithubUser {
    /// The unique GitHub user ID.
    pub id: i64,
    /// The user's primary email address (if publicly available or scoped).
    pub email: Option<String>,
    /// The user's GitHub login username.
    pub login: String,
}

use axum::{async_trait, extract::FromRequestParts, http::request::Parts};

/// Axum extractor for routes requiring an authenticated user.
/// Rejects requests with 401 Unauthorized if a valid token is missing.
pub struct AuthenticatedUser {
    /// The UUID of the authenticated user.
    pub id: Uuid,
    /// The user's assigned role.
    pub _role: String,
}

/// Axum extractor for routes where user authentication is optional.
/// Never rejects requests; instead provides `None` if unauthenticated.
pub struct OptionalUser(pub Option<Uuid>);

#[async_trait]
impl<S> FromRequestParts<S> for OptionalUser
where
    S: Send + Sync,
{
    type Rejection = (axum::http::StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|h| h.to_str().ok());

        if let Some(header) = auth_header {
            if let Some(token) = header.strip_prefix("Bearer ") {
                if let Ok(claims) = decode_jwt(token) {
                    return Ok(OptionalUser(Some(claims.sub)));
                }
            }
        }

        Ok(OptionalUser(None))
    }
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = (axum::http::StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|h| h.to_str().ok())
            .ok_or((
                axum::http::StatusCode::UNAUTHORIZED,
                "Missing authorization header".to_string(),
            ))?;

        let token = auth_header.strip_prefix("Bearer ").ok_or((
            axum::http::StatusCode::UNAUTHORIZED,
            "Invalid authorization header".to_string(),
        ))?;

        let claims = decode_jwt(token).map_err(|e| {
            (
                axum::http::StatusCode::UNAUTHORIZED,
                format!("Invalid token: {}", e),
            )
        })?;

        Ok(AuthenticatedUser {
            id: claims.sub,
            _role: claims.role,
        })
    }
}

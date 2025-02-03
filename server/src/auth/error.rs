use actix_session::{SessionGetError, SessionInsertError};

use actix_web::http::StatusCode;
use thiserror::Error;
use webauthn_rs::prelude::WebauthnError;

// pub(crate) mod auth;
// pub(crate) mod index;
// pub(crate) mod serve_wasm;

/**
Type alias for Errors that implement [actix_web::ResponseError] through [Error]
*/
pub type WebResult<T> = Result<T, Error>;

/**
Unified errors for simpler Responses
*/
#[derive(Debug, Error)]
pub enum Error {
    #[error("Unknown webauthn error")]
    Unknown(WebauthnError),
    #[error("Corrupt session")]
    SessionGet(#[from] SessionGetError),
    #[error("Corrupt session")]
    SessionInsert(#[from] SessionInsertError),
    #[error("Corrupt session")]
    CorruptSession,
    #[error("Bad request")]
    BadRequest(#[from] WebauthnError),
    #[error("User not found")]
    UserNotFound,
    #[error("User has no credentials")]
    UserHasNoCredentials,
    #[error("Database error")]
    DatabaseError(#[from] sqlx::Error),
    #[error("Invalid poll options")]
    InvalidPollOptions,
    #[error("Poll already closed")]
    PollClosed,
    #[error("Poll not found")]
    PollNotFound,
    #[error("User not authorized")]
    Unauthorized,
    #[error("User already voted")]
    AlreadyVoted,
    #[error("User did not vote")]
    VoteNotFound,
    #[error("User already exists")]
    UserExists,
}

impl actix_web::ResponseError for Error {
    fn status_code(&self) -> StatusCode {
        match *self {
            Error::Unknown(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Error::SessionGet(_) | Error::SessionInsert(_) | Error::CorruptSession => {
                StatusCode::BAD_REQUEST
            }
            Error::BadRequest(_) => StatusCode::BAD_REQUEST,
            Error::UserNotFound => StatusCode::NOT_FOUND,
            Error::UserHasNoCredentials => StatusCode::BAD_REQUEST,
            Error::DatabaseError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Error::InvalidPollOptions => StatusCode::BAD_REQUEST,
            Error::PollClosed => StatusCode::BAD_REQUEST,
            Error::PollNotFound => StatusCode::NOT_FOUND,
            Error::Unauthorized => StatusCode::UNAUTHORIZED,
            Error::AlreadyVoted => StatusCode::BAD_REQUEST,
            Error::VoteNotFound => StatusCode::NOT_FOUND,
            Error::UserExists => StatusCode::BAD_REQUEST,
        }
    }
}

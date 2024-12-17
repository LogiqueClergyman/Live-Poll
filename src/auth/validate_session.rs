use actix_session::Session;
use actix_web::{error::ErrorBadRequest, HttpResponse};
use super::error::Error;
use webauthn_rs::prelude::*;
pub fn validate_session(session: &Session) -> Result<Uuid, Error> {
    let user_id: Option<Uuid> = session.get("user_id").unwrap_or(None);

    match user_id {
        Some(id) => {
            // keep the user's session alive
            session.renew();
            Ok(id)
        }
        None => Err(Error::Unauthorized),
    }
}

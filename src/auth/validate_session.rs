use super::error::Error;
use actix_session::Session;
use actix_web::{error::ErrorBadRequest, HttpResponse};
use log::warn;
use webauthn_rs::prelude::*;
pub fn validate_session(session: &Session) -> Result<Uuid, Error> {
    warn!("\x1b[32mSession before voting: {:?}\x1b[0m", session.entries());
    let user_id: Option<Uuid> = session.get("user_id").unwrap_or(None);

    let id = match user_id {
        Some(id) => {
            // keep the user's session alive
            session.renew();
            session.insert("user_id", user_id).unwrap();
            Ok(id)
        }
        None => Err(Error::Unauthorized),
    }?;
    warn!("\x1b[32mSession after voting: {:?}\x1b[0m", session.entries());
    Ok(id)
}

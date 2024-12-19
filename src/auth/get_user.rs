use super::error::WebResult;
use super::validate_session::validate_session;
use actix_session::Session;
use actix_web::HttpResponse;
use log::warn;

pub async fn get_user(session: Session) -> WebResult<HttpResponse> {
    warn!("its coming here. {:?}", session.entries());
    let user_id = validate_session(&session)?;

    Ok(HttpResponse::Ok().json(user_id))
}

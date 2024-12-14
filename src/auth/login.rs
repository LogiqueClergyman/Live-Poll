use super::error::{Error, WebResult};
use super::startup::UserData;
use actix_session::Session;
use actix_web::web::{Data, Json, Path};
use actix_web::HttpResponse;
use log::{error, info};
use serde::Deserialize;
use tokio::sync::Mutex;

/*
 * Webauthn RS auth handlers.
 * These files use webauthn to process the data received from each route, and are closely tied to actix_web
 */

// 1. Import the prelude - this contains everything needed for the server to function.
use webauthn_rs::prelude::*;

#[derive(Deserialize)]
pub struct RegisterRequest {
    username: String,
}

pub async fn start_authentication(
    req: Json<RegisterRequest>,
    session: Session,
    webauthn_users: Data<Mutex<UserData>>,
    webauthn: Data<Webauthn>,
) -> WebResult<Json<RequestChallengeResponse>> {
    info!("Start Authentication");
    let username = req.username.clone();
    // We get the username from the URL, but you could get this via form submission or
    // some other process.
    println!("Username: {}", username);
    // Remove any previous authentication that may have occurred from the session.
    info!("User: {}", username);
    session.remove("auth_state");
    // Get the set of keys that the user possesses
    let users_guard = webauthn_users.lock().await;

    // Look up their unique id from the username
    let user_unique_id = users_guard
        .name_to_id
        .get(username.as_str())
        .copied()
        .ok_or(Error::UserNotFound)?;
    info!("User ID: {}", user_unique_id);
    let allow_credentials = users_guard
        .keys
        .get(&user_unique_id)
        .ok_or(Error::UserHasNoCredentials)?;
    info!("Allow Credentials: {:?}", allow_credentials);
    let (rcr, auth_state) = webauthn
        .start_passkey_authentication(allow_credentials)
        .map_err(|e| {
            info!("challenge_authenticate -> {:?}", e);
            Error::Unknown(e)
        })?;

    // Drop the mutex to allow the mut borrows below to proceed
    drop(users_guard);
    info!("Auth State: {:?}", auth_state);
    // Note that due to the session store in use being a server side memory store, this is
    // safe to store the auth_state into the session since it is not client controlled and
    // not open to replay attacks. If this was a cookie store, this would be UNSAFE.
    session.insert("auth_state", (user_unique_id, auth_state))?;
    info!("Login initiated");
    Ok(Json(rcr))
}

// 5. The browser and user have completed their part of the processing. Only in the
// case that the webauthn authenticate call returns Ok, is authentication considered
// a success. If the browser does not complete this call, or *any* error occurs,
// this is an authentication failure.

pub async fn finish_authentication(
    auth: Json<PublicKeyCredential>,
    session: Session,
    webauthn_users: Data<Mutex<UserData>>,
    webauthn: Data<Webauthn>,
) -> WebResult<HttpResponse> {
    let (user_unique_id, auth_state) = session.get("auth_state")?.ok_or(Error::CorruptSession)?;

    session.remove("auth_state");

    let auth_result = webauthn
        .finish_passkey_authentication(&auth, &auth_state)
        .map_err(|e| {
            info!("challenge_register -> {:?}", e);
            Error::BadRequest(e)
        })?;

    let mut users_guard = webauthn_users.lock().await;

    // Update the credential counter, if possible.
    users_guard
        .keys
        .get_mut(&user_unique_id)
        .map(|keys| {
            keys.iter_mut().for_each(|sk| {
                // This will update the credential if it's the matching
                // one. Otherwise it's ignored. That is why it is safe to
                // iterate this over the full list.
                sk.update_credential(&auth_result);
            })
        })
        .ok_or(Error::UserHasNoCredentials)?;

    info!("Authentication Successful!");
    Ok(HttpResponse::Ok().finish())
}

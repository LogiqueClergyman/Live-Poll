use super::error::{Error, WebResult};
use super::startup::UserData;
use crate::db::auth::{get_user_id, store_passkey, store_username};
use actix_session::Session;
use actix_web::web::{self, Data, Json, Path};
use actix_web::HttpResponse;
use log::{error, info};
use serde::Deserialize;
use sqlx::{types::Uuid, PgPool};
use tokio::sync::Mutex;
use webauthn_rs::prelude::*;

#[derive(Deserialize)]
pub struct RegisterRequest {
    username: String,
}

pub async fn start_register(
    req: Json<RegisterRequest>,
    session: Session,
    webauthn_users: Data<Mutex<UserData>>,
    webauthn: Data<Webauthn>,
    pool: Data<PgPool>,
) -> WebResult<Json<CreationChallengeResponse>> {
    info!("Start register");
    let username = req.username.clone();
    match get_user_id(&pool, &username).await {
        Ok(_) => return Err(Error::UserExists),
        Err(e) if matches!(e, sqlx::Error::RowNotFound) => false,
        Err(e) => return Err(Error::DatabaseError(e)),
    };
    match webauthn_users.lock().await.name_to_id.get(&username) {
        Some(_) => return Err(Error::UserExists),
        None => false,
    };
    // We get the username from the URL, but you could get this via form submission or
    // some other process. In some parts of Webauthn, you could also use this as a "display name"
    // instead of a username. Generally you should consider that the user *can* and *will* change
    // their username at any time.

    // Since a user's username could change at anytime, we need to bind to a unique id.
    // We use uuid's for this purpose, and you should generate these randomly. If the
    // username does exist and is found, we can match back to our unique id. This is
    // important in authentication, where presented credentials may *only* provide
    // the unique id, and not the username!
    let user_unique_id = {
        let users_guard = webauthn_users.lock().await;
        users_guard
            .name_to_id
            .get(username.as_str())
            .copied()
            .unwrap_or_else(Uuid::new_v4)
    };

    // Remove any previous registrations that may have occurred from the session.
    session.remove("reg_state");

    // If the user has any other credentials, we exclude these here so they can't be duplicate registered.
    // It also hints to the browser that only new credentials should be "blinked" for interaction.
    let exclude_credentials = {
        let users_guard = webauthn_users.lock().await;
        users_guard
            .keys
            .get(&user_unique_id)
            .map(|keys| keys.iter().map(|sk| sk.cred_id().clone()).collect())
    };

    let (ccr, reg_state) = webauthn
        .start_passkey_registration(user_unique_id, &username, &username, exclude_credentials)
        .map_err(Error::Unknown)?;

    // Note that due to the session store in use being a server side memory store, this is
    // safe to store the reg_state into the session since it is not client controlled and
    // not open to replay attacks. If this was a cookie store, this would be UNSAFE.
    if let Err(err) = session.insert("reg_state", (username.as_str(), user_unique_id, reg_state)) {
        error!("Failed to save reg_state to session storage!");
        return Err(Error::SessionInsert(err));
    };
    Ok(Json(ccr))
}

// 3. The browser has completed it's steps and the user has created a public key
// on their device. Now we have the registration options sent to us, and we need
// to verify these and persist them.

pub async fn finish_register(
    req: Json<RegisterPublicKeyCredential>,
    session: Session,
    webauthn_users: Data<Mutex<UserData>>,
    webauthn: Data<Webauthn>,
    pool: Data<PgPool>,
) -> WebResult<HttpResponse> {
    let (username, user_unique_id, reg_state): (String, Uuid, PasskeyRegistration) =
        match session.get("reg_state")? {
            Some((username, user_unique_id, reg_state)) => (username, user_unique_id, reg_state),
            None => return Err(Error::CorruptSession),
        };
    session.remove("reg_state");
    let sk = webauthn
        .finish_passkey_registration(&req, &reg_state)
        .map_err(Error::BadRequest)?;

    let mut users_guard = webauthn_users.lock().await;

    users_guard
        .keys
        .entry(user_unique_id)
        .and_modify(|keys| keys.push(sk.clone()))
        .or_insert_with(|| vec![sk.clone()]);

    users_guard
        .name_to_id
        .insert(username.clone(), user_unique_id);

    store_username(&pool, &username, user_unique_id)
        .await
        .map_err(Error::DatabaseError)?;

    store_passkey(&pool, &sk, user_unique_id)
        .await
        .map_err(Error::DatabaseError)?;

    Ok(HttpResponse::Ok().finish())
}

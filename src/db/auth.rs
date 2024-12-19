use sqlx::{types::Uuid, PgPool};
use webauthn_rs::prelude::*;

pub async fn store_passkey(
    pool: &PgPool,
    passkey: &Passkey,
    user_id: Uuid,
) -> Result<(), sqlx::Error> {
    let passkey = serde_json::to_vec(passkey).unwrap();
    sqlx::query!(
        r#"
        INSERT INTO passkeys (user_id, key_data)
        VALUES ($1, $2)
        "#,
        user_id,
        passkey
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn store_username(
    pool: &PgPool,
    username: &str,
    user_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO users (id, username)
        VALUES ($1, $2)
        RETURNING id
        "#,
    )
    .bind(user_id)
    .bind(username)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_username(pool: &PgPool, user_id: Uuid) -> Result<String, sqlx::Error> {
    let row = sqlx::query!(
        r#"
        SELECT username FROM users WHERE id = $1
        "#,
        user_id
    )
    .fetch_one(pool)
    .await?;

    Ok(row.username)
}

pub async fn get_user_id(pool: &PgPool, username: &str) -> Result<Uuid, sqlx::Error> {
    let row = sqlx::query!(
        r#"
        SELECT id FROM users WHERE username = $1
        "#,
        username
    )
    .fetch_one(pool)
    .await?;

    Ok(row.id)
}

pub async fn get_passkey(pool: &PgPool, user_id: Uuid) -> Result<Vec<Passkey>, sqlx::Error> {
    let rows = sqlx::query!(
        r#"
        SELECT key_data FROM passkeys WHERE user_id = $1
        "#,
        user_id
    )
    .fetch_all(pool)
    .await?;

    Ok(rows
        .iter()
        .map(|row| serde_json::from_slice::<Passkey>(&row.key_data).unwrap())
        .collect())
}

pub async fn update_credentials(
    pool: &PgPool,
    user_id: Uuid,
    auth_result: &AuthenticationResult,
) -> Result<(), sqlx::Error> {
    let mut passkeys = get_passkey(pool, user_id).await?;
    if passkeys.is_empty() {
        return Err(sqlx::Error::RowNotFound);
    }
    passkeys.iter_mut().for_each(|passkey| {
        passkey.update_credential(&auth_result);
    });
    Ok(())
}

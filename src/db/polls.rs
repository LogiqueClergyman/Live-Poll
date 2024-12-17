use serde::Serialize;
use sqlx::{types::Uuid, PgPool};

pub async fn create_poll(
    pool: &PgPool,
    poll_id: Uuid,
    user_id: Uuid,
    poll_name: &str,
    poll_description: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        INSERT INTO polls (id, user_id, title, description)
        VALUES ($1, $2, $3, $4)
        "#,
        poll_id,
        user_id,
        poll_name,
        poll_description
    )
    .execute(pool)
    .await?;
    Ok(())
}

// pub async fn update_poll(pool: &PgPool, poll_id: Uuid, new_title: &str, new_description: &str) -> Result<(), sqlx::Error>{
//     sqlx::query!(
//         r#"
//         UPDATE polls
//         SET title = $1, description = $2
//         WHERE id = $3
//         "#,
//         new_title,
//         new_description,
//         poll_id
//     )().execute(pool).await?;
//     Ok(())
// }

pub async fn create_option(
    pool: &PgPool,
    option_id: Uuid,
    poll_id: Uuid,
    option_text: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        INSERT INTO poll_options (id, poll_id, option_text)
        VALUES ($1, $2, $3)
        "#,
        option_id,
        poll_id,
        option_text
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn close_poll(pool: &PgPool, poll_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        UPDATE polls SET is_active = FALSE WHERE id = $1
        "#,
        poll_id
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn reset_votes(pool: &PgPool, poll_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        DELETE FROM votes WHERE poll_option_id IN (SELECT id FROM poll_options WHERE poll_id = $1)
        "#,
        poll_id
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_poll_options(pool: &PgPool, poll_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        DELETE FROM poll_options WHERE id = $1
        "#,
        poll_id
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_poll(pool: &PgPool, poll_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        DELETE FROM polls WHERE id = $1
        "#,
        poll_id
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_votes(pool: &PgPool, poll_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        DELETE FROM votes WHERE poll_option_id IN (SELECT id FROM poll_options WHERE poll_id = $1)
        "#,
        poll_id
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn vote(pool: &PgPool, poll_option_id: Uuid, user_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        INSERT INTO votes (user_id, poll_option_id)
        VALUES ($1, $2)
        "#,
        user_id,
        poll_option_id
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_vote(
    pool: &PgPool,
    poll_option_id: Uuid,
    user_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        DELETE FROM votes WHERE user_id = $1 AND poll_option_id = $2
        "#,
        user_id,
        poll_option_id
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn increase_vote_count(pool: &PgPool, poll_option_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        UPDATE poll_options
        SET votes_count = votes_count + 1
        WHERE id = $1
        "#,
        poll_option_id
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn decrease_vote_count(pool: &PgPool, poll_option_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query!(
        r#"
        UPDATE poll_options
        SET votes_count = votes_count - 1
        WHERE id = $1
        "#,
        poll_option_id
    )
    .execute(pool)
    .await?;
    Ok(())
}

#[derive(sqlx::FromRow)]
pub struct Poll {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: Option<String>,
    pub description: Option<String>,
    pub is_active: Option<bool>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

pub async fn get_poll(pool: &PgPool, poll_id: Uuid) -> Result<Poll, sqlx::Error> {
    let poll = sqlx::query_as!(
        Poll,
        r#"
        SELECT * FROM polls WHERE id = $1
        "#,
        poll_id
    )
    .fetch_one(pool)
    .await?;
    Ok(poll)
}

#[derive(sqlx::FromRow, Serialize)]
pub struct PollOption {
    pub id: Uuid,
    pub poll_id: Uuid,
    pub option_text: String,
    pub votes_count: Option<i32>,
}
pub async fn get_poll_options_data(
    pool: &PgPool,
    poll_id: Uuid,
) -> Result<Vec<PollOption>, sqlx::Error> {
    let poll_options = sqlx::query_as!(
        PollOption,
        r#"
        SELECT * FROM poll_options WHERE poll_id = $1
        "#,
        poll_id
    )
    .fetch_all(pool)
    .await?;
    Ok(poll_options)
}

pub async fn is_poll_active(pool: &PgPool, poll_id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query!(
        r#"
        SELECT is_active FROM polls WHERE id = $1
        "#,
        poll_id
    )
    .fetch_optional(pool)
    .await?;

    match result {
        Some(record) => match record.is_active {
            Some(true) => Ok(true),
            Some(false) => Ok(false),
            None => Err(sqlx::Error::RowNotFound),
        },
        None => Err(sqlx::Error::RowNotFound),
    }
}

pub async fn has_user_voted(
    pool: &PgPool,
    poll_option_id: Uuid,
    user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let vote = sqlx::query!(
        r#"
        SELECT EXISTS(SELECT 1 FROM votes WHERE user_id = $1 AND poll_option_id = $2)
        "#,
        user_id,
        poll_option_id
    )
    .fetch_one(pool)
    .await?;
    Ok(match vote.exists {
        Some(true) => true,
        Some(false) => false,
        None => false,
    })
}

pub async fn does_poll_exist(pool: &PgPool, poll_id: Uuid) -> Result<Uuid, sqlx::Error> {
    let result = sqlx::query!(
        r#"
        SELECT user_id FROM polls WHERE id = $1
        "#,
        poll_id
    )
    .fetch_optional(pool)
    .await?;

    match result {
        Some(record) => Ok(record.user_id),
        None => Err(sqlx::Error::RowNotFound),
    }
}

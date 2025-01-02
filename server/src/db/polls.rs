use serde::{Deserialize, Serialize};
use sqlx::{types::Uuid, PgPool, Row};
pub async fn create_poll(
    pool: &PgPool,
    poll_id: Uuid,
    user_id: Uuid,
    poll_name: &str,
    poll_description: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO polls (id, user_id, title, description)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(poll_id)
    .bind(user_id)
    .bind(poll_name)
    .bind(poll_description)
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
    option_text: String,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO poll_options (id, poll_id, option_text)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(option_id)
    .bind(poll_id)
    .bind(option_text)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn close_poll(pool: &PgPool, poll_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE polls SET is_active = FALSE WHERE id = $1
        "#,
    )
    .bind(poll_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_votes(pool: &PgPool, poll_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM votes WHERE poll_option_id IN (SELECT id FROM poll_options WHERE poll_id = $1)
        "#,
    )
    .bind(poll_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn reset_votes_count(pool: &PgPool, poll_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE poll_options SET votes_count = 0 WHERE poll_id = $1
        "#,
    )
    .bind(poll_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_poll_options(pool: &PgPool, poll_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM poll_options WHERE id = $1
        "#,
    )
    .bind(poll_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_poll(pool: &PgPool, poll_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM polls WHERE id = $1
        "#,
    )
    .bind(poll_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn vote(
    pool: &PgPool,
    poll_option_id: Uuid,
    user_id: Uuid,
    vote_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO votes (id, user_id, poll_option_id)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(vote_id)
    .bind(user_id)
    .bind(poll_option_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_vote(
    pool: &PgPool,
    poll_option_id: Uuid,
    user_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        DELETE FROM votes WHERE user_id = $1 AND poll_option_id = $2
        "#,
    )
    .bind(user_id)
    .bind(poll_option_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn increase_vote_count(pool: &PgPool, poll_option_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE poll_options
        SET votes_count = votes_count + 1
        WHERE id = $1
        "#,
    )
    .bind(poll_option_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn decrease_vote_count(pool: &PgPool, poll_option_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE poll_options
        SET votes_count = votes_count - 1
        WHERE id = $1
        "#,
    )
    .bind(poll_option_id)
    .execute(pool)
    .await?;
    Ok(())
}

#[derive(sqlx::FromRow, Serialize, Deserialize, Debug)]
pub struct Poll {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: String,
    pub is_active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn get_poll(pool: &PgPool, poll_id: Uuid) -> Result<Poll, sqlx::Error> {
    println!("{:?}", poll_id);
    let poll = sqlx::query(
        r#"
        SELECT * FROM polls WHERE id = $1
        "#,
    )
    .bind(poll_id)
    .fetch_one(pool)
    .await?;
    let poll = Poll {
        id: poll.get("id"),
        user_id: poll.get("user_id"),
        title: poll.get("title"),
        description: poll.get("description"),
        is_active: poll.get("is_active"),
        created_at: poll.get("created_at"),
    };
    println!("{:?}", poll);
    Ok(poll)
}

pub async fn get_user_polls_brief(pool: &PgPool, user_id: Uuid) -> Result<Vec<Poll>, sqlx::Error> {
    let polls = sqlx::query(
        r#"
        SELECT * FROM polls WHERE user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    let polls = polls
        .iter()
        .map(|poll| Poll {
            id: poll.get("id"),
            user_id: poll.get("user_id"),
            title: poll.get("title"),
            description: poll.get("description"),
            is_active: poll.get("is_active"),
            created_at: poll.get("created_at"),
        })
        .collect();
    Ok(polls)
}

pub async fn get_all_polls(pool: &PgPool) -> Result<Vec<Poll>, sqlx::Error> {
    let polls = sqlx::query(
        r#"
        SELECT * FROM polls
        "#,
    )
    .fetch_all(pool)
    .await?;
    let polls = polls
        .iter()
        .map(|poll| Poll {
            id: poll.get("id"),
            user_id: poll.get("user_id"),
            title: poll.get("title"),
            description: poll.get("description"),
            is_active: poll.get("is_active"),
            created_at: poll.get("created_at"),
        })
        .collect();
    Ok(polls)
}

#[derive(sqlx::FromRow, Serialize, Debug)]
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
    let poll_options: Vec<PollOption> = sqlx::query_as(
        r#"
        SELECT * FROM poll_options WHERE poll_id = $1
        "#,
    )
    .bind(poll_id)
    .fetch_all(pool)
    .await?;
    Ok(poll_options)
}

pub async fn is_poll_active(pool: &PgPool, poll_id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        r#"
        SELECT is_active FROM polls WHERE id = $1
        "#,
    )
    .bind(poll_id)
    .fetch_optional(pool)
    .await?;

    match result {
        Some(record) => match record.get("is_active") {
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
    poll_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let vote = sqlx::query(
        r#"
        SELECT EXISTS(
            SELECT 1 
            FROM votes 
            JOIN poll_options ON votes.poll_option_id = poll_options.id 
            WHERE votes.user_id = $1 AND poll_options.poll_id = $2
        )
        "#,
    )
    .bind(user_id)
    .bind(poll_id)
    .fetch_one(pool)
    .await?;
    Ok(match vote.get("exists") {
        Some(true) => true,
        Some(false) => false,
        None => false,
    })
}

pub async fn does_poll_exist(pool: &PgPool, poll_id: Uuid) -> Result<Uuid, sqlx::Error> {
    let result = sqlx::query(
        r#"
        SELECT user_id FROM polls WHERE id = $1
        "#,
    )
    .bind(poll_id)
    .fetch_optional(pool)
    .await?;

    match result {
        Some(record) => Ok(record.get("user_id")),
        None => Err(sqlx::Error::RowNotFound),
    }
}

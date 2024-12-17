use crate::{
    auth::{
        error::{Error, WebResult},
        validate_session::validate_session,
    },
    db::polls,
};
use actix_session::Session;
use actix_web::web::{Data, Json, Path};
use actix_web::HttpResponse;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use webauthn_rs::prelude::*;

#[derive(Deserialize)]
pub struct CreatePollRequest {
    poll_name: String,
    poll_description: String,
    poll_options: Vec<String>,
}

pub async fn create_poll(
    req: Json<CreatePollRequest>,
    session: Session,
    pool: Data<PgPool>,
) -> WebResult<HttpResponse> {
    let user_id = validate_session(&session)?;
    let poll_name = req.poll_name.clone();
    let poll_description = req.poll_description.clone();
    let poll_options = req.poll_options.clone();

    if poll_options.len() < 2 {
        return Err(Error::InvalidPollOptions);
    }
    let poll_id = Uuid::new_v4();
    for option in poll_options {
        let option_id = Uuid::new_v4();
        let _ = polls::create_option(&pool, option_id, poll_id, &option)
            .await
            .map_err(Error::DatabaseError);
    }
    let _ = polls::create_poll(&pool, poll_id, user_id, &poll_name, &poll_description)
        .await
        .map_err(|_| Error::DatabaseError);
    Ok(HttpResponse::Created().json(poll_id))
}

// #[derive(Deserialize)]
// pub struct UpdatePoll {
//     poll_id: Uuid,
//     poll_name: Option<String>,
//     poll_description: Option<String>,
//     poll_options: Option<Vec<String>>,
//     reset_votes: Option<bool>,
//     close_poll: Option<bool>,
// }

// pub async fn update_poll(
//     req: Json<UpdatePoll>,
//     session: Session,
//     pool: Data<PgPool>,
// ) -> WebResult<HttpResponse> {
//     let user_id = validate_session(&session);
//     let poll_id = req.poll_id;

//     // Check if the poll exists and if the user is the owner
//     poll_valid_owner_authorized(poll_id, session, pool)
//         .await
//         .map_err(|e| match e {
//             Error::PollNotFound => Error::PollNotFound,
//             _ => Error::Unauthorized,
//         })?;

//     let mut poll = polls::get_poll(&pool, poll_id)
//         .await
//         .map_err(|e| match e {
//             Error::PollNotFound => Error::PollNotFound,
//             _ => Error::DatabaseError(e),
//         })?;
//     // Update poll title and description if provided
//     if let Some(name) = &req.poll_name {
//         poll.title = name.clone();
//     }

//     if let Some(description) = &req.poll_description {
//         poll.description = description.clone();
//     }

//     polls::update_poll(&pool, poll_id, &poll.title, &poll.description)
//         .await
//         .map_err(|_| Error::DatabaseError)?;

//     // Update poll options if provided
//     if let Some(options) = &req.poll_options {
//         if options.len() < 2 {
//             return Err(Error::InvalidPollOptions);
//         }

//         // Fetch existing options
//         let existing_options: Vec<(Uuid, String)> = sqlx::query_as!(
//             "SELECT id, option_text FROM poll_options WHERE poll_id = $1",
//             poll_id
//         )
//         .fetch_all(&pool)
//         .await
//         .map_err(|_| Error::DatabaseError)?;

//         let new_options_set: HashSet<_> = options.iter().cloned().collect();
//         let existing_options_set: HashSet<_> = existing_options.iter().map(|(_, text)| text.clone()).collect();

//         // Prepare delete and insert operations
//         let mut delete_ids = Vec::new();
//         let mut insert_options = Vec::new();

//         for (id, text) in &existing_options {
//             if !new_options_set.contains(text) {
//                 delete_ids.push(id);
//             }
//         }

//         for option in &options {
//             if !existing_options_set.contains(option) {
//                 let option_id = Uuid::new_v4();
//                 insert_options.push((option_id, option));
//             }
//         }

//         // Execute delete and insert operations in a transaction
//         let mut tx = pool.begin().await.map_err(|_| Error::DatabaseError)?;

//         for id in delete_ids {
//             sqlx::query!(
//                 "DELETE FROM poll_options WHERE id = $1",
//                 id
//             )
//             .execute(&mut tx)
//             .await
//             .map_err(|_| Error::DatabaseError)?;
//         }

//         for (option_id, option) in insert_options {
//             sqlx::query!(
//                 "INSERT INTO poll_options (id, poll_id, option_text) VALUES ($1, $2, $3)",
//                 option_id,
//                 poll_id,
//                 option
//             )
//             .execute(&mut tx)
//             .await
//             .map_err(|_| Error::DatabaseError)?;
//         }

//         tx.commit().await.map_err(|_| Error::DatabaseError)?;
//     }

//     // Close the poll if requested
//     if let Some(close) = req.close_poll {
//         if close {
//             sqlx::query!(
//                 r#"
//                 UPDATE polls SET is_active = FALSE WHERE id = $1
//                 "#,
//                 poll_id
//             )
//             .execute(&pool)
//             .await
//             .map_err(|_| Error::DatabaseError)?;
//         }
//     }

//     // Reset votes if requested
//     if let Some(reset) = req.reset_votes {
//         if reset {
//             sqlx::query!(
//                 r#"
//                 DELETE FROM votes WHERE poll_option_id IN (SELECT id FROM poll_options WHERE poll_id = $1)
//                 "#,
//                 poll_id
//             )
//             .execute(&pool)
//             .await
//             .map_err(|_| Error::DatabaseError)?;
//         }
//     }

//     Ok(HttpResponse::Ok().finish())
// }

pub async fn delete_poll(
    poll_id: Path<Uuid>,
    session: Session,
    pool: Data<PgPool>,
) -> WebResult<HttpResponse> {
    let poll_id = poll_id.into_inner();

    poll_valid_owner_authorized(poll_id, session, &pool).await?;

    // Delete poll options and votes first (cascade delete)
    let _ = polls::delete_votes(&pool, poll_id)
        .await
        .map_err(|_| Error::DatabaseError);

    let _ = polls::delete_poll_options(&pool, poll_id)
        .await
        .map_err(|_| Error::DatabaseError);

    // Delete the poll itself
    let _ = polls::delete_poll(&pool, poll_id)
        .await
        .map_err(|_| Error::DatabaseError);

    Ok(HttpResponse::NoContent().finish())
}

pub struct VoteRequest {
    option_id: Uuid,
}

pub async fn vote_poll(
    poll_id: Path<Uuid>,
    session: Session,
    pool: Data<PgPool>,
    req: Json<VoteRequest>,
) -> WebResult<HttpResponse> {
    let user_id = validate_session(&session)?;
    let poll_id = poll_id.into_inner();

    // Check if poll is active
    let poll = polls::is_poll_active(&pool, poll_id)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => Error::PollNotFound,
            _ => Error::DatabaseError(e),
        })?;

    if !poll {
        return Err(Error::PollClosed);
    }

    // Check if user has already voted
    let existing_vote = polls::has_user_voted(&pool, poll_id, user_id)
        .await
        .map_err(Error::DatabaseError)?;

    if existing_vote {
        return Err(Error::AlreadyVoted);
    }

    // Get the selected option (you should pass option_id in the request body)
    let option_id = req.option_id; // for simplicity, just an example, replace with the actual ID passed

    // Insert the vote into the database
    let _ = polls::vote(&pool, option_id, user_id)
        .await
        .map_err(Error::DatabaseError);

    // Optionally, update the vote count for the selected option
    let _ = polls::increase_vote_count(&pool, option_id)
        .await
        .map_err(Error::DatabaseError);

    Ok(HttpResponse::Ok().finish())
}

pub async fn remove_vote(
    poll_id: Path<Uuid>,
    session: Session,
    pool: Data<PgPool>,
    req: Json<VoteRequest>,
) -> WebResult<HttpResponse> {
    let user_id = validate_session(&session)?;
    let poll_id = poll_id.into_inner();
    let poll_option_id = req.option_id;
    // Check if user has voted on this poll
    let vote = polls::has_user_voted(&pool, poll_id, user_id)
        .await
        .map_err(Error::DatabaseError)?;
    if !vote {
        return Err(Error::VoteNotFound);
    }

    let _ = polls::delete_vote(&pool, poll_option_id, user_id)
        .await
        .map_err(Error::DatabaseError);

    // Decrement the vote count for the option
    let _ = polls::decrease_vote_count(&pool, poll_option_id)
        .await
        .map_err(Error::DatabaseError);

    Ok(HttpResponse::Ok().finish())
}
#[derive(Serialize)]
pub struct PollData {
    title: String,
    description: String,
    is_active: bool,
    options: Vec<polls::PollOption>,
}

pub async fn get_poll(
    poll_id: Path<Uuid>,
    pool: Data<PgPool>,
) -> WebResult<HttpResponse> {
    let poll_id = poll_id.into_inner();

    // Retrieve poll details
    let poll = polls::get_poll(&pool, poll_id)
        .await
        .map_err(|_| Error::PollNotFound)?;

    // Retrieve poll options and their vote counts
    let options = polls::get_poll_options_data(&pool, poll_id)
        .await
        .map_err(Error::DatabaseError)?;
    let res: PollData = PollData {
        title: poll.title.unwrap_or_default(),
        description: poll.description.unwrap_or_default(),
        is_active: poll.is_active.unwrap_or_default(),
        options,
    };
    Ok(HttpResponse::Ok().json(res))
}

pub async fn close_poll(
    poll_id: Uuid,
    session: Session,
    pool: Data<PgPool>,
) -> WebResult<HttpResponse> {
    validate_session(&session)?;

    // Check if the poll exists and if the user is the owner
    poll_valid_owner_authorized(poll_id, session, &pool)
        .await
        .map_err(|e| match e {
            Error::PollNotFound => Error::PollNotFound,
            _ => Error::Unauthorized,
        })?;

    // Close the poll
    polls::close_poll(&pool, poll_id)
        .await
        .map_err(Error::DatabaseError)?;

    Ok(HttpResponse::Ok().finish())
}

pub async fn poll_valid_owner_authorized(
    poll_id: Uuid,
    session: Session,
    pool: &Data<PgPool>,
) -> Result<(), Error> {
    let user_id = validate_session(&session)?;

    // Check if the poll exists and if the user is the owner
    let user = polls::does_poll_exist(&pool, poll_id)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => Error::PollNotFound,
            _ => Error::DatabaseError(e),
        })?;

    if user != user_id {
        return Err(Error::Unauthorized);
    }

    Ok(())
}

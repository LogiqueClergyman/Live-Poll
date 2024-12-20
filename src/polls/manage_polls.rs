use crate::{
    auth::{
        error::{Error, WebResult},
        validate_session::validate_session,
    },
    db::polls,
};
use actix_session::Session;
use actix_web::HttpResponse;
use actix_web::{
    web::{self, Data, Json, Path},
    Responder,
};
use async_stream;
use futures_util::stream::{Stream, StreamExt};
use log::{info, warn};
use serde::{de, Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;
use std::time::Duration;
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
    let _ = polls::create_poll(&pool, poll_id, user_id, &poll_name, &poll_description)
        .await
        .map_err(|_| Error::DatabaseError);
    for option in poll_options {
        let option_id = Uuid::new_v4();
        let _ = polls::create_option(&pool, option_id, poll_id, option)
            .await
            .map_err(Error::DatabaseError);
    }
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

#[derive(Deserialize)]
pub struct VoteRequest {
    option_id: Uuid,
}

pub async fn vote_poll(
    poll_id: Path<Uuid>,
    session: Session,
    pool: Data<PgPool>,
    req: Json<VoteRequest>,
) -> WebResult<HttpResponse> {
    warn!("checking in vote_poll : {:?}", session.entries());
    let user_id = validate_session(&session)?;
    let poll_id = poll_id.into_inner();
    println!("user_id while voting: {:?}", user_id);

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

    let option_id = req.option_id; // for simplicity, just an example, replace with the actual ID passed
                                   // Check if user has already voted
    let existing_vote = polls::has_user_voted(&pool, option_id, user_id, poll_id)
        .await
        .map_err(Error::DatabaseError)?;

    if existing_vote {
        return Err(Error::AlreadyVoted);
    }

    // Get the selected option (you should pass option_id in the request body)
    let vote_id = Uuid::new_v4();
    // Insert the vote into the database
    let _ = polls::vote(&pool, option_id, user_id, vote_id)
        .await
        .map_err(Error::DatabaseError);

    // // Optionally, update the vote count for the selected option
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
    let vote = polls::has_user_voted(&pool, poll_option_id, user_id, poll_id)
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
#[derive(Serialize, Debug)]
pub struct PollData {
    title: String,
    description: String,
    is_active: bool,
    options: Vec<polls::PollOption>,
    user_id: Uuid,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
pub struct QueryParams {
    creator: Option<Uuid>,
}

#[derive(Serialize)]
pub struct PollsBrief {
    pub id: Uuid,
    pub title: String,
    pub description: String,
    pub is_active: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}
pub async fn get_polls_brief(
    pool: Data<PgPool>,
    query: web::Query<QueryParams>,
) -> WebResult<HttpResponse> {
    let mut polls = Vec::new();
    if query.creator.is_some() {
        let user_id = query.creator.unwrap();
        polls = polls::get_user_polls_brief(&pool, user_id)
            .await
            .map_err(Error::DatabaseError)?;
    } else {
        polls = polls::get_all_polls(&pool)
            .await
            .map_err(Error::DatabaseError)?;
    }
    Ok(HttpResponse::Ok().json(polls))
}

pub async fn get_poll(poll_id: Path<Uuid>, pool: Data<PgPool>) -> WebResult<HttpResponse> {
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
        title: poll.title,
        description: poll.description,
        is_active: poll.is_active,
        user_id: poll.user_id,
        created_at: poll.created_at,
        options,
    };
    println!("asdasd:   {:?}", res);
    Ok(HttpResponse::Ok().json(res))
}

pub async fn close_poll(
    poll_id: Path<Uuid>,
    session: Session,
    pool: Data<PgPool>,
) -> WebResult<HttpResponse> {
    warn!("checking in close_poll : {:?}", session.entries());
    // let user_id = validate_session(&session)?;
    let poll_id = poll_id.into_inner();
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

pub async fn reset_poll(
    poll_id: Path<Uuid>,
    session: Session,
    pool: Data<PgPool>,
) -> WebResult<HttpResponse> {
    let poll_id = poll_id.into_inner();
    // Check if the poll exists and if the user is the owner
    poll_valid_owner_authorized(poll_id, session, &pool)
        .await
        .map_err(|e| match e {
            Error::PollNotFound => Error::PollNotFound,
            _ => Error::Unauthorized,
        })?;

    // Reset the votes
    polls::delete_votes(&pool, poll_id)
        .await
        .map_err(Error::DatabaseError)?;
    polls::reset_votes_count(&pool, poll_id)
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

pub async fn get_user_polls(user_id: Path<Uuid>, pool: Data<PgPool>) -> WebResult<HttpResponse> {
    let user_id = user_id.into_inner();
    let polls = polls::get_user_polls_brief(&pool, user_id)
        .await
        .map_err(Error::DatabaseError)?;
    Ok(HttpResponse::Ok().json(polls))
}

pub async fn get_poll_results(poll_id: Path<Uuid>, pool: Data<PgPool>) -> impl Responder {
    let poll_id = poll_id.into_inner();
    let mut interval = tokio::time::interval(Duration::from_secs(2));

    let stream = async_stream::stream! {
    loop {
        interval.tick().await;

        let poll = match polls::get_poll(&pool, poll_id).await {
            Ok(poll) => poll,
            Err(_) => {
                yield Result::<web::Bytes, Box<dyn std::error::Error>>::Ok(web::Bytes::from("Poll not found"));
                return;
            }
        };

            let options = match polls::get_poll_options_data(&pool, poll_id).await {
                Ok(options) => options,
                Err(_) => {
                    yield Ok(web::Bytes::from("Database error"));
                    return;
                }
            };

            let total_votes: i32 = options
                .iter()
                .map(|option| option.votes_count.unwrap_or(0))
                .sum();
            let option_percentage: Vec<_> = options
                .iter()
                .map(|option| {
                    let percentage = if total_votes > 0 {
                        (option.votes_count.unwrap_or(0) as f64 / total_votes as f64) * 100.0
                    } else {
                        0.0
                    };
                    (option.id, percentage)
                })
                .collect();

            let winner = option_percentage
                .iter()
                .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or( std::cmp::Ordering::Equal))
                .map(|(option, _)| option);

            let runner_up = option_percentage
                .iter()
                .filter(|(option, _)| option != winner.unwrap())
                .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or( std::cmp::Ordering::Equal))
                .map(|(option, _)| option);

            let res = json!({
                "poll": poll.title,
                "total_votes": total_votes,
                "winner": winner.unwrap(),
                "runner_up": runner_up.unwrap(),
                "percentage": option_percentage,
                "options": options,
            });
            println!("asdasd:   {:?}", res);
            // Send the data as an SSE message
            yield Ok(web::Bytes::from(format!("data: {}\n\n", serde_json::to_string(&res).unwrap())));
        }
    };
    HttpResponse::Ok()
        .content_type("text/event-stream")
        .streaming(stream)
}

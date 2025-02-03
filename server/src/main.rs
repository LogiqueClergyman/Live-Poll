use std::path;

use actix_cors::Cors;
use actix_session::SessionMiddleware;
use actix_web::{
    cookie::Key,
    middleware::Logger,
    web::{self, get, post, route, Data, JsonConfig},
    App, HttpResponse, HttpServer, Responder,
};
use log::info;
mod auth;
pub use auth::{
    login::{finish_authentication, start_authentication},
    register::{finish_register, start_register},
    session::MemorySession,
    startup::startup,
};

mod db;
use db::{create_pool::create_db_pool, migrations::run_migrations};

mod polls;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    if std::env::var_os("RUST_LOG").is_none() {
        std::env::set_var("RUST_LOG", "debug");
    }
    env_logger::init();
    let pool = loop {
        match create_db_pool().await {
            Ok(pool) => break pool,
            Err(err) => {
                info!("Error creating pool: {}. Retrying...", err);
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
            }
        }
    };
    loop {
        match run_migrations(&*pool).await {
            Ok(_) => {
                info!("Migrations completed successfully.");
                break;
            }
            Err(e) => {
                info!("Migrations failed: {:?}", e);
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
            }
        }
    }
    let key = Key::from(format!("{:0<100}", "qwerty").as_bytes());
    let (webauthn, webauthn_users) = startup();
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000") // Allow requests from your frontend
            .allowed_methods(vec!["GET", "POST", "OPTIONS"]) // Allow necessary HTTP methods
            .allowed_headers(vec!["Content-Type", "Authorization", "X-Requested-With"]) // Allow necessary headers
            .allow_any_header() // Allow cookies to be sent with requests
            .supports_credentials()
            .max_age(3600);
        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .wrap(
                SessionMiddleware::builder(MemorySession, key.clone())
                    .cookie_name("webauthnrs".to_string())
                    .cookie_http_only(true)
                    .cookie_same_site(actix_web::cookie::SameSite::Lax)
                    .cookie_secure(false)
                    .build(),
            )
            .app_data(Data::new(pool.as_ref().clone()))
            .app_data(JsonConfig::default())
            .app_data(webauthn.clone())
            .app_data(webauthn_users.clone())
            .service(
                web::scope("/api/auth")
                    .route("/me", web::post().to(auth::get_user::get_user))
                    .route("/register", web::post().to(start_register))
                    .route("/register_complete", web::post().to(finish_register))
                    .route("/login", post().to(start_authentication))
                    .route("/login_complete", post().to(finish_authentication))
                    .route("logout", post().to(auth::get_user::logout)),
            )
            .service(
                web::scope("/api/polls")
                    .route(
                        "/{poll_id}/close",
                        web::post().to(polls::manage_polls::close_poll),
                    )
                    .route(
                        "/{poll_id}/vote",
                        web::post().to(polls::manage_polls::vote_poll),
                    )
                    .route(
                        "/{poll_id}/reset",
                        web::post().to(polls::manage_polls::reset_poll),
                    )
                    .route(
                        "/{poll_id}/results",
                        web::get().to(polls::manage_polls::get_poll_results),
                    )
                    .route("/{poll_id}", web::get().to(polls::manage_polls::get_poll))
                    .route("/create", web::post().to(polls::manage_polls::create_poll))
                    .route("/", web::get().to(polls::manage_polls::get_polls_brief)),
            )
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}

use actix_session::SessionMiddleware;
use actix_web::{
    cookie::Key,
    middleware::Logger,
    web,
    web::{get, post, JsonConfig},
    App, HttpResponse, HttpServer, Responder,
};
use log::info;
mod auth;
use actix_cors::Cors;
pub use auth::{
    login::{finish_authentication, start_authentication},
    register::{finish_register, start_register},
    session::MemorySession,
    startup::startup,
};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    if std::env::var_os("RUST_LOG").is_none() {
        std::env::set_var("RUST_LOG", "info");
    }
    env_logger::init();
    let key = Key::generate();
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
            .app_data(JsonConfig::default())
            .app_data(webauthn.clone())
            .app_data(webauthn_users.clone())
            .service(
                web::scope("/auth")
                    .route("/register", web::post().to(start_register))
                    .route("/register_complete", web::post().to(finish_register))
                    .route("/login", post().to(start_authentication))
                    .route("/login_complete", post().to(finish_authentication)),
            )
    })
    .bind(("localhost", 8080))?
    .run()
    .await
}

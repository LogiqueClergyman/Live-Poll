use actix_web::{web, App, HttpResponse, HttpServer, Responder};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new().service(web::scope("/auth").route(
            "/index.html",
            web::get().to(|| async { HttpResponse::Ok().body("Welcome!") }),
        ))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}

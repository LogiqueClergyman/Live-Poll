use std::collections::HashMap;
use dotenvy;
use actix_web::web::Data;
use tokio::sync::Mutex;
use std::env;
/*
 * Webauthn RS server side app state and setup code.
 */

// Configure the Webauthn instance by using the WebauthnBuilder. This defines
// the options needed for your site, and has some implications. One of these is that
// you can NOT change your rp_id (relying party id), without invalidating all
// webauthn credentials. Remember, rp_id is derived from your URL origin, meaning
// that it is your effective domain name.

use webauthn_rs::prelude::*;

pub struct UserData {
    pub(crate) name_to_id: HashMap<String, Uuid>,
    pub(crate) keys: HashMap<Uuid, Vec<Passkey>>,
}

pub fn startup() -> (Data<Webauthn>, Data<Mutex<UserData>>) {
    let _ = dotenvy::from_filename(".env").ok();
    // Effective domain name.
    // let rp_id = "localhost:3000/";
    let rp_id = env::var("RP_ID").expect("RP_ID should be specified in the env");
    // Url containing the effective domain name
    // MUST include the port number!
    let rp_origin = Url::parse(env::var("RP_ORIGIN").expect("RP_ORIGIN should be specified in the env").as_str()).unwrap();
    // let rp_origin = Url::parse("http://localhost:3000/").expect("Invalid URL");
    let builder = WebauthnBuilder::new(&rp_id, &rp_origin).expect("Invalid configuration");

    // Now, with the builder you can define other options.
    // Set a "nice" relying party name. Has no security properties and
    // may be changed in the future.
    let builder = builder.rp_name("Actix-web webauthn-rs");

    // Consume the builder and create our webauthn instance.
    // Webauthn has no mutable inner state, so Arc (Data) and read only is sufficient.
    let webauthn = Data::new(builder.build().expect("Invalid configuration"));

    // This needs mutability, so does require a mutex.
    let webauthn_users = Data::new(Mutex::new(UserData {
        name_to_id: HashMap::new(),
        keys: HashMap::new(),
    }));

    (webauthn, webauthn_users)
}

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};

#[derive(Clone)]
pub struct AppState {
    pub credentials: Arc<Mutex<HashMap<Vec<u8>, Credential>>>,
}



#[derive(Clone, Serialize, Deserialize)]
pub struct Credential {
    pub credential_id: Vec<u8>,
    pub public_key: Vec<u8>,
    pub rp_id: String,
    pub user_id: Vec<u8>,
    pub user_name: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ClientDataJSON {
    #[serde(rename = "type")]
    pub type_: String,
    pub challenge: String,
    pub origin: String,
    #[serde(rename = "crossOrigin")]
    pub cross_origin: Option<bool>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RpEntity {
    pub id: Option<String>,
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UserEntity {
    pub id: Vec<u8>,
    pub name: String,
    //#[serde(rename = "displayName")]
    //pub display_name: String,
}





#[derive(Serialize, Deserialize, Debug)]
pub struct AllowCredential {
    pub id: String,
    #[serde(rename = "type")]
    pub type_: String,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct Rp {
    pub name: String,
}

/*
#[derive(Serialize, Deserialize, Debug)]
pub struct Ctap2CreateRequest {
    #[serde(rename = "clientDataJSON")]
    pub client_data_json: ClientDataJSON,
    pub rp: RpEntity,
    pub user: UserEntity,
    #[serde(rename = "pubKeyCredParams")]
    pub pub_key_cred_params: Vec<PubKeyCredParam>,
}*/

#[derive(Debug, Serialize, Deserialize)]
pub struct Ctap2CreateRequest {
    #[serde(rename = "type")]
    pub type_: String,
    #[serde(rename = "clientDataJSON")]
    pub client_data_json: ClientDataJSON,
    #[serde(rename = "attestationData")]
    pub attestation_data: AttestationData,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AttestationData {
    pub rp: Rp,
    pub user: User,
    #[serde(rename = "pubKeyCredParams")]
    pub pub_key_cred_params: Vec<PubKeyCredParam>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PubKeyCredParam {
    #[serde(rename = "type")]
    pub type_: String,
    pub alg: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: Vec<u8>,
    pub name: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
}



/********************************************** */





#[derive(Serialize, Deserialize, Debug)]
pub struct Ctap2GetRequest {
    #[serde(rename = "clientDataJSON")]
    pub client_data_json: ClientDataJSON,
    #[serde(rename = "rpId")]
    pub rp_id: String,
    #[serde(rename = "allowCredentials")]
    pub allow_credentials: Vec<AllowCredential>,
    #[serde(rename = "userVerification")]
    pub user_verification: String,
}

#[derive(Serialize, Deserialize)]
pub struct MakeCredentialResponse {
    #[serde(rename = "credentialId")]
    pub credential_id: String,
    #[serde(rename = "attestationObject")]
    pub attestation_object: String,
    #[serde(rename = "clientDataJSON")]
    pub client_data_json: String,
}

#[derive(Serialize, Deserialize)]
pub struct GetAssertionResponse {
    #[serde(rename = "credentialId")]
    pub credential_id: String,
    #[serde(rename = "authenticatorData")]
    pub authenticator_data: String,
    pub signature: String,
    #[serde(rename = "clientDataJSON")]
    pub client_data_json: String,
    #[serde(rename = "userHandle")]
    pub user_handle: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct CredentialDescriptor {
    pub id: String,
    #[serde(rename = "type")]
    pub type_: String,
}

use rand::RngCore;
use sha2::{Sha256, Digest};
use serde_json::json;
use base64::engine::general_purpose;
use base64::Engine;
use crate::ClientDataJSON;



pub fn generate_credential_id() -> Vec<u8> {
    let mut credential_id = vec![0u8; 32];
    rand::thread_rng().fill_bytes(&mut credential_id);
    credential_id
}

pub fn hash_rp_id(rp_id: &str) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(rp_id.as_bytes());
    hasher.finalize().to_vec()
}

pub fn generate_auth_data(rp_id_hash: &[u8], credential_id: &[u8], public_key: &[u8], with_attestation: bool) -> Vec<u8> {
    let flags = if with_attestation { 0x41 } else { 0x01 }; // UP + AT or just UP
    let sign_count = [0u8; 4];
    let aaguid = [0u8; 16];
    let cred_id_len = (credential_id.len() as u16).to_be_bytes();

    let mut auth_data = Vec::new();
    auth_data.extend_from_slice(rp_id_hash);
    auth_data.push(flags);
    auth_data.extend_from_slice(&sign_count);
    if with_attestation {
        auth_data.extend_from_slice(&aaguid);  // AAGUID (16 octets, 0 pour "none")
        auth_data.extend_from_slice(&cred_id_len);
        auth_data.extend_from_slice(credential_id);
        auth_data.extend_from_slice(public_key);  // Clé publique COSE
    }
    auth_data
}

pub fn generate_client_data_json(client_data: &ClientDataJSON) -> String {
    let client_data_json = json!({
        "type": client_data.type_,
        "challenge": client_data.challenge,
        "origin": client_data.origin,
        "crossOrigin": client_data.cross_origin,
        "virtual_authenticator": "Passcoco authenticator"
    });
    serde_json::to_string(&client_data_json).expect("Failed to serialize clientDataJSON")
}

pub fn encode_to_base64(data: &[u8]) -> String {
    general_purpose::STANDARD.encode(data)
}

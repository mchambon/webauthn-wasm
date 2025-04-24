use crate::models::{Credential, PubKeyCredParam, AllowCredential};
use crate::utils::generate_credential_id;
use crate::crypto::{generate_and_store_key, KeyGenerationError};
use base64::{engine::general_purpose, Engine as _};
use std::collections::HashMap;

pub fn select_or_create_credential(
    credentials: &HashMap<Vec<u8>, Credential>,
    rp_id: &str,
    allow_credentials: &[AllowCredential],
) -> Option<Credential> {
    if allow_credentials.is_empty() {
        credentials.values().find(|c| c.rp_id == rp_id).cloned()
    } else {
        for cred in allow_credentials {
            match general_purpose::STANDARD.decode(&cred.id) {
                Ok(cred_id) => {
                    if let Some(credential) = credentials.get(&cred_id) {
                        return Some(credential.clone());
                    }
                },
                Err(_) => continue,
            }
        }
        None
    }
}

pub fn create_credential(
    rp_id: &str,
    user_id: Vec<u8>,
    user_name: String,
    pub_key_cred_params: &[PubKeyCredParam],
) -> Result<Credential, KeyGenerationError> {
    let credential_id = generate_credential_id();
    let public_key = generate_and_store_key(credential_id.clone(), pub_key_cred_params)?;

    Ok(Credential {
        credential_id,
        public_key,
        rp_id: rp_id.to_string(),
        user_id,
        user_name,
    })
}

pub fn list_credentials(
    credentials: &HashMap<Vec<u8>, Credential>,
    rp_id: &str,
) -> Vec<(String, String)> {
    credentials
        .values()
        .filter(|c| c.rp_id == rp_id)
        .map(|c| (
            general_purpose::STANDARD.encode(&c.credential_id),
            c.user_name.clone(),
        ))
        .collect()
}
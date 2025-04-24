
use p256::ecdsa::{SigningKey as P256SigningKey, Signature as P256Signature, signature::Signer};
use ed25519_dalek::{SigningKey as EdSigningKey, Signature as EdSignature, Signer as EdSigner};
use sha2::digest::generic_array::GenericArray;
use rand::RngCore;
use sha2::digest::typenum;
use std::collections::HashMap;
use std::sync::Mutex;
use crate::models::PubKeyCredParam;
use lazy_static::lazy_static;


#[derive(Clone)]
pub enum KeyPair {
    P256 { public_key: Vec<u8>, private_key: Vec<u8> },
    Ed25519 { public_key: Vec<u8>, private_key: Vec<u8> },
}

#[derive(Debug)]
pub enum KeyGenerationError {
    UnsupportedAlgorithm,
}

lazy_static! {
    static ref KEY_STORE: Mutex<HashMap<Vec<u8>, KeyPair>> = Mutex::new(HashMap::new());
}

pub fn generate_and_store_key(
    credential_id: Vec<u8>,
    pub_key_cred_params: &[PubKeyCredParam],
) -> Result<Vec<u8>, KeyGenerationError> {
    let mut key_store = KEY_STORE.lock().expect("Failed to lock key store");

    let supports_ed25519 = pub_key_cred_params.iter().any(|param| param.alg == -8);
    let supports_p256 = pub_key_cred_params.iter().any(|param| param.alg == -7);

    if supports_ed25519 {
        let mut rng = rand::thread_rng();
        let mut seed = [0u8; 32];
        rng.fill_bytes(&mut seed);
        let signing_key = EdSigningKey::from_bytes(&seed);
        let verifying_key = signing_key.verifying_key();
        let public_key = verifying_key.to_bytes().to_vec();
        let private_key = signing_key.to_bytes().to_vec();

        let cose_public_key = {
            let mut key = Vec::new();
            key.push(0xa4);
            key.extend_from_slice(&[0x01, 0x01]);
            key.extend_from_slice(&[0x03, 0x27]);
            key.extend_from_slice(&[0x20, 0x06]);
            key.push(0x21);
            key.push(0x58); key.push(0x20);
            key.extend_from_slice(&public_key);
            key
        };

        key_store.insert(credential_id, KeyPair::Ed25519 { public_key: cose_public_key.clone(), private_key });
        Ok(cose_public_key)
    } else if supports_p256 {
        let signing_key = P256SigningKey::random(&mut rand::thread_rng());
        let private_key = signing_key.to_bytes().to_vec();
        let verifying_key = signing_key.verifying_key();
        let public_key_x = verifying_key.to_encoded_point(false).x().unwrap().to_vec();
        let public_key_y = verifying_key.to_encoded_point(false).y().unwrap().to_vec();

        let cose_public_key = {
            let mut key = Vec::new();
            key.extend_from_slice(&[0xa5]);
            key.extend_from_slice(&[0x01, 0x02]);
            key.extend_from_slice(&[0x03, 0x26]);
            key.extend_from_slice(&[0x20, 0x01]);
            key.extend_from_slice(&[0x21]);
            key.push(0x58); key.push(0x20);
            key.extend_from_slice(&public_key_x);
            key.extend_from_slice(&[0x22]);
            key.push(0x58); key.push(0x20);
            key.extend_from_slice(&public_key_y);
            key
        };

        key_store.insert(credential_id, KeyPair::P256 { public_key: cose_public_key.clone(), private_key });
        Ok(cose_public_key)
    } else {
        Err(KeyGenerationError::UnsupportedAlgorithm)
    }
}

pub fn sign_with_key(credential_id: &Vec<u8>, data: &[u8]) -> Option<Vec<u8>> {
    let key_store = KEY_STORE.lock().expect("Failed to lock key store");
    key_store.get(credential_id).map(|key_pair| match key_pair {
        KeyPair::P256 { private_key, .. } => {
            let private_key_array: [u8; 32] = private_key.clone().try_into().expect("Invalid private key length");
            let signing_key = P256SigningKey::from_bytes(GenericArray::<u8, typenum::U32>::from_slice(&private_key_array)).unwrap();
            let signature: P256Signature = signing_key.sign(data);
            signature.to_der().to_bytes().to_vec()
        }
        KeyPair::Ed25519 { private_key, .. } => {
            let signing_key = EdSigningKey::from_bytes(
                private_key.as_slice().try_into().expect("Invalid Ed25519 private key length")
            );
            let signature: EdSignature = signing_key.sign(data);
            signature.to_bytes().to_vec()
        }
    })
}
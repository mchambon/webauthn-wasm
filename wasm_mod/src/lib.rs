use wasm_bindgen::prelude::*;
use serde_wasm_bindgen::to_value;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
//use p256::ecdsa::{SigningKey as P256SigningKey, Signature as P256Signature, signature::Signer};
//use ed25519_dalek::{SigningKey as EdSigningKey, Signature as EdSignature, Signer as EdSigner};
use sha2::{Digest, Sha256};
//use base64::{engine::general_purpose, Engine as _};
use serde_json::json;
use web_sys::console;
//use console_error_panic_hook;
//use js_sys::{Object, Reflect};




pub mod crypto;
pub mod models;
pub mod utils;
pub mod manage;


use crate::models::*;
use crate::manage::{create_credential, list_credentials, select_or_create_credential};
use crate::utils::{generate_client_data_json, generate_auth_data, hash_rp_id, encode_to_base64};
use crate::crypto::{sign_with_key, KeyGenerationError};

#[wasm_bindgen]
pub struct Authenticator {
    state: AppState,
}


#[wasm_bindgen]
pub fn hello_world() -> String {
    console::log_1(&JsValue::from_str(" ###### RUST ###### : Hello from WASM!"));
    " ###### RUST ###### : Hello from WASM!".to_string()
}



#[wasm_bindgen]
impl Authenticator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        // Initialize console error panic hook for better error messages
        //console_error_panic_hook::set_once();
        console::log_1(&JsValue::from_str("WebAuthn Authenticator initialized"));
        
        Authenticator {
            state: AppState {
                credentials: Arc::new(Mutex::new(HashMap::new()))
            },
        }
    }



    #[wasm_bindgen]
pub fn hello_from_auth(&self) -> String {
    console::log_1(&JsValue::from_str(" ###### RUST ###### AUTH : Hello from WASM!"));
    " ###### RUST ###### AUTH : Hello from WASM!".to_string()
}







    #[wasm_bindgen]
    pub fn make_credential(&self, request_js: JsValue) -> Result<String, JsValue> {
        console::log_1(&JsValue::from_str(" ###### RUST ###### : Processing make_credential request"));
    
        // Log initial request for debugging
        let log_message = format!(" ###### RUST ###### make_credential request_js: {:?}", request_js);
        console::log_1(&JsValue::from_str(&log_message));
    
        // Deserialize the request
        let request: Ctap2CreateRequest = if request_js.is_string() {
            let request_str = request_js.as_string().unwrap();
            match serde_json::from_str(&request_str) {
                Ok(req) => req,
                Err(e) => {
                    let error_msg = format!("Error parsing JSON string: {}", e);
                    console::log_1(&JsValue::from_str(&error_msg));
                    return Err(JsValue::from_str(&error_msg));
                }
            }
        } else {
            match serde_wasm_bindgen::from_value(request_js) {
                Ok(req) => req,
                Err(e) => {
                    let error_msg = format!("Deserialization error from JsValue: {}", e);
                    console::log_1(&JsValue::from_str(&error_msg));
                    return Err(JsValue::from_str(&error_msg));
                }
            }
        };
        
        // Process the actual request
        let response = self.handle_make_credential(request)
            .map_err(|e| JsValue::from_str(&e))?;
    
        // Serialize to JSON string
        let response_string = serde_json::to_string(&response)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))?;
    
        // Log the result before returning
        console::log_1(&JsValue::from_str(&format!("Final response: {}", response_string)));
        
        // Return the JSON string directly
        Ok(response_string)
    }


    #[wasm_bindgen]
    pub fn get_assertion(&self, request_js: JsValue) -> Result<JsValue, JsValue> {
        console::log_1(&JsValue::from_str("Processing get_assertion request"));
        
        // Deserialize the request
        let request: Ctap2GetRequest = if request_js.is_string() {
            let request_str = request_js.as_string().unwrap();
            match serde_json::from_str(&request_str) {
                Ok(req) => req,
                Err(e) => {
                    let error_msg = format!("Error parsing JSON string: {}", e);
                    console::log_1(&JsValue::from_str(&error_msg));
                    return Err(JsValue::from_str(&error_msg));
                }
            }
        } else {
            match serde_wasm_bindgen::from_value(request_js) {
                Ok(req) => req,
                Err(e) => {
                    let error_msg = format!("Deserialization error from JsValue: {}", e);
                    console::log_1(&JsValue::from_str(&error_msg));
                    return Err(JsValue::from_str(&error_msg));
                }
            }
        };
        

/*

        // Convert JsValue to Ctap2GetRequest
        let request: Ctap2GetRequest = serde_wasm_bindgen::from_value(request_js)
            .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;
            

*/














        // Process the request
        let response = self.handle_get_assertion(request)
            .map_err(|e| JsValue::from_str(&e))?;
        
        // Convert response to JsValue
        serde_wasm_bindgen::to_value(&response)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }
    
    #[wasm_bindgen]
    pub fn list_credentials(&self, rp_id: String) -> Result<JsValue, JsValue> {
        console::log_1(&JsValue::from_str(&format!("Listing credentials for RP: {}", rp_id)));
        
        let credentials = self.state.credentials.lock().expect("Failed to lock credentials");
        let credential_list = list_credentials(&credentials, &rp_id);
        
        let result = if credential_list.is_empty() {
            // Return example data if no credentials found
            let example_data = vec![
                ("example_id_1".to_string(), "Example User 1".to_string()),
                ("example_id_2".to_string(), "Example User 2".to_string()),
            ];
            
            json!({
                "credentials": example_data.iter().map(|(id, name)| json!({"id": id, "name": name})).collect::<Vec<_>>()
            })
        } else {
            json!({
                "credentials": credential_list.iter().map(|(id, name)| json!({"id": id, "name": name})).collect::<Vec<_>>()
            })
        };
        


        to_value(&result).map_err(|e| {
            let error_msg = format!("Serialization error: {}", e);
            console::log_1(&JsValue::from_str(&error_msg));
            JsValue::from_str(&e.to_string()) // Convert error to JsValue
        })

        /* Old Style
        JsValue::from_serde(&result).map_err(|e| {
            let error_msg = format!("Serialization error: {}", e);
            console::log_1(&JsValue::from_str(&error_msg));
            JsValue::from_str(&error_msg)
        })*/
    }
    
    // Internal implementation methods
    fn handle_make_credential(&self, request: Ctap2CreateRequest) -> Result<MakeCredentialResponse, String> {
        console::log_1(&JsValue::from_str(" ###### RUST ###### : Processing makeCredential"));
        
        // Extract RP ID
        let rp_id = request.attestation_data.rp.name.clone();


        // Create a new credential
        let credential = create_credential(
            &rp_id,
            request.attestation_data.user.id.clone(),
            request.attestation_data.user.name.clone(),
            &request.attestation_data.pub_key_cred_params,
        ).map_err(|e| match e {
            KeyGenerationError::UnsupportedAlgorithm => "Unsupported algorithm".to_string(),
        })?;
        
        let js_cred = to_value(&credential).unwrap();
        console::log_1(&JsValue::from_str(&format!(
            " ###### handle_make_credential ###### : Credential: {:?}",
            &js_cred
        )));







        // Generate auth data
        let rp_id_hash = hash_rp_id(&rp_id);
        let auth_data = generate_auth_data(&rp_id_hash, &credential.credential_id, &credential.public_key, true);
        
        // Generate client data JSON
        let client_data_json = generate_client_data_json(&request.client_data_json);
        let client_data_json_bytes = client_data_json.as_bytes();
        
        // Create attestation object
        let attestation_object = serde_cbor::to_vec(&json!({
            "fmt": "none",
            "attStmt": {},
            "authData": auth_data,
        })).map_err(|e| format!("CBOR error: {}", e))?;
        
        // Store credential
        let mut credentials = self.state.credentials.lock().map_err(|e| format!("Mutex lock failed: {}", e))?;
        credentials.insert(credential.credential_id.clone(), credential.clone());
        



        // Create response
        let response = MakeCredentialResponse {
            credential_id: encode_to_base64(&credential.credential_id.clone()),
            attestation_object: encode_to_base64(&attestation_object),
            client_data_json: encode_to_base64(client_data_json_bytes),
        };


        console::log_1(&JsValue::from_str(" ###### RUST ###### : [1] END makeCredential"));
        // Log the response
        let response_str = serde_json::to_string(&response).map_err(|e| format!("Serialization error: {}", e))?;
        console::log_1(&JsValue::from_str(&format!(" ###### RUST ###### : makeCredential response: {}", response_str)));
        console::log_1(&JsValue::from_str(" ###### RUST ###### : [2] END makeCredential"));


        Ok(response)
    }



    fn handle_get_assertion(&self, request: Ctap2GetRequest) -> Result<GetAssertionResponse, String> {
        console::log_1(&JsValue::from_str("Processing getAssertion"));
        
        // Get credentials
        let credentials_guard = self.state.credentials.lock().map_err(|e| format!("Mutex lock failed: {}", e))?;
        
        // Safely extract authenticator_data and rp_id
        let auth_data = request.authenticator_data.as_ref().ok_or("No authenticator data provided")?;
        let rp_id = auth_data.rp_id.as_ref().ok_or("No RP ID provided")?;
        
        // Safely extract allow_credentials - provide empty vector as default if None
        let binding = Vec::new();
        let allow_creds = auth_data.allow_credentials.as_ref().unwrap_or(&binding);
        



        // Convert the CredentialDescriptor to AllowCredential format
        let allow_credentials: Vec<AllowCredential> = allow_creds.iter().map(|desc| AllowCredential {
            id: desc.id.clone(),
            type_: desc.type_.clone(),
        }).collect();
        
        // Find the credential
        let credential = select_or_create_credential(&credentials_guard, rp_id, &allow_credentials)
            .ok_or("No credentials found".to_string())?;
        
        console::log_1(&JsValue::from_str("#################### TRAITEMENT ASSERTION ####################"));
    
        // Generate auth data and signature
        let rp_id_hash = hash_rp_id(rp_id);
        let auth_data_bytes = generate_auth_data(&rp_id_hash, &credential.credential_id, &credential.public_key, false);
        
        // Generate client data JSON
        let client_data_json = generate_client_data_json(&request.client_data_json);
        let client_data_json_bytes = client_data_json.as_bytes();
        
        // Calculate client data hash
        let client_data_hash = Sha256::digest(client_data_json_bytes).to_vec();
        
        // Prepare data to sign
        let mut data_to_sign = Vec::new();
        data_to_sign.extend_from_slice(&auth_data_bytes);
        data_to_sign.extend_from_slice(&client_data_hash);
        
        // Sign the data
        let signature_bytes = sign_with_key(&credential.credential_id, &data_to_sign)
            .ok_or("Failed to sign data with key".to_string())?;
        
        // Create response
        let response = GetAssertionResponse {
            credential_id: encode_to_base64(&credential.credential_id),
            authenticator_data: encode_to_base64(&auth_data_bytes),
            signature: encode_to_base64(&signature_bytes),
            client_data_json: encode_to_base64(client_data_json_bytes),
            user_handle: if credential.user_id.is_empty() {
                None
            } else {
                Some(encode_to_base64(&credential.user_id))
            },
        };
        
        Ok(response)
    }
}

// Initialize WASM module
#[wasm_bindgen(start)]
pub fn start() {
    //console_error_panic_hook::set_once();
    console::log_1(&JsValue::from_str(" ###### RUST ###### : WebAuthn WASM Module initialized!"));
}


#[wasm_bindgen]
pub fn free_string(ptr: *mut u8) {
    unsafe {
        let _ = String::from_raw_parts(ptr, 0, 0);
    }
}
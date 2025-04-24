let _authenticator = null;


// extension/js/wasm-handler.js
import init, {
    Authenticator,
    hello_world as wasm_hello_world
    //prepare_registration as wasm_prepare_registration,
    //register as wasm_register,
    //prepare_login as wasm_prepare_login,
    //login as wasm_login,
    //parse_response_text as wasm_parse_response_text // Assurez-vous que cette fonction existe dans lib.rs et est marquée [wasm_bindgen]
} from './wasm/wasm_mod.js';

let wasmInitialized = false;
const RUST_LOG_LEVEL = "info"; // Ou "debug", "trace" etc.

export async function initializeWasm() {
    if (!wasmInitialized) {
        try {
            // Initialise le logging WASM (optionnel, mais utile)
            // Vous pourriez avoir besoin d'une fonction `init_panic_hook` ou similaire dans votre Rust
            // console.log("Setting panic hook and log level");
            // wasm_init_panic_hook(); // Si vous avez une fonction pour ça dans lib.rs

            console.log(`Initializing WASM module... (Log Level: ${RUST_LOG_LEVEL})`);
            // Passez l'URL du fichier .wasm si nécessaire (souvent géré automatiquement par wasm-pack)
            await init(); // Assurez-vous que l'URL du .wasm est correcte si non implicite
            wasmInitialized = true;
            _authenticator = new Authenticator();
            console.log("WASM module initialized with Authenticator instance.");

            console.log("WASM module initialized successfully.");

            // Configurer le niveau de log après initialisation si votre lib le permet
             try {
                // Exemple: si vous avez une fonction `set_log_level` dans Rust
                // wasm_set_log_level(RUST_LOG_LEVEL);
                console.log("Rust log level set (if applicable).");
             } catch(logError) {
                console.warn("Could not set Rust log level (function might be missing).", logError);
             }

        } catch (error) {
            console.error("Failed to initialize WASM module:", error);
            throw error; // Propage l'erreur
        }
    } else {
         console.log("WASM module already initialized.");
    }
}

function ensureWasmInitialized() {
    if (!wasmInitialized) {
        const errorMsg = "WASM module is not initialized yet. Call initializeWasm() first.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
}

// --- Wrappers pour les fonctions WASM ---

export function callHelloWorld() {
    ensureWasmInitialized();
    console.log("wasm-handler: Calling hello_world");
    try {
        const result = wasm_hello_world();



        console.log("wasm-handler: hello_world result:", result);
        return result;
    } catch (error) {
        console.error("wasm-handler: Error calling hello_world:", error);
        throw error;
    }
}

export function callHelloFromAuth() {
    ensureWasmInitialized();
    console.log("wasm-handler: Calling hello_from_auth");
    try {
        // Check if authenticator is properly initialized
        if (!_authenticator) {
            console.error("Authenticator instance is null or undefined");
            throw new Error("Authenticator not initialized");
        }

        const result = _authenticator.hello_from_auth();  

        return result;
    } catch (error) {
        console.error("wasm-handler: Error calling hello_from_auth:", error);
        throw error;
    }
}


export function callRegisterFromAuth(createResponseJson) {
    ensureWasmInitialized();
    console.log("wasm-handler: Calling register with response:", createResponseJson);
    try {
        // Check if authenticator is properly initialized
        if (!_authenticator) {
            console.error("Authenticator instance is null or undefined");
            throw new Error("Authenticator not initialized");
        }


        // Si wasm_register attend une string JSON:
        /*const responseString = typeof createResponseJson === 'string' ? createResponseJson : JSON.stringify(createResponseJson);
        const resultJson = wasm_register(responseString);
        console.log("wasm-handler: register raw result:", resultJson);
        const result = JSON.parse(resultJson); // Ou retournez la string si c'est juste un message
        console.log("wasm-handler: register parsed result:", result);*/

        const result = _authenticator.make_credential(createResponseJson);

        
        return result;
    } catch (error) {
        console.error("wasm-handler: Error calling or parsing register:", error);
        throw error;
    }
}

export function callLoginFromAuth(getResponseJson) {
    ensureWasmInitialized();
    console.log("wasm-handler: Calling login with response:", getResponseJson);
    try {
        if (!_authenticator) {
            console.error("Authenticator instance is null or undefined");
            throw new Error("Authenticator not initialized");
        }

        const result = _authenticator.get_assertion(getResponseJson);

        return result;
    } catch (error) {
        console.error("wasm-handler: Error calling or parsing login:", error);
        throw error;
    }
}

export function callParseResponseText(responseText) {
    ensureWasmInitialized();
    console.log("wasm-handler: Calling parse_response_text");
    try {
        // Assurez-vous que wasm_parse_response_text retourne quelque chose d'utile
        const result = wasm_parse_response_text(responseText);
        console.log("wasm-handler: parse_response_text result:", result);
        return result; // Retourne directement ce que Rust renvoie
    } catch (error) {
        console.error("wasm-handler: Error calling parse_response_text:", error);
        throw error;
    }
}

console.log("Register script loaded/injected.");

// COMMUNICATION AVEC LE BACKGROUND
function sendMessageToContentScript(message) {
    // Utilise window.postMessage qui fonctionne entre le script injecté et la page
    window.postMessage({
      source: "webauthn-register-script",
      payload: message
    }, "*");
}
  
// Fonction modifiée pour utiliser le canal de communication
function testHelloFromAuthInRegister() {
    return new Promise((resolve, reject) => {
        console.log("Register script: Sending 'callHelloFromAuth' message via postMessage");
        
        // Envoie le message au content script via postMessage
        sendMessageToContentScript({
            action: 'callHelloFromAuth'
        });
        
        // Ajoute un écouteur temporaire pour attendre la réponse
        const messageListener = function(event) {
            // Vérifie si le message provient du content script et contient une réponse à notre requête
            if (event.data && 
                event.data.source === "webauthn-content-script" && 
                event.data.response && 
                event.data.response.action === 'callHelloFromAuth') {
              
                // Supprime l'écouteur une fois la réponse reçue
                window.removeEventListener('message', messageListener);
                
                const response = event.data.response;
                if (response.success) {
                    console.log("Register script: Received response for 'callHelloFromAuth':", response.data);
                    //alert(`Message from WASM (via register.js): ${response.data}`);
                    resolve(response.data); // Résoudre la promesse avec les données
                } else {
                    console.error("Register script: 'callHelloFromAuth' failed:", response.error || "Unknown error");
                    //alert(`Error getting message from WASM (via register.js): ${response.error || 'Unknown error'}`);
                    reject(new Error(response.error || 'Unknown error')); // Rejeter la promesse avec l'erreur
                }
            }
        };
        
        // Ajoute l'écouteur pour recevoir la réponse
        window.addEventListener('message', messageListener);
        
        // Optionnel: timeout pour éviter que la promesse reste en attente indéfiniment
        setTimeout(() => {
            window.removeEventListener('message', messageListener);
            reject(new Error('Timeout waiting for response'));
        }, 10000);
    });
}

// Fonction modifiée pour utiliser le canal de communication et renvoyer une promesse
function callRegisterFromAuthInRegister(ctap2Data) {
    return new Promise((resolve, reject) => {
        console.log("Register script: Sending 'callRegisterFromAuth' message via postMessage");
        
        // Envoie le message au content script via postMessage
        sendMessageToContentScript({
            action: 'callRegisterFromAuth',
            payload: ctap2Data
        });
      
        // Ajoute un écouteur temporaire pour attendre la réponse
        const messageListener = function(event) {
            // Vérifie si le message provient du content script et contient une réponse à notre requête
            if (event.data && 
                event.data.source === "webauthn-content-script" && 
                event.data.response && 
                event.data.response.action === 'callRegisterFromAuth') {
              
                // Supprime l'écouteur une fois la réponse reçue
                window.removeEventListener('message', messageListener);
                
                const response = event.data.response;
                if (response.success) {
                    console.log("Register script: Received response for 'callRegisterFromAuth':", response.data);
                    //alert(`Message from WASM (via register.js): ${response.data}`);
                    resolve(response.data); // Résoudre la promesse avec les données
                } else {
                    console.error("Register script: 'callRegisterFromAuth' failed:", response.error || "Unknown error");
                    //alert(`Error getting message from WASM (via register.js): ${response.error || 'Unknown error'}`);
                    reject(new Error(response.error || 'Unknown error')); // Rejeter la promesse avec l'erreur
                }
            }
        };
        
        // Ajoute l'écouteur pour recevoir la réponse
        window.addEventListener('message', messageListener);
        
        // Optionnel: timeout pour éviter que la promesse reste en attente indéfiniment
        setTimeout(() => {
            window.removeEventListener('message', messageListener);
            reject(new Error('Timeout waiting for response'));
        }, 10000);
    });
}




// factoriser serait bien

function callLoginFromAuthInRegister(ctap2Data) {
    return new Promise((resolve, reject) => {
        console.log("Register script: Sending 'callLoginFromAuth' message via postMessage");
        
        // Envoie le message au content script via postMessage
        sendMessageToContentScript({
            action: 'callLoginFromAuth',
            payload: ctap2Data
        });
      
        // Ajoute un écouteur temporaire pour attendre la réponse
        const messageListener = function(event) {
            // Vérifie si le message provient du content script et contient une réponse à notre requête
            if (event.data && 
                event.data.source === "webauthn-content-script" && 
                event.data.response && 
                event.data.response.action === 'callLoginFromAuth') {
              
                // Supprime l'écouteur une fois la réponse reçue
                window.removeEventListener('message', messageListener);
                
                const response = event.data.response;
                if (response.success) {
                    console.log("Register script: Received response for 'callLoginFromAuth':", response.data);
                    //alert(`Message from WASM (via register.js): ${response.data}`);
                    resolve(response.data); // Résoudre la promesse avec les données
                } else {
                    console.error("Register script: 'callLoginFromAuth' failed:", response.error || "Unknown error");
                    //alert(`Error getting message from WASM (via register.js): ${response.error || 'Unknown error'}`);
                    reject(new Error(response.error || 'Unknown error')); // Rejeter la promesse avec l'erreur
                }
            }
        };
        
        // Ajoute l'écouteur pour recevoir la réponse
        window.addEventListener('message', messageListener);
        
        // Optionnel: timeout pour éviter que la promesse reste en attente indéfiniment
        setTimeout(() => {
            window.removeEventListener('message', messageListener);
            reject(new Error('Timeout waiting for response'));
        }, 10000);
    });
}







// FIN COMMUNICATION AVEC LE BACKGROUND




// Interception directe des méthodes WebAuthn
// Interception de navigator.credentials.create
const originalCreate = navigator.credentials.create;
navigator.credentials.create = async (options) => {
    console.log("WebAuthn: Intercepted credentials.create call", options);
    const userIdArray = Array.from(new Uint8Array(options.publicKey.user.id));

    const ctap2Data = {
        type: "webauthn.create",
        clientDataJSON: {
            type: "webauthn.create",
            challenge: btoa(String.fromCharCode(...new Uint8Array(options.publicKey.challenge))),
            origin: window.location.origin,
            crossOrigin: false,
        },
        attestationData: {
            rp: options.publicKey.rp,
            user: {
                id: userIdArray,
                name: options.publicKey.user.name,
                displayName: options.publicKey.user.displayName,
            },
            pubKeyCredParams: options.publicKey.pubKeyCredParams,
        },
    };
    console.log("CTAP2: Données envoyées:", JSON.stringify(ctap2Data, null, 2));



   try {


/*
        // VERSION WEB
        const response = await fetch("http://localhost:8080/ctap2/makeCredential", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ctap2Data),
        });
        const resultWEB = await response.json();
        console.log("CTAP2: Réponse du serveur reçue WEB :", JSON.stringify(resultWEB, null, 2));
*/

        // VERSION WASM
        // Attendre la résolution de la promesse
        const result = await callRegisterFromAuthInRegister(JSON.stringify(ctap2Data));
        // Parse the JSON string : string from the WASM module
        const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
        console.log("CTAP2: Réponse du serveur reçue WASM :", JSON.stringify(parsedResult, null, 2));
        



        // Vérifier que result contient les propriétés attendues
        if (!parsedResult || !parsedResult.credentialId || !parsedResult.attestationObject || !parsedResult.clientDataJSON) {
            throw new Error("Réponse invalide du serveur: données manquantes");
        }

        // Then when using the values:
        const rawId = base64ToArrayBuffer(parsedResult.credentialId);
        const id = arrayBufferToBase64(rawId);
        
        const credential = {
            id: id,
            rawId: rawId,
            response: {
                attestationObject: base64ToArrayBuffer(parsedResult.attestationObject),
                clientDataJSON: base64ToArrayBuffer(parsedResult.clientDataJSON),
            },


            type: "public-key",
            authenticatorAttachment: "platform",
            getClientExtensionResults: function () {
                return {};
            },
        };

        Object.setPrototypeOf(credential, PublicKeyCredential.prototype);
        console.log("id:", credential.id);
        console.log("rawId as base64:", arrayBufferToBase64(credential.rawId));
        console.log("Credential créé:", credential);

        return credential;
    } catch (error) {
        console.error("Error during credential creation:", error);
        // Si vous souhaitez que l'erreur remonte au site web appelant, décommentez la ligne suivante:
        throw error;
    }
};

// Interception de navigator.credentials.get
const originalGet = navigator.credentials.get;
navigator.credentials.get = async (options) => {
    const ctap2Data = {
        type: "webauthn.get",
        clientDataJSON: {
            type: "webauthn.get",
            challenge: btoa(String.fromCharCode(...new Uint8Array(options.publicKey.challenge))),
            origin: window.location.origin,
            crossOrigin: false,
        },
        authenticatorData: {
            rpId: options.publicKey.rpId,
            allowCredentials: options.publicKey.allowCredentials?.map(cred => ({
                id: btoa(String.fromCharCode(...new Uint8Array(cred.id))),
                type: cred.type,
            })) || [],
            userVerification: options.publicKey.userVerification || "preferred",
        },
    };

    /*
    console.log("CTAP2: Envoi de données au serveur Rust:", ctap2Data);
    const response = await fetch("http://localhost:8080/ctap2/getAssertion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ctap2Data),
    });
    const result = await response.json();
    console.log("CTAP2: Réponse du serveur reçue:", result);
*/

const result = await callLoginFromAuthInRegister(JSON.stringify(ctap2Data));
// Parse the JSON string : string from the WASM module
const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
console.log("LOGIN CTAP2: Réponse du serveur reçue WASM :", JSON.stringify(parsedResult, null, 2));




// Vérifier que result contient les propriétés attendues
if (!parsedResult || !parsedResult.credentialId || !parsedResult.authenticatorData || !parsedResult.signature) {
    throw new Error("Réponse invalide du serveur: données manquantes");
}



    const rawId = base64ToArrayBuffer(parsedResult.credentialId);
    const id = arrayBufferToBase64(rawId);

    const credential = {
        type: "public-key",
        id: id,
        rawId: rawId,
        response: {
            clientDataJSON: base64ToArrayBuffer(parsedResult.clientDataJSON),
            authenticatorData: base64ToArrayBuffer(parsedResult.authenticatorData),
            signature: base64ToArrayBuffer(parsedResult.signature),
            userHandle: parsedResult.userHandle ? base64ToArrayBuffer(parsedResult.userHandle) : null,
        },
        getClientExtensionResults: function() {
            return {};
        },
        authenticatorAttachment: "platform",
    };

    Object.setPrototypeOf(credential, PublicKeyCredential.prototype);
    console.log("Credential créé pour get:", credential);
    return credential;
};

// Fonctions utilitaires pour la conversion Base64 <-> ArrayBuffer
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    } catch (e) {
        console.error("Error decoding base64:", e, base64);
        throw e;
    }
}



function safeBase64ToArrayBuffer(base64String) {
    // Check if the input is undefined or null first
    if (!base64String) {
        console.error("Base64 string is undefined or null");
        throw new Error("Base64 string is undefined or null");
    }

    try {
        // Normalize the Base64 string
        let normalizedBase64 = base64String
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        // Add padding if needed
        while (normalizedBase64.length % 4 !== 0) {
            normalizedBase64 += '=';
        }
        
        return base64ToArrayBuffer(normalizedBase64);
    } catch (e) {
        console.error("Error in safeBase64ToArrayBuffer:", e);
        // Alternative approach
        try {
            const rawString = atob(base64String.replace(/-/g, '+').replace(/_/g, '/'));
            const numbers = new Array(rawString.length);
            for (let i = 0; i < rawString.length; i++) {
                numbers[i] = rawString.charCodeAt(i);
            }
            return new Uint8Array(numbers).buffer;
        } catch (e2) {
            console.error("Both base64 decoding approaches failed:", e2);
            throw new Error("Failed to decode Base64 string: " + e2.message);
        }
    }
}


const messageDiv = document.getElementById('webauthn-message');
// Flag to track if a WebAuthn operation is in progress
let webAuthnOperationInProgress = false;

function displayMessage(text, isError = false) {
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.style.color = isError ? 'red' : 'green';
        console.log(`UI: ${isError ? 'ERROR' : 'INFO'} - ${text}`);
    } else {
        console.log(`Script: ${isError ? 'ERROR' : 'INFO'} - ${text}`);
    }
}




// Conversion base64 en ArrayBuffer
function base64ToArrayBuffer(base64) {
    try {
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    } catch (e) {
        console.error("Erreur lors du décodage base64:", e, "Chaîne fautive:", base64);
        throw e;
    }
}

// Conversion ArrayBuffer en base64 (standard avec + et /)
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    let base64 = btoa(binary);
    // Convertir en base64 URL-safe
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}


/*


// Fonctions utilitaires Base64URL <-> ArrayBuffer (pour la compatibilité avec le code existant)
function bufferToBase64URL(buffer) {
    const bytes = new Uint8Array(buffer);
    let str = '';
    bytes.forEach((charCode) => str += String.fromCharCode(charCode));
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64URLtoBuffer(base64URL) {
    try {
        const base64 = base64URL.replace(/-/g, '+').replace(/_/g, '/');
        const padLength = (4 - (base64.length % 4)) % 4;
        const padded = base64 + '='.repeat(padLength);
        const binary = atob(padded);
        const buffer = new ArrayBuffer(binary.length);
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return buffer;
    } catch (e) {
        console.error("Error decoding base64URL:", e, base64URL);
        throw e;
    }
}
*/
function recursiveBase64UrlToBuffer(obj) {
    const newObj = {};
    for (const key in obj) {
        if (typeof obj[key] === 'string' && (key === 'challenge' || key === 'id' || key === 'userHandle' || key === 'attestationObject' || key === 'clientDataJSON' || key === 'authenticatorData' || key === 'signature')) {
            try {
                newObj[key] = base64URLtoBuffer(obj[key]);
            } catch (e) {
                console.warn(`Could not decode Base64URL for key "${key}":`, obj[key], e);
                newObj[key] = obj[key];
            }
        } else if (Array.isArray(obj[key])) {
            newObj[key] = obj[key].map(item => (typeof item === 'object' ? recursiveBase64UrlToBuffer(item) : item));
            if (key === 'allowCredentials') {
                newObj[key] = obj[key].map(cred => ({
                    ...cred,
                    id: typeof cred.id === 'string' ? base64URLtoBuffer(cred.id) : cred.id
                }));
            }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            newObj[key] = recursiveBase64UrlToBuffer(obj[key]);
        } else {
            newObj[key] = obj[key];
        }
    }
    if (newObj.user && newObj.user.id && typeof newObj.user.id === 'string') {
        try {
            newObj.user.id = base64URLtoBuffer(newObj.user.id);
        } catch (e) {
            console.warn(`Could not decode Base64URL for user.id:`, newObj.user.id, e);
        }
    }
    return newObj;
}

function recursiveBufferToBase64Url(obj) {
    const newObj = {};
    for (const key in obj) {
        if (obj[key] instanceof ArrayBuffer) {
            newObj[key] = bufferToBase64URL(obj[key]);
        } else if (obj[key] instanceof Uint8Array) {
            newObj[key] = bufferToBase64URL(obj[key].buffer);
        } else if (Array.isArray(obj[key])) {
            newObj[key] = obj[key].map(item => (typeof item === 'object' ? recursiveBufferToBase64Url(item) : item));
            if (key === 'allowCredentials') {
                newObj[key] = obj[key].map(cred => ({
                    ...cred,
                    id: cred.id instanceof ArrayBuffer ? bufferToBase64URL(cred.id) : cred.id
                }));
            }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (key === 'response' && obj[key].clientDataJSON instanceof ArrayBuffer) {
                newObj[key] = recursiveBufferToBase64Url(obj[key]);
            } else if (key === 'rawId' && obj[key] instanceof ArrayBuffer) {
                newObj[key] = bufferToBase64URL(obj[key]);
            } else {
                newObj[key] = recursiveBufferToBase64Url(obj[key]);
            }
        } else {
            newObj[key] = obj[key];
        }
    }
    if (obj.rawId instanceof ArrayBuffer) newObj.rawId = bufferToBase64URL(obj.rawId);
    if (obj.response) {
        if (obj.response.clientDataJSON instanceof ArrayBuffer) {
            if (typeof newObj.response !== 'object') newObj.response = {};
            newObj.response.clientDataJSON = bufferToBase64URL(obj.response.clientDataJSON);
        }
        if (obj.response.authenticatorData instanceof ArrayBuffer) {
            if (typeof newObj.response !== 'object') newObj.response = {};
            newObj.response.authenticatorData = bufferToBase64URL(obj.response.authenticatorData);
        }
        if (obj.response.signature instanceof ArrayBuffer) {
            if (typeof newObj.response !== 'object') newObj.response = {};
            newObj.response.signature = bufferToBase64URL(obj.response.signature);
        }
        if (obj.response.userHandle instanceof ArrayBuffer) {
            if (typeof newObj.response !== 'object') newObj.response = {};
            newObj.response.userHandle = bufferToBase64URL(obj.response.userHandle);
        }
        if (obj.response.attestationObject instanceof ArrayBuffer) {
            if (typeof newObj.response !== 'object') newObj.response = {};
            newObj.response.attestationObject = bufferToBase64URL(obj.response.attestationObject);
        }
    }
    return newObj;
}
// extension/js/message-handler.js
import {
    callHelloWorld,
    callHelloFromAuth,
    callRegisterFromAuth,
    callLoginFromAuth
    //callParseResponseText
} from './wasm-handler.js';

export function setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log("Message handler received:", message, "from sender:", sender);

        // Utilisation d'une fonction async auto-appelante pour gérer les promesses facilement
        // et s'assurer que 'return true' est bien atteint.
        (async () => {
            try {
                let responseData;
                switch (message.action) {
                    case 'callHelloWorld':
                        responseData = callHelloWorld();
                        sendResponse({ success: true, data: responseData });
                        break;

                    case 'callHelloFromAuth':
                        responseData = callHelloFromAuth();
                        sendResponse({ success: true, data: responseData });
                        break;




                    case 'callRegisterFromAuth':                        
                        if (!message.payload) {
                             throw new Error("Credential object is required for register.");
                        }
                        //console.log("Payload avant appel:", JSON.stringify(message.payload, null, 2));
                        
                        responseData = callRegisterFromAuth(message.payload);
                        
                        //console.log(">>>>>>>>>>>>>>>>>>>>>>>> Données après appel:", JSON.stringify(responseData, null, 2));
                        
                        sendResponse({ success: true, data: responseData });
                        break;



                    case 'callLoginFromAuth':
                        if (!message.payload) {
                             throw new Error("Credential object is required for login.");
                        }
                        responseData = callLoginFromAuth(message.payload);
                        sendResponse({ success: true, data: responseData });
                        break;
/*
                    case 'parseResponseText': // Si vous avez besoin de parser du texte brut reçu ailleurs
                         if (!message.payload || typeof message.payload.text !== 'string') {
                             throw new Error("Text string is required for parseResponseText.");
                        }
                        responseData = callParseResponseText(message.payload.text);
                        sendResponse({ success: true, data: responseData });
                        break;
*/
                    default:
                        console.warn("Unknown action received:", message.action);
                        sendResponse({ success: false, error: `Unknown action: ${message.action}` });
                        // Pas besoin de 'return true' ici car la réponse est synchrone
                        return; // Sortir de l'IIFE async
                }
            } catch (error) {
                console.error(`Error processing action "${message.action}":`, error);
                sendResponse({ success: false, error: error.message || "An unknown error occurred" });
            }
        })(); // Fin de l'IIFE async

        // TRÈS IMPORTANT: Indique que la fonction sendResponse sera appelée de manière asynchrone.
        // Doit être retourné par le listener principal, en dehors de l'IIFE.
        return true;
    });

    console.log("Message listener successfully set up.");
}
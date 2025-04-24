// extension/js/background.js
import { initializeWasm } from './wasm-handler.js';
import { setupMessageListener } from './message-handler.js';

console.log("Background service worker started.");

// Fonction principale asynchrone pour gérer l'initialisation
async function main() {
    try {
        console.log("Attempting to initialize WASM...");
        await initializeWasm(); // Attend que le WASM soit prêt
        console.log("WASM initialized. Setting up message listener...");
        setupMessageListener(); // Met en place l'écouteur de messages
        console.log("Background setup complete. Ready for messages.");

        // Autres initialisations ou configurations globales ici si nécessaire
        // chrome.action.onClicked.addListener(...);

    } catch (error) {
        console.error("CRITICAL: Failed to initialize background script:", error);
        // Vous pourriez vouloir définir un état d'erreur global ou désactiver l'icône de l'extension
        // chrome.action.disable(); // Exemple
         chrome.action.setBadgeText({ text: 'ERR' });
         chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    }
}

// Exécute la fonction principale
main();

// Gérer le clic sur l'icône (exemple)
chrome.action.onClicked.addListener((tab) => {
    console.log("Extension icon clicked!");
    // Ouvrir une page de l'extension, envoyer un message au content script, etc.
    // Exemple: injecter register.js si ce n'est pas déjà fait par content_scripts
    /*
    if (tab.url && !tab.url.startsWith("chrome://")) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['js/register.js'] // Assurez-vous qu'il est dans web_accessible_resources
        }).catch(err => console.error("Failed to inject register script:", err));
    }
    */
});
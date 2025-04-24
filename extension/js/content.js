// extension/js/content.js
console.log("Content script loaded.");

// Injection des scripts supplémentaires
const injectScript = (filePath, isModule = false) => {
  console.log('Script Injection for:', filePath);
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(filePath);
  if (isModule) script.type = 'module';
  script.onload = () => {
    console.log(`Script ${filePath} injected successfully`);
    script.remove();
  };
  script.onerror = () => console.error(`Script ${filePath} failed to load`);
  (document.head || document.documentElement).appendChild(script);
};

// Écouteur pour les messages depuis les scripts injectés
window.addEventListener('message', function(event) {
    // Vérifier l'origine du message
    if (event.data && event.data.source === "webauthn-register-script") {
      console.log("Content script: Received message from injected script:", event.data);
      
      const message = event.data.payload;
      
      //console.log("XXXXXXXXXXXXXXXXX: Données :", JSON.stringify(event.data.payload.payload, null, 2));

      // Traiter le message et l'envoyer au background script
      chrome.runtime.sendMessage(message, (response) => {
        // Gérer les erreurs de communication avec le background
        if (chrome.runtime.lastError) {
          console.error("Content script: Error relaying message to background:", chrome.runtime.lastError.message);
          
          // Renvoyer l'erreur au script injecté
          window.postMessage({
            source: "webauthn-content-script",
            response: {
              action: message.action,
              success: false,
              error: chrome.runtime.lastError.message
            }
          }, "*");
          
          return;
        }
        
        // Renvoyer la réponse du background au script injecté
        console.log("Content script: Received response from background:", response);
       
        window.postMessage({
          source: "webauthn-content-script",
          response: {
            action: message.action,
            success: response.success,
            data: response.data,
            error: response.error
          }
        }, "*");
      });
    }
  });

// Test : Envoyer 'helloWorld' au background au chargement
function testHelloWorld() {
    console.log("Content script: Sending 'callHelloWorld' message.");
    chrome.runtime.sendMessage({ action: 'callHelloWorld' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Content script: Error sending/receiving 'callHelloWorld':", chrome.runtime.lastError.message);
            return;
        }
        if (response && response.success) {
            console.log("Content script: Received response for 'callHelloWorld':", response.data);
            alert(`Message from WASM: ${response.data}`);
        } else {
            console.error("Content script: 'callHelloWorld' failed:", response ? response.error : "No response");
            alert(`Error getting message from WASM: ${response?.error || 'Unknown error'}`);
        }
    });
}

function testHelloFromAuth() {
  console.log("Content script: Sending 'callHelloFromAuth' message.");
  chrome.runtime.sendMessage({ action: 'callHelloFromAuth' }, (response) => {
      if (chrome.runtime.lastError) {
          console.error("Content script: Error sending/receiving 'callHelloFromAuth':", chrome.runtime.lastError.message);
          return;
      }
      if (response && response.success) {
          console.log("Content script: Received response for 'callHelloFromAuth':", response.data);
          alert(`Message from WASM: ${response.data}`);
      } else {
          console.error("Content script: 'callHelloFromAuth' failed:", response ? response.error : "No response");
          alert(`Error getting message from WASM: ${response?.error || 'Unknown error'}`);
      }
  });
}

// Injection de icon.js
injectScript('js/icon.js');
console.log("Content script: Injection de icon.js effectuée");

injectScript('js/register.js');
console.log("Content script: Injection de register.js effectuée");

// Appeler le test au démarrage (ou liez-le à un bouton/événement sur la page)
//testHelloWorld();
//testHelloFromAuth();

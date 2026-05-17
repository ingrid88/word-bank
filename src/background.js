chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-word",
    title: "Save \"%s\" to WordKeeper",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "save-word" && info.selectionText) {
    saveWord(info.selectionText.trim(), info.pageUrl);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveWord") {
    saveWord(message.word, message.url);
    sendResponse({ success: true });
  }
  if (message.action === "sendEmail") {
    sendViaGmail(message.to, message.subject, message.body);
    sendResponse({ success: true, note: "sending" });
  }
});

async function sendViaGmail(to, subject, body) {
  try {
    const token = await chrome.identity.getAuthToken({ interactive: true });
    const accessToken = token.token || token;

    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "",
      body
    ].join("\r\n");

    const encoded = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: encoded })
    });

    if (res.ok) {
      chrome.storage.local.set({ emailStatus: "sent" });
    } else {
      const err = await res.json();
      console.error("Gmail API error:", err);
      chrome.storage.local.set({ emailStatus: "failed" });
    }
  } catch (err) {
    console.error("Auth/send error:", err);
    chrome.storage.local.set({ emailStatus: "failed" });
  }
}

async function saveWord(word, url) {
  if (!word || /\s/.test(word)) return;

  const data = await chrome.storage.sync.get({ words: [] });
  const exists = data.words.some((entry) => entry.word === word && entry.url === url);
  if (exists) return;

  const definition = await fetchDefinition(word);
  data.words.push({ word, url, definition, timestamp: Date.now() });
  chrome.storage.sync.set({ words: data.words });
}

async function fetchDefinition(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const json = await res.json();
    const meanings = json[0]?.meanings || [];
    if (meanings.length === 0) return null;
    const first = meanings[0];
    return {
      partOfSpeech: first.partOfSpeech,
      definition: first.definitions[0]?.definition || null,
      example: first.definitions[0]?.example || null
    };
  } catch {
    return null;
  }
}

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
});

function saveWord(word, url) {
  if (!word || /\s/.test(word)) return;

  chrome.storage.sync.get({ words: [] }, (data) => {
    const exists = data.words.some((entry) => entry.word === word && entry.url === url);
    if (!exists) {
      data.words.push({ word, url, timestamp: Date.now() });
      chrome.storage.sync.set({ words: data.words });
    }
  });
}

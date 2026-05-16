const wordListEl = document.getElementById("word-list");
const countEl = document.getElementById("count");
const copyBtn = document.getElementById("copy-btn");
const emailBtn = document.getElementById("email-btn");
const clearBtn = document.getElementById("clear-btn");
const toastEl = document.getElementById("toast");
const emailInput = document.getElementById("email-input");
const saveEmailBtn = document.getElementById("save-email-btn");

chrome.storage.sync.get({ email: "" }, (data) => {
  emailInput.value = data.email;
});

saveEmailBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  chrome.storage.sync.set({ email }, () => showToast("Email saved"));
});

function render(words) {
  countEl.textContent = `(${words.length} word${words.length !== 1 ? "s" : ""})`;

  if (words.length === 0) {
    wordListEl.innerHTML = '<div class="empty">No words saved yet.<br>Double-click or right-click a word to save it.</div>';
    return;
  }

  wordListEl.innerHTML = words.map((entry, i) => {
    const host = new URL(entry.url).hostname;
    return `
      <div class="word-item">
        <div>
          <div class="word-text">${escapeHtml(entry.word)}</div>
          <div class="word-url"><a href="${escapeHtml(entry.url)}" target="_blank">${escapeHtml(host)}</a></div>
        </div>
        <button class="delete-btn" data-index="${i}">&times;</button>
      </div>
    `;
  }).join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 1500);
}

function loadWords(callback) {
  chrome.storage.sync.get({ words: [] }, (data) => {
    callback(data.words);
  });
}

loadWords((words) => render(words));

wordListEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-btn");
  if (!btn) return;
  const index = parseInt(btn.dataset.index, 10);
  loadWords((words) => {
    words.splice(index, 1);
    chrome.storage.sync.set({ words }, () => render(words));
  });
});

copyBtn.addEventListener("click", () => {
  loadWords((words) => {
    if (words.length === 0) return showToast("Nothing to copy");
    const text = words.map((w) => `${w.word} — ${w.url}`).join("\n");
    navigator.clipboard.writeText(text).then(() => showToast("Copied!"));
  });
});

emailBtn.addEventListener("click", () => {
  chrome.storage.sync.get({ email: "" }, (emailData) => {
    const to = emailData.email;
    if (!to) return showToast("Set your email first");
    loadWords((words) => {
      if (words.length === 0) return showToast("Nothing to email");
      const body = words.map((w) => `${w.word} — ${w.url}`).join("\n");
      chrome.runtime.sendMessage(
        { action: "sendEmail", to, subject: "My WordKeeper List", body }
      );
      showToast("Sending...");
    });
  });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.emailStatus) {
    const status = changes.emailStatus.newValue;
    if (status === "sent") showToast("Email sent!");
    else if (status === "failed") showToast("Send failed");
    chrome.storage.local.remove("emailStatus");
  }
  if (changes.words) {
    render(changes.words.newValue || []);
  }
});

clearBtn.addEventListener("click", () => {
  if (confirm("Delete all saved words?")) {
    chrome.storage.sync.set({ words: [] }, () => {
      render([]);
      showToast("Cleared");
    });
  }
});

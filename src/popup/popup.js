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

chrome.storage.onChanged.addListener((changes) => {
  if (changes.words) {
    render(changes.words.newValue || []);
  }
});

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
      sendViaGmail(to, "My WordKeeper List", body);
    });
  });
});

function sendViaGmail(to, subject, body) {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError || !token) {
      showToast("Sign-in failed");
      return;
    }

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

    fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: encoded })
    })
      .then((res) => {
        if (res.ok) {
          showToast("Email sent!");
        } else {
          res.json().then((err) => {
            console.error("Gmail API error:", err);
            showToast("Send failed");
          });
        }
      })
      .catch(() => showToast("Send failed"));
  });
}

clearBtn.addEventListener("click", () => {
  if (confirm("Delete all saved words?")) {
    chrome.storage.sync.set({ words: [] }, () => {
      render([]);
      showToast("Cleared");
    });
  }
});

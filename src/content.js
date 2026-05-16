document.addEventListener("dblclick", () => {
  const selection = window.getSelection().toString().trim();
  if (!selection || /\s/.test(selection)) return;

  chrome.runtime.sendMessage({
    action: "saveWord",
    word: selection,
    url: document.URL
  });

  showNotification(selection);
});

function showNotification(word) {
  const el = document.createElement("div");
  el.textContent = `"${word}" saved to WordKeeper`;
  el.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #333;
    color: #fff;
    padding: 10px 16px;
    border-radius: 6px;
    font: 14px sans-serif;
    z-index: 2147483647;
    opacity: 1;
    transition: opacity 0.3s;
  `;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 1500);
}

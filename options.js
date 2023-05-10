document.getElementById("save").addEventListener("click", () => {
  const proxyServer = document.getElementById("proxyServer").value;
  chrome.storage.sync.set({ proxyServer }, () => {
    console.log("Proxy server saved:", proxyServer);
  });
});

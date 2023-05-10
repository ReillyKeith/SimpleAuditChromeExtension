class ProxyInterceptor {
  constructor() {
    this.proxyEnabled = false;
    this.proxyServer = "";
    this.init();
  }

  async init() {
    const data = await this.getStorageData(["proxyEnabled", "proxyServer"]);
    this.proxyEnabled = data.proxyEnabled || false;
    this.proxyServer = data.proxyServer || "";
    this.setProxy();
    this.addWebRequestListener();
  }

  async getStorageData(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (data) => {
        resolve(data);
      });
    });
  }

  async setStorageData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    });
  }

  async toggleProxy() {
    this.proxyEnabled = !this.proxyEnabled;
    await this.setStorageData({ proxyEnabled: this.proxyEnabled });
    this.setProxy();
  }

  setProxy() {
    if (!this.proxyEnabled || !this.proxyServer) {
      chrome.proxy.settings.set({ value: { mode: "direct" }, scope: "regular" });
    } else {
      chrome.proxy.settings.set({
        value: {
          mode: "fixed_servers",
          rules: {
            singleProxy: {
              scheme: "http",
              host: this.proxyServer.split(":")[0],
              port: parseInt(this.proxyServer.split(":")[1]),
            },
            bypassList: [],
          },
        },
        scope: "regular",
      });
    }
  }

  addWebRequestListener() {
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => {
        if (this.proxyEnabled) {
          console.log("Intercepted Request:", details);
        }
      },
      { urls: ["<all_urls>"] }
    );

    chrome.webRequest.onCompleted.addListener(
      (details) => {
        if (this.proxyEnabled) {
          console.log("Intercepted Response:", details);
          this.saveResponseToFile(details);
        }
      },
      { urls: ["<all_urls>"] }
    );
  }

  async saveResponseToFile(details) {
    const url = new URL(details.url);
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const filename = `${url.hostname}_${timestamp}.json`;

    // Create a JSON object with the intercepted response details
    const data = JSON.stringify(details, null, 2);
    const base64Data = btoa(unescape(encodeURIComponent(data)));
    const dataUrl = `data:application/json;base64,${base64Data}`;

    // Download the file
    chrome.downloads.download({
      url: dataUrl,
      filename: `proxy_interceptor_logs/${filename}`,
      saveAs: false,
    });
  }


}

const proxyInterceptor = new ProxyInterceptor();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleProxy") {
    proxyInterceptor.toggleProxy();
  }
});
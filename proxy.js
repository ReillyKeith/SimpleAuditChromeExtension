class Proxy {
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
}

export default Proxy;

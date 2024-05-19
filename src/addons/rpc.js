const version = require("../../package.json").version;

const initRPC = () => {
  class RPC {
    constructor() {
      this.client = new (require("discord-rpc-revamp").Client)();
      this.client.connect({ clientId: "1233829658345078846" }).catch();
      this.client.on("ready", () => {
        this.client
          .setActivity({
            startTimestamp: Date.now(),
            largeImageKey: "juice",
            largeImageText: `Juice Client v${version}`,
            buttons: [
              { label: "Download", url: "https://juice.irrvlo.xyz" },
              { label: "Discord", url: "https://discord.gg/FjzAAdSjng" },
            ],
          })
          .catch();
      });
    }
  }

  new RPC();
};

module.exports = { initRPC };

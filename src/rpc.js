const version = require("../package.json").version;

module.exports = class {
  constructor() {
    this.client = new (require("discord-rpc-revamp").Client)();
    this.client.connect({ clientId: "1233829658345078846" }).catch();
    this.client.on("ready", () => {
      this.client
        .setActivity({
          startTimestamp: Date.now(),
          largeImageKey: "juicer",
          largeImageText: "Juice Client v" + version,
          buttons: [
            { label: "Download", url: "https://juice.irrvlo.xyz" },
            { label: "Discord", url: "https://discord.gg/FjzAAdSjng" },
          ],
        })
        .catch();
    });
  }
};

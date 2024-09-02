const rpc = require("discord-rpc");
const version = require("../../package.json").version;

class DiscordRPC {
  constructor() {
    this.clientId = "1233829658345078846";
    this.client = new rpc.Client({ transport: "ipc" });
    this.init();
  }

  init() {
    this.client.on("ready", () => {
      this.setActivity();
    });

    this.client.on("disconnected", () => {
      this.client.login({ clientId: this.clientId }).catch(console.error);
    });

    this.client.login({ clientId: this.clientId }).catch(console.error);
  }

  setActivity(activity = this.defaultActivity()) {
    this.client.request("SET_ACTIVITY", {
      pid: process.pid,
      activity: activity,
    });
  }

  defaultActivity() {
    return {
      timestamps: { start: Date.now() },
      state: "In the lobby",
      assets: {
        large_image: "juice",
        large_text: `Juice Client v${version}`,
      },
      buttons: [
        { label: "Download", url: "https://juice.irrvlo.xyz" },
        { label: "Discord", url: "https://discord.gg/FjzAAdSjng" },
      ],
    };
  }

  updateActivity(newActivity) {
    this.setActivity(newActivity);
  }
}

module.exports = DiscordRPC;


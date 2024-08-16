const version = require("../../package.json").version;
const clientid = "1233829658345078846";
const rpc = require("discord-rpc");

const initRPC = () => {
  const client = new rpc.Client({ transport: "ipc" });

  client.on("ready", () => {
    client.request("SET_ACTIVITY", {
      pid: process.pid,
      activity: {
        timestamps: { start: Date.now() },
        assets: {
          large_image: "juice",
          large_text: `Juice Client v${version}`,
        },
        buttons: [
          { label: "Download", url: "https://juice.irrvlo.xyz" },
          { label: "Discord", url: "https://discord.gg/FjzAAdSjng" },
        ],
      },
    });
  });

  client.on("disconnected", () => {
    client.login({ clientId: clientid }).catch(console.error);
  });

  client.login({ clientId: clientid }).catch(console.error);
};

module.exports = { initRPC };

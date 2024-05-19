const { app } = require("electron");
const { initSplash } = require("./windows/splash");
const { initResourceSwapper } = require("./addons/swapper");
const { initRPC } = require("./addons/rpc");

app.on("ready", () => {
  initSplash();
  initResourceSwapper();
  initRPC();
});

app.on("window-all-closed", () => app.quit());
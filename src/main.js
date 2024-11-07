require("v8-compile-cache");
const { app } = require("electron");
const { initSplash } = require("./windows/splash");
const { initResourceSwapper } = require("./addons/swapper");

app.on("ready", () => {
  initSplash();
  initResourceSwapper();
});

app.on("window-all-closed", () => app.quit());

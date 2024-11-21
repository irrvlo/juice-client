const { app, clipboard, screen } = require("electron");
const shortcut = require("electron-localshortcut");
const Store = require("electron-store");
const store = new Store();
const { initResourceSwapper } = require("../addons/swapper");

const registerShortcuts = (window) => {
  const register = (key, action) => shortcut.register(window, key, action);
  register("Escape", () =>
    window.webContents.executeJavaScript("document.exitPointerLock()")
  );
  register("F2", () => {
    const { x, y, width, height } = screen.getPrimaryDisplay().bounds;
    window.capturePage({ x, y, width, height }).then((image) => {
      clipboard.writeImage(image);
      window.webContents.send("notification", {
        message: "Screenshot copied to clipboard",
        icon: image.toDataURL(),
      });
    });
  });
  register("F4", () => {
    window.loadURL(store.get("settings").base_url);
  });
  register("F5", () => {
    window.reload();
  });
  register("F6", () => {
    window.loadURL(clipboard.readText());
  });
  register("F7", () => clipboard.writeText(window.webContents.getURL()));
  register("F11", () => window.setFullScreen(!window.isFullScreen()));
  register("F12", () => window.webContents.toggleDevTools());
  register("Ctrl+Shift+I", () => window.webContents.toggleDevTools());
  register("Ctrl+Shift+C", () => window.webContents.toggleDevTools());
  register("Ctrl+Shift+J", () => window.webContents.toggleDevTools());
  register("Alt+F4", () => app.quit());
};

module.exports = { registerShortcuts };

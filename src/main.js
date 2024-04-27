require("v8-compile-cache");
const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const shortcut = require("electron-localshortcut");
const path = require("path");

new (require('./rpc'))()

app.commandLine.appendSwitch("disable-frame-rate-limit");
app.commandLine.appendSwitch("disable-gpu-vsync");
app.allowRendererProcessReuse = true;

autoUpdater.setFeedURL({
  provider: "github",
  owner: "irrvlo",
  repo: "juice-client",
});

autoUpdater.autoDownload = false;

autoUpdater.on("update-available", () => {
  const options = {
    type: "info",
    buttons: ["Yes", "No"],
    title: "Update available",
    message: "An update is available. Would you like to download it?",
  };
  dialog.showMessageBox(options).then((response) => {
    if (response.response === 0) {
      autoUpdater.downloadUpdate();
    } else {
      app.quit();
    }
  });
});

autoUpdater.on("update-downloaded", (info) => {
  autoUpdater.quitAndInstall();
});

async function checkForUpdates() {
  await autoUpdater.checkForUpdates();
  autoUpdater.checkForUpdatesAndNotify();
}

function createWindow() {
  let win = new BrowserWindow({
    icon: path.join(__dirname, "assets/icon.ico"),
    title: "Juice Client",
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.removeMenu();
  win.maximize();
  win.loadURL("https://kirka.io");

  win.on("page-title-updated", (e) => e.preventDefault());

  function registerShortcut(key, action) {
    shortcut.register(win, key, action);
  }

  registerShortcut("Escape", () => {
    win.webContents.executeJavaScript(`document.exitPointerLock()`);
  });

  registerShortcut("F4", () => {
    win.loadURL("https://kirka.io");
  });

  registerShortcut("F5", () => {
    win.reload();
  });

  registerShortcut("Ctrl+R", () => {
    win.reload();
  });

  registerShortcut("F11", () => {
    win.setFullScreen(!win.isFullScreen());
  });

  registerShortcut("F12", () => {
    win.webContents.openDevTools();
  });

  registerShortcut("Ctrl+Shift+I", () => {
    win.webContents.openDevTools();
  });
}

app.on("ready", async () => {
  checkForUpdates();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

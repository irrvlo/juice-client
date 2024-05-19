const { BrowserWindow, ipcMain, app } = require("electron");
const isPackaged = require('electron-is-packaged').isPackaged;
const { autoUpdater } = require("electron-updater");
const { initGame } = require("./game");
const path = require("path");

autoUpdater.setFeedURL({
  provider: "github",
  owner: "irrvlo",
  repo: "juice-client",
});

let splashWindow;

const createWindow = () => {
  splashWindow = new BrowserWindow({
    icon: path.join(__dirname, "../assets/img/icon.png"),
    width: 600,
    height: 300,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/splash.js"),
    },
  });

  splashWindow.loadFile(path.join(__dirname, "../assets/html/splash.html"));
  splashWindow.once("ready-to-show", () => {
    splashWindow.show();
  });

  splashWindow.on("closed", () => {
    ipcMain.removeAllListeners("check-for-updates");
    ipcMain.removeAllListeners("quit-and-install");
    splashWindow = null;
  });
};

const checkForUpdates = async () => {
  ipcMain.on("check-for-updates", async () => {
    await autoUpdater.checkForUpdates();
  });

  ipcMain.on("quit-and-install", () => {
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 5000);
  });

  autoUpdater.on("update-available", () => {
    splashWindow.webContents.send("update-available");
  });

  autoUpdater.on("update-not-available", () => {
    splashWindow.webContents.send("update-not-available");
    handleClose();
  });

  autoUpdater.on("update-downloaded", () => {
    splashWindow.webContents.send("update-downloaded");
  });

  autoUpdater.on("download-progress", (progress) => {
    splashWindow.webContents.send("download-progress", progress);
  });
};

const handleClose = () => {
  setTimeout(() => {
    initGame();
    splashWindow.close();
  }, 3000);
};

const initSplash = () => {
  console.log(isPackaged ? 'Checking for updates...' : 'Running unpacked, skipped update check...');
  if (isPackaged) {
    checkForUpdates();
  } else {
    handleClose();
  }
  createWindow();
};

module.exports = {
  initSplash,
};

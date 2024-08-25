const { BrowserWindow, ipcMain, app } = require("electron");
const isPackaged = require('electron-is-packaged').isPackaged;
const { autoUpdater } = require("electron-updater");
const { initGame } = require("./game");
const path = require("path");
const log = require("electron-log");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = true;

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
    if (isPackaged) {
      checkForUpdates();
    } else {
      handleClose();
    }
  });

  splashWindow.on("closed", () => {
    ipcMain.removeAllListeners("quit-and-install");
    splashWindow = null;
  });
};

ipcMain.on("quit-and-install", () => {
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 5000);
});

const checkForUpdates = () => {
  log.info("Checking for updates...");

  autoUpdater.on("update-available", () => {
    log.info("Update available! Attempting download...");
    splashWindow.webContents.send("update-available");
  });

  autoUpdater.on("update-not-available", () => {
    log.info("No updates available. Launching...");
    splashWindow.webContents.send("update-not-available");
    handleClose();
  });

  autoUpdater.on("update-downloaded", () => {
    log.info("Update downloaded!");
    splashWindow.webContents.send("update-downloaded");
  });

  autoUpdater.on("download-progress", (progress) => {
    log.info(`Downloading update: ${Math.round(progress.percent)}%`);
    splashWindow.webContents.send("download-progress", progress);
  });

  autoUpdater.on("error", (error) => {
    log.error(`Error in auto-updater: ${error}`);
    splashWindow.webContents.send("update-error", error.message);
    handleClose();
  });

  autoUpdater.checkForUpdates().catch((err) => {
    log.error(`Failed to check for updates: ${err.message}`);
    handleClose();
  });
};

const handleClose = () => {
  setTimeout(() => {
    if (splashWindow) {
      initGame();
      splashWindow.close();
    }
  }, 2000);
};

const initSplash = () => {
  log.info(isPackaged ? 'Checking for updates...' : 'Running unpacked, skipped update check...');
  createWindow();
};

module.exports = {
  initSplash,
};

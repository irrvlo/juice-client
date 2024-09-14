const { BrowserWindow, ipcMain, app } = require("electron");
const { default_settings } = require("../util/defaults.json");
const { registerShortcuts } = require("../util/shortcuts");
const { applySwitches } = require("../util/switches");
const DiscordRPC = require("../addons/rpc");
const path = require("path");
const Store = require("electron-store");
const fs = require("fs");

const store = new Store();
if (!store.has("settings")) {
  store.set("settings", default_settings);
}

const settings = store.get("settings");

for (const key in default_settings) {
  if (
    !settings.hasOwnProperty(key) ||
    typeof settings[key] !== typeof default_settings[key]
  ) {
    settings[key] = default_settings[key];
    store.set("settings", settings);
  }
}

ipcMain.on("get-settings", (e) => {
  e.returnValue = settings;
});

ipcMain.on("update-setting", (e, key, value) => {
  settings[key] = value;
  store.set("settings", settings);
});

let gameWindow;

applySwitches(settings);

const createWindow = () => {
  gameWindow = new BrowserWindow({
    fullscreen: settings.auto_fullscreen,
    icon: path.join(__dirname, "../assets/img/icon.png"),
    title: "Juice Client",
    width: 1280,
    height: 720,
    show: false,
    backgroundColor: "#141414",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, "../preload/game.js"),
    },
  });

  const scriptsPath = path.join(
    app.getPath("documents"),
    "JuiceClient",
    "scripts"
  );
  if (!fs.existsSync(scriptsPath)) {
    fs.mkdirSync(scriptsPath, { recursive: true });
  }

  ipcMain.on("get-scripts-path", (e) => {
    e.returnValue = scriptsPath;
  });

  gameWindow.webContents.on("new-window", (e, url) => {
    e.preventDefault();
    require("electron").shell.openExternal(url);
  });

  gameWindow.webContents.on("did-navigate-in-page", (e, url) => {
    gameWindow.webContents.send("url-change", url);

    if (settings.discord_rpc && gameWindow.DiscordRPC) {
      const stateMap = {
        "https://kirka.io": "In the lobby",
        "https://kirka.io/hub/leaderboard": "Viewing the leaderboard",
        "https://kirka.io/hub/clans/champions-league":
          "Viewing the clan leaderboard",
        "https://kirka.io/hub/clans/my-clan": "Viewing their clan",
        "https://kirka.io/hub/market": "Viewing the market",
        "https://kirka.io/hub/live": "Viewing videos",
        "https://kirka.io/hub/news": "Viewing news",
        "https://kirka.io/hub/terms": "Viewing the terms of service",
        "https://kirka.io/store": "Viewing the store",
        "https://kirka.io/servers/main": "Viewing main servers",
        "https://kirka.io/servers/parkour": "Viewing parkour servers",
        "https://kirka.io/servers/custom": "Viewing custom servers",
        "https://kirka.io/quests/hourly": "Viewing hourly quests",
        "https://kirka.io/friends": "Viewing friends",
        "https://kirka.io/inventory": "Viewing their inventory",
      };

      let state;

      if (stateMap[url]) {
        state = stateMap[url];
      } else if (url.startsWith("https://kirka.io/games/")) {
        state = "In a match";
      } else if (url.startsWith("https://kirka.io/profile/")) {
        state = "Viewing a profile";
      } else {
        state = "In the lobby";
      }

      gameWindow.DiscordRPC.setState(state);
    }
  });

  gameWindow.loadURL("https://kirka.io");
  gameWindow.removeMenu();
  gameWindow.maximize();

  gameWindow.once("ready-to-show", () => {
    gameWindow.show();
  });

  registerShortcuts(gameWindow);

  gameWindow.on("page-title-updated", (e) => e.preventDefault());

  gameWindow.on("closed", () => {
    ipcMain.removeAllListeners("get-settings");
    ipcMain.removeAllListeners("update-setting");
    gameWindow = null;
  });
};

const initGame = () => {
  createWindow();
  if (settings.discord_rpc) {
    gameWindow.DiscordRPC = new DiscordRPC();
  }
};

module.exports = {
  initGame,
};

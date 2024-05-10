require("v8-compile-cache");
const {
  app,
  BrowserWindow,
  dialog,
  clipboard,
  protocol,
  ipcMain,
} = require("electron");
const { autoUpdater } = require("electron-updater");
const { applySwitches } = require("./switches");
const Store = require("electron-store");
const shortcut = require("electron-localshortcut");
const path = require("path");
const initResourceSwapper = require("./swapper");
const store = new Store();

const defaultSettings = {
  perm_crosshair: true,
  hitmarker_link: "",
  ui_animations: true,
  hide_chat: false,
  hide_interface: false,
  skip_loading: false,
  interface_opacity: "100",
  interface_bounds: "2",
  rave_mode: false,
  unlimited_fps: false,
  auto_fullscreen: true,
  discord_rpc: true,
  css_link: "",
  css_enabled: false,
  experimental_flags: false,
  low_latency: false,
  increase_limits: false,
  helpful_flags: false,
  remove_useless_features: false,
  in_process_gpu: false,
  gpu_rasterization: false,
  menu_keybind: "ShiftRight",
};

if (!store.has("settings")) {
  store.set("settings", defaultSettings);
}

const settings = store.get("settings");

for (const key in defaultSettings) {
  if (
    !settings.hasOwnProperty(key) ||
    typeof settings[key] !== typeof defaultSettings[key]
  ) {
    settings[key] = defaultSettings[key];
    store.set("settings", settings);
  }
}

applySwitches(settings);

ipcMain.on("update-setting", (event, key, value) => {
  settings[key] = value;
  store.set("settings", settings);
});

ipcMain.on("get-settings", (event) => {
  event.returnValue = store.get("settings");
});

app.commandLine.appendSwitch("high-dpi-support", "1");
app.commandLine.appendSwitch("ignore-gpu-blacklist");
app.allowRendererProcessReuse = true;

if (settings.discord_rpc) {
  new (require("./rpc"))();
}

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
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "juiceclient",
    privileges: {
      secure: true,
      corsEnabled: true,
    },
  },
]);

function createWindow() {
  let win = new BrowserWindow({
    fullscreen: settings.auto_fullscreen,
    icon: path.join(__dirname, "assets/icon.ico"),
    title: "Juice Client",
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.removeMenu();
  win.maximize();
  win.loadURL("https://kirka.io");

  win.on("page-title-updated", (e) => e.preventDefault());

  shortcut.register(win, "Escape", () =>
    win.webContents.executeJavaScript(`document.exitPointerLock()`)
  );
  shortcut.register(win, "Alt+F4", () => win.close());
  shortcut.register(win, "F4", () => win.loadURL("https://kirka.io"));
  shortcut.register(win, "F5", () => win.reload());
  shortcut.register(win, "F6", () => win.loadURL(clipboard.readText()));
  shortcut.register(win, "F11", () => win.setFullScreen(!win.isFullScreen()));
  shortcut.register(win, "F12", () => win.webContents.openDevTools());
  shortcut.register(win, "Ctrl+Shift+I", () => win.webContents.openDevTools());
}

app.on("ready", async () => {
  await checkForUpdates();
  initResourceSwapper();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

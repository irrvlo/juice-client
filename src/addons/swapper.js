const { app, session, protocol } = require("electron");
const path = require("path");
const fs = require("fs");
const url = require("url");

const initResourceSwapper = () => {
  protocol.registerFileProtocol("juiceclient", (request, callback) =>
    callback({ path: request.url.replace("juiceclient://", "") }),
  );
  protocol.registerFileProtocol("file", (request, callback) => {
    callback(decodeURIComponent(request.url.replace("file:///", "")));
  });

  const SWAP_FOLDER = path.join(
    app.getPath("documents"),
    "JuiceClient",
    "swapper",
  );
  const assetsFolder = path.join(SWAP_FOLDER, "assets");
  const folders = ["css", "media", "img", "glb", "js"];
  let folder_regex_generator = "JuiceClient[\\\\/]swapper[\\\\/]assets[\\\\/](";
  folder_regex_generator += folders.join("|");
  folder_regex_generator += ")[\\\\/][^\\\\/]+\\.[^.]+$";
  let folder_regex = new RegExp(folder_regex_generator, "");

  try {
    if (!fs.existsSync(assetsFolder))
      fs.mkdirSync(assetsFolder, { recursive: true });
    folders.forEach((folder) => {
      const folderPath = path.join(assetsFolder, folder);
      if (!fs.existsSync(folderPath))
        fs.mkdirSync(folderPath, { recursive: true });
    });
  } catch (e) {
    console.error(e);
  }

  const swap = {
    filter: { urls: [] },
    files: {},
  };

  const proxyUrls = [
    "cloudyfrogs.com",
    "snipers.io",
    "ask101math.com",
    "fpsiogame.com",
    "cloudconverts.com",
    "kirka.io",
  ];

  const allFilesSync = (dir) => {
    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) allFilesSync(filePath);
      else {
        const useAssets = folder_regex.test(filePath);
        if (!useAssets) return;

        proxyUrls.forEach((proxy) => {
          const kirk =
            `*://${proxy}` +
            filePath.replace(SWAP_FOLDER, "").replace(/\\/g, "/") +
            "*";
          swap.filter.urls.push(kirk);
          swap.files[kirk.replace(/\*/g, "")] = url.format({
            pathname: filePath,
            protocol: "",
            slashes: false,
          });
        });
      }
    });
  };

  allFilesSync(SWAP_FOLDER);

  if (swap.filter.urls.length) {
    session.defaultSession.webRequest.onBeforeRequest(
      swap.filter,
      (details, callback) => {
        const redirect =
          "juiceclient://" +
          (swap.files[details.url.replace(/https|http|(\?.*)|(#.*)/gi, "")] ||
            details.url);
        callback({ cancel: false, redirectURL: redirect });
      },
    );
  }
};

module.exports = { initResourceSwapper };

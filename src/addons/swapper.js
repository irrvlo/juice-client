const { app, session, protocol } = require("electron");
const path = require("path");
const fs = require("fs");
const url = require("url");

let common_filenames = [];
common_filenames.push("success-alert");
common_filenames.push("bell-store");
common_filenames.push("destroy");
common_filenames.push("place");
common_filenames.push("whoosh");
common_filenames.push("wound1");
common_filenames.push("wound2");
common_filenames.push("open-chest");
common_filenames.push("reload");
common_filenames.push("kill1");
common_filenames.push("kill2");
common_filenames.push("kill3");
common_filenames.push("kill4");
common_filenames.push("kill5");
common_filenames.push("hit");
common_filenames.push("gem");
common_filenames.push("gem2");
common_filenames.push("coin");
common_filenames.push("christmas-bell");
common_filenames.push("button-special");
common_filenames.push("bullet-dropping2");
common_filenames.push("bullet-dropping1");
common_filenames.push("Water");
common_filenames.push("Stone");
common_filenames.push("Sand");
common_filenames.push("Mud");
common_filenames.push("Grass");
let regex_filename = /[^\/]+$/gm;

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
          const kirk = `*://${proxy}${filePath.replace(SWAP_FOLDER, "").replace(/\\/g, "/")}*`;
          const origfilterurl = kirk.match(/\/[^\/]+\.(?:[a-zA-Z0-9]+)\*/gi)[0];
          let filterurl = origfilterurl.replace(/\_/g, "");
          filterurl = filterurl.replace("/", "/*");
          filterurl = filterurl.replace(".", "*.*");
          let common_name_test = filterurl.match(regex_filename)[0];
          let common_filepath = common_name_test.split(common_name_test)[0];
          if (common_name_test) {
            common_name_test = common_name_test.replace(/\*/gm, "");
            if (common_filenames.includes(common_name_test.split(".")[0])) {
              filterurl = `${common_filepath}/*${common_name_test.split(".")[0]}*${common_name_test.split(".")[common_name_test.split(".").length - 1]}`;
            }
          }
          swap.filter.urls.push(kirk.replace(origfilterurl, filterurl));
          swap.files[kirk.replace(/\*|_/g, "")] = url.format({
            pathname: filePath,
            protocol: "",
            slashes: false,
          });
          if (
            common_filenames.includes(
              kirk
                .replace(/\*|_/g, "")
                .match(/[^\/\\]*?(?=\.[^\/\\]*$)/gm)[0]
                .replace(/_/gm, ""),
            )
          ) {
            swap.files[
              kirk
                .replace(/\*|_/g, "")
                .replace(/\/([^\/]*?)\.[^.]*\.(\w+)$/, "/$1.$2")
            ] = url.format({
              pathname: filePath,
              protocol: "",
              slashes: false,
            });
          }
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
          (swap.files[
            details.url.replace(/https|http|(\?.*)|(#.*)|\_/gi, "")
          ] ||
            swap.files[
              details.url
                .replace(/https|http|(\?.*)|(#.*)|\_/gi, "")
                .replace(/\/([^\/]*?)\.[^.]*\.(\w+)$/, "/$1.$2")
            ] ||
            details.url);
        callback({ cancel: false, redirectURL: redirect });
      },
    );
  }
};

module.exports = { initResourceSwapper };

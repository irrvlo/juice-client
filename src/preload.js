const Menu = require("./menu");
const { ipcRenderer } = require("electron");

ipcRenderer.on("url-changed", (e, url) => {
  console.log(url);
});

if (!window.location.href.startsWith("https://kirka.io/")) {
  window.require = undefined;
  document.querySelector("#juice-menu").remove();
}

document.addEventListener("DOMContentLoaded", () => {
  const menu = new Menu();
  menu.init();

  const joinUsingURL = () => {
    const container = document.querySelector(".play-content");
    if (container && !container.querySelector(".joinUsingURL")) {
      const joinBtn = document.createElement("button");
      joinBtn.innerText = "Join Game";
      joinBtn.className = "joinUsingURL text-2";
      joinBtn.onclick = () => {
        const clipboardUrl = navigator.clipboard.readText();
        const urlPattern = /^https:\/\/kirka\.io\/games\//i;
        if (urlPattern.test(clipboardUrl)) {
          window.location.href = clipboardUrl;
        }
      };

      Object.assign(joinBtn.style, {
        border: "4px solid #26335b",
        backgroundColor: "#3b4975",
        fontWeight: "700",
        color: "#fff",
        padding: "4px 8px",
        borderRadius: "4px",
        outline: "none",
        cursor: "pointer",
        marginBottom: "4px",
      });

      container.insertBefore(
        joinBtn,
        container.querySelector(".play-content-up")
      );
    }
  };

  const observeBodyChanges = () => {
    new MutationObserver(() => {
      joinUsingURL();
    }).observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  const loadTheme = () => {
    const addedStyles = document.createElement("style");
    addedStyles.id = "juice-styles-theme";
    document.head.appendChild(addedStyles);

    const updateTheme = () => {
      const settings = ipcRenderer.sendSync("get-settings");
      const cssLink = settings.css_link;

      if (cssLink && settings.css_enabled) {
        addedStyles.innerHTML = `@import url('${cssLink}');`;
      } else {
        addedStyles.innerHTML = "";
      }
    };

    document.addEventListener("juice-settings-changed", (e) => {
      if (e.detail.setting === "css_link" || e.detail.setting === "css_enabled") {
        updateTheme();
      }
    });

    updateTheme();
  };

  const applyUIFeatures = () => {
    const addedStyles = document.createElement("style");
    addedStyles.id = "juice-styles-ui-features";
    document.head.appendChild(addedStyles);

    const updateUIFeatures = () => {
      const settings = ipcRenderer.sendSync("get-settings");
      const styles = [];

      if (settings.perm_crosshair) {
        styles.push(
          ".crosshair-static { opacity: 1 !important; visibility: visible !important; display: block !important; }"
        );
      }

      if (settings.hide_chat) {
        styles.push(
          ".desktop-game-interface > .chat { display: none !important; }"
        );
      }

      if (settings.hide_interface) {
        styles.push(
          ".desktop-game-interface, .crosshair-cont, .ach-cont, .hitme-cont, .sniper-mwNMW-cont, .team-score, .score { display: none !important; }"
        );
      }

      if (settings.skip_loading) {
        styles.push(".loading-scene { display: none !important; }");
      }

      if (settings.interface_opacity) {
        styles.push(
          `.desktop-game-interface { opacity: ${settings.interface_opacity}% !important; }`
        );
      }

      if (settings.interface_bounds) {
        let scale =
          settings.interface_bounds === "1"
            ? 0.9
            : settings.interface_bounds === "0"
            ? 0.8
            : 1;
        styles.push(
          `.desktop-game-interface { transform: scale(${scale}) !important; }`
        );
      }

      if (settings.hitmarker_link !== "") {
        styles.push(
          `.hitmark { content: url(${settings.hitmarker_link}) !important; }`
        );
      }

      if (!settings.ui_animations) {
        styles.push(
          "* { transition: none !important; animation: none !important; }"
        );
      }

      if (settings.rave_mode) {
        styles.push(
          "canvas { animation: rotateHue 1s linear infinite !important; }"
        );
      }

      addedStyles.innerHTML = styles.join("");
    };

    document.addEventListener("juice-settings-changed", (e) => {
      const relevantSettings = [
        "perm_crosshair",
        "hide_chat",
        "hide_interface",
        "skip_loading",
        "interface_opacity",
        "interface_bounds",
        "hitmarker_link",
        "ui_animations",
        "rave_mode",
      ];

      if (relevantSettings.includes(e.detail.setting)) {
        updateUIFeatures();
      }
    });

    updateUIFeatures();
  };

  observeBodyChanges();
  loadTheme();
  applyUIFeatures();
});

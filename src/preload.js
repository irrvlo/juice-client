const fs = require("fs");
const path = require("path");
const version = require("../package.json").version;
const Store = require("electron-store");
const store = new Store();

if (!window.location.href.startsWith("https://kirka.io/")) {
  window.require = undefined;
  document.querySelector("#juice-menu").remove();
}

document.addEventListener("DOMContentLoaded", () => {
  const loadMenu = async () => {
    const menuHTML = fs.readFileSync(
      path.join(__dirname, "./menu.html"),
      "utf8"
    );

    const settings = store.get("settings");

    let menu = document.createElement("div");
    menu.innerHTML = menuHTML;
    menu.id = "juice-menu";
    menu.style.cssText =
      "z-index: 99999999;  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);";

    document.body.appendChild(menu);
    menu.querySelector(".ver").innerText = `v${version}`;

    menu.querySelector(
      ".keybind"
    ).innerText = `Press ${settings.menu_keybind} to toggle menu`;

    const localStorage = window.localStorage;
    const menuToggle = menu.querySelector(".menu");

    if (!localStorage.getItem("juice-menu")) {
      localStorage.setItem(
        "juice-menu",
        menuToggle.getAttribute("data-active")
      );
    } else {
      menuToggle.setAttribute(
        "data-active",
        localStorage.getItem("juice-menu")
      );
    }

    const handleKeyDown = (e) => {
      if (e.code === settings.menu_keybind) {
        const isActive = menuToggle.getAttribute("data-active") === "true";
        menuToggle.setAttribute("data-active", !isActive);
        localStorage.setItem("juice-menu", !isActive);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const initMenu = () => {
      const inputs = document.querySelectorAll("input[data-setting]");

      inputs.forEach((input) => {
        const setting = input.dataset.setting;
        const type = input.type;
        const value = settings[setting];

        if (type === "checkbox") {
          input.checked = value;
        } else {
          input.value = value;
        }
      });
    };

    initMenu();

    const handleMenuKeybindChange = () => {
      const changeKeybindButton = document.querySelector(".change-keybind");
      changeKeybindButton.innerText = settings.menu_keybind;

      changeKeybindButton.addEventListener("click", () => {
        changeKeybindButton.innerText = "Press any key";
        const listener = (e) => {
          settings.menu_keybind = e.code;
          store.set("settings", settings);
          changeKeybindButton.innerText = e.code;
          menu.querySelector(
            ".keybind"
          ).innerText = `Press ${settings.menu_keybind} to toggle menu`;
          document.removeEventListener("keydown", listener);
        };

        document.addEventListener("keydown", listener);
      });
    };

    handleMenuKeybindChange();

    const handleMenuInputChange = (input) => {
      const setting = input.dataset.setting;
      const type = input.type;
      const value = type === "checkbox" ? input.checked : input.value;

      settings[setting] = value;
      store.set("settings", settings);

      const event = new CustomEvent("juice-settings-changed", {
        detail: {
          setting: setting,
          value: value,
        },
      });

      document.dispatchEvent(event);
    };

    const handleMenuInputChanges = () => {
      const inputs = document.querySelectorAll("input[data-setting]");

      inputs.forEach((input) => {
        input.addEventListener("change", () => handleMenuInputChange(input));
      });
    };

    handleMenuInputChanges();

    const tabToContentMap = {
      ui: document.querySelector("#ui-options"),
      performance: document.querySelector("#performance-options"),
      client: document.querySelector("#client-options"),
    };

    const handleTabChange = (tab) => {
      const tabs = document.querySelectorAll(".juice.tab");
      const contents = document.querySelectorAll(".juice.options");

      tabs.forEach((tab) => {
        tab.classList.remove("active");
      });

      contents.forEach((content) => {
        content.classList.remove("active");
      });

      tab.classList.add("active");
      tabToContentMap[tab.dataset.tab].classList.add("active");
    };

    const handleTabChanges = () => {
      const tabs = document.querySelectorAll(".juice.tab");

      tabs.forEach((tab) => {
        tab.addEventListener("click", () => handleTabChange(tab));
      });
    };

    handleTabChanges();
    document.querySelector(".juice.tab").click();

    const handleSearch = () => {
      const searchInput = document.querySelector(".juice.search");

      const settings = document.querySelectorAll(".option:not(.custom)");

      searchInput.addEventListener("input", () => {
        const searchValue = searchInput.value.toLowerCase();

        settings.forEach((setting) => {
          setting.style.display = setting.textContent
            .toLowerCase()
            .includes(searchValue)
            ? "flex"
            : "none";
        });
      });
    };
    handleSearch();
  };

  loadMenu();

  const joinUsingURL = () => {
    const joinBtn = document.createElement("button");
    joinBtn.innerText = "Join Game";
    joinBtn.className = "joinUsingURL";
    joinBtn.addEventListener("click", async () => {
      try {
        const clipboardUrl = await navigator.clipboard.readText();
        const urlPattern = /^https:\/\/kirka\.io\/games\//i;
        if (urlPattern.test(clipboardUrl)) {
          window.location.href = clipboardUrl;
        } else {
          console.log("Clipboard does not contain a valid Kirka-related URL.");
        }
      } catch (error) {
        console.error("Unable to read from clipboard:", error);
      }
    });

    const container = document.querySelector(".play-content");
    if (container && !container.querySelector(".joinUsingURL")) {
      container.insertBefore(
        joinBtn,
        container.querySelector(".play-content-up")
      );
    } else {
      console.error(
        "Element with class 'play-content' not found or button already exists."
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
    const loadCSS = (url, id) => {
      const head = document.querySelector("head");
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.id = id;
      head.appendChild(link);
    };

    const updateCSS = (url, id) => {
      const link = document.getElementById(id);
      if (link) {
        link.href = url;
      }
    };

    loadCSS("", "juice-theme");

    const updateTheme = () => {
      const settings = store.get("settings");
      const themeLink = document.getElementById("juice-theme");

      if (
        settings.css_link !== "" &&
        settings.css_link.startsWith("http") &&
        settings.css_link.endsWith(".css")
      ) {
        updateCSS(settings.css_link, "juice-theme");
      } else {
        themeLink && themeLink.remove();
      }
    };

    document.addEventListener("juice-settings-changed", (e) => {
      if (e.detail.setting === "css_link") {
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
      const settings = store.get("settings");
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
          "canvas { animation: rotateHue 1s linear infinite alternate none running !important; }"
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

  joinUsingURL();
  observeBodyChanges();
  loadTheme();
  applyUIFeatures();
});

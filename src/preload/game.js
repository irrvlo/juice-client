const Menu = require("./menu");
const { ipcRenderer } = require("electron");

if (!window.location.href.startsWith("https://kirka.io")) {
  Object.defineProperty(navigator, "userAgent", {
    get: () =>
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  });
  window.require = undefined;
  document.querySelector("#juice-menu").remove();
}

document.addEventListener("DOMContentLoaded", async () => {
  const menu = new Menu();
  menu.init();

  const joinUsingURL = () => {
    const container = document.querySelector(".play-content");
    if (!container || document.querySelector(".joinUsingURL")) return;
    const joinBtn = document.createElement("button");
    joinBtn.innerText = "Join Game";
    joinBtn.className = "joinUsingURL text-2";
    joinBtn.onclick = async () => {
      console.log("clicked");
      const clipboardUrl = await navigator.clipboard.readText();
      const urlPattern = /^https:\/\/kirka\.io\/games\//i;
      console.log(urlPattern.test(clipboardUrl));
      console.log(clipboardUrl);
      if (urlPattern.test(clipboardUrl)) {
        console.log("urlPattern");
        console.log(clipboardUrl);
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
      if (
        e.detail.setting === "css_link" ||
        e.detail.setting === "css_enabled"
      ) {
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

  ipcRenderer.on("url-change", (e, url) => {
    if (url === "https://kirka.io/") {
      joinUsingURL();
    }
  });

  ipcRenderer.on("queue-game", () => {
    if (!document.querySelector("#play-btn")) return;
    document.querySelector("#play-btn").click();
  });

  async function start_chests_input(inputarray) {
    let customchestlist = inputarray;
    let response = await fetch(
      "https://raw.githubusercontent.com/SheriffCarry/KirkaScripts/main/ConsoleScripts/Open%20All%20Chests.js",
    );
    let text = await response.text();
    eval(text);
  }

  async function start_chests() {
    let response = await fetch(
      "https://raw.githubusercontent.com/SheriffCarry/KirkaScripts/main/ConsoleScripts/Open%20All%20Chests.js",
    );
    let text = await response.text();
    eval(text);
  }

  async function start_cards_input(inputarray) {
    let customcardlist = inputarray;
    let response = await fetch(
      "https://raw.githubusercontent.com/SheriffCarry/KirkaScripts/main/ConsoleScripts/Open%20All%20Cards.js",
    );
    let text = await response.text();
    eval(text);
  }

  async function start_cards() {
    let response = await fetch(
      "https://raw.githubusercontent.com/SheriffCarry/KirkaScripts/main/ConsoleScripts/Open%20All%20Cards.js",
    );
    let text = await response.text();
    eval(text);
  }

  document.getElementById("Opener").addEventListener("change", (e) => {
    let value = document.getElementById("Opener").value;
    if (value == "Chest_Golden") {
      let customchestlist = [
        { chestid: "077a4cf2-7b76-4624-8be6-4a7316cf5906", name: "Golden" },
      ];
      start_chests_input(customchestlist);
    } else if (value == "Chest_Ice") {
      let customchestlist = [
        { chestid: "ec230bdb-4b96-42c3-8bd0-65d204a153fc", name: "Ice" },
      ];
      start_chests_input(customchestlist);
    } else if (value == "Chest_Wood") {
      let customchestlist = [
        { chestid: "71182187-109c-40c9-94f6-22dbb60d70ee", name: "Wood" },
      ];
      start_chests_input(customchestlist);
    } else if (value == "Chest_All") {
      start_chests();
    } else if (value == "Card_Cold") {
      let customcardlist = [
        { cardid: "723c4ba7-57b3-4ae4-b65e-75686fa77bf2", name: "Cold" },
      ];
      start_cards_input(customcardlist);
    } else if (value == "Card_Girlsband") {
      let customcardlist = [
        {
          cardid: "723c4ba7-57b3-4ae4-b65e-75686fa77bf1",
          name: "Girls band",
        },
      ];
      start_cards_input(customcardlist);
    } else if (value == "Card_Party") {
      let customcardlist = [
        { cardid: "6281ed5a-663a-45e1-9772-962c95aa4605", name: "Party" },
      ];
      start_cards_input(customcardlist);
    } else if (value == "Card_Soldiers") {
      let customcardlist = [
        { cardid: "9cc5bd60-806f-4818-a7d4-1ba9b32bd96c", name: "Soldiers" },
      ];
      start_cards_input(customcardlist);
    } else if (value == "Card_Periodic") {
      let customcardlist = [
        { cardid: "a5002827-97d1-4eb4-b893-af4047e0c77f", name: "Periodic" },
      ];
      start_cards_input(customcardlist);
    } else if (value == "Card_All") {
      start_cards();
    }
  });

  joinUsingURL();
  loadTheme();
  applyUIFeatures();
});

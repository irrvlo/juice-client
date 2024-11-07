const Menu = require("./menu");
const { opener } = require("../addons/opener");
const { customReqScripts } = require("../addons/customReqScripts");
const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

const scriptsPath = ipcRenderer.sendSync("get-scripts-path");
const scripts = fs.readdirSync(scriptsPath);

const settings = ipcRenderer.sendSync("get-settings");
const base_url = settings.base_url;

scripts.forEach((script) => {
  if (!script.endsWith(".js")) return;
  const scriptPath = path.join(scriptsPath, script);
  require(scriptPath);
});

if (!window.location.href.startsWith(base_url)) {
  delete window.process;
  delete window.require;
  return;
}

document.addEventListener("DOMContentLoaded", async () => {
  const menu = new Menu();
  menu.init();

  opener();
  customReqScripts(settings);

  const fetchAll = async () => {
    const [customizations, user] = await Promise.all([
      fetch("https://juice-api.irrvlo.xyz/api/customizations").then((r) =>
        r.json()
      ),
      fetch(`https://api.kirka.io/api/user`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }).then((r) => r.json()),
    ]);

    localStorage.setItem(
      "juice-customizations",
      JSON.stringify(customizations)
    );
    localStorage.setItem(
      "current-user",
      JSON.stringify(user.statusCode === 401 ? "" : user)
    );
  };
  fetchAll();

  const formatLink = (link) => link.replace(/\\/g, "/");

  const lobbyKeybindReminder = (settings) => {
    const keybindReminder = document.createElement("span");
    keybindReminder.id = "juice-keybind-reminder";
    keybindReminder.style = `position: absolute; left: 147px; bottom: 10px; font-size: 0.9rem; color: #fff; width: max-content`;

    keybindReminder.innerText = `Press ${settings.menu_keybind} to open the client menu.`;

    if (
      !document.querySelector("#app > .interface") ||
      document.querySelector("#juice-keybind-reminder")
    )
      return;

    document.querySelector("#app #left-icons").appendChild(keybindReminder);
    document.addEventListener("juice-settings-changed", ({ detail }) => {
      if (detail.setting === "menu_keybind") {
        const keybindReminder = document.querySelector(
          "#juice-keybind-reminder"
        );
        if (keybindReminder)
          keybindReminder.innerText = `Press ${detail.value} to open the client menu.`;
      }
    });
  };

  const lobbyNews = async (settings) => {
    if (
      !document.querySelector("#app > .interface") ||
      document.querySelector(".lobby-news")
    )
      return;

    const { general_news, promotional_news, event_news, alert_news } = settings;
    if (!general_news && !promotional_news && !event_news && !alert_news)
      return;

    let news = await fetch("https://juice-api.irrvlo.xyz/api/news").then((r) =>
      r.json()
    );
    if (!news.length) return;

    news = news.filter(({ category }) => {
      const categories = {
        general: general_news,
        promotional: promotional_news,
        event: event_news,
        alert: alert_news,
      };
      return categories[category];
    });

    const lobbyNewsContainer = document.createElement("div");
    lobbyNewsContainer.id = "lobby-news";
    lobbyNewsContainer.className = "lobby-news";
    lobbyNewsContainer.style = `
      width: 226px;
      position: absolute;
      display: flex;
      top: 178px;
      left: 148px;
      pointer-events: auto;
    `;
    document
      .querySelector("#app #left-interface")
      .appendChild(lobbyNewsContainer);

    const createNewsCard = (newsItem) => {
      const div = document.createElement("div");
      div.className = "news-card";
      div.style = `
        width: 100%;
        border: 4px solid #3e4d7c;
        border-bottom: solid 4px #26335b;
        border-top: 4px solid #4d5c8b;
        background-color: #3b4975;
        display: flex;
        position: relative;
        ${newsItem.link ? "cursor: pointer;" : ""}
        ${newsItem.imgType === "banner" ? "flex-direction: column;" : ""}
      `;
      lobbyNewsContainer.appendChild(div);

      const addImage = () => {
        const img = document.createElement("img");
        img.className = `news-img ${newsItem.imgType}`;
        img.src = newsItem.img;
        img.style = `
          width: ${newsItem.imgType === "banner" ? "100%" : "4rem"};
          max-height: ${newsItem.imgType === "banner" ? "7.5rem" : "4rem"};
          object-fit: cover;
          object-position: center;
        `;
        div.appendChild(img);
      };

      const addBadge = (text, color) => {
        const badgeSpan = document.createElement("span");
        badgeSpan.className = "badge";
        badgeSpan.innerText = text;
        badgeSpan.style = `
          position: absolute;
          top: 0;
          right: 0;
          background-color: ${color};
          color: #fff;
          padding: 0.15rem 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 0 0 0 0.25rem;
        `;
        div.appendChild(badgeSpan);
      };

      const addContent = () => {
        const content = document.createElement("div");
        content.className = "news-container";
        content.style = `
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          text-align: left;
        `;

        const title = document.createElement("span");
        title.className = "news-title";
        title.innerText = newsItem.title;
        title.style = `
          font-size: 1.2rem;
          font-weight: 600;
          color: #fff;
          margin: 0;
          color: #ffb914;
        `;
        content.appendChild(title);

        const text = document.createElement("span");
        text.className = "news-content";
        text.innerText = newsItem.content;
        text.style = `
          font-size: 0.9rem;
          color: #fff;
          margin: 0;
        `;

        if (newsItem.content) content.appendChild(text);
        div.appendChild(content);
      };

      if (newsItem.img && newsItem.img !== "") addImage();
      if (
        newsItem.updatedAt &&
        newsItem.updatedAt > Date.now() - 432000000 &&
        !newsItem.live
      )
        addBadge("NEW", "#e24f4f");
      else if (newsItem.live) addBadge("LIVE", "#4dbf4d");
      addContent();

      div.onclick = () => {
        console.log("click");
        if (newsItem.link) {
          if (newsItem.link.startsWith("https://kirka.io/"))
            window.location.href = newsItem.link;
          else
            window.open(
              newsItem.link.replace("https://kirka.io/", base_url),
              "_blank"
            );
        }
      };
    };

    news.forEach((newsItem) => createNewsCard(newsItem));
  };

  const juiceDiscordButton = () => {
    const btn = document.querySelectorAll(".card-cont.soc-group")[1];
    if (!btn || document.querySelector("#juice-discord-btn")) return;

    const discordBtn = btn.cloneNode(true);
    discordBtn.className =
      "card-cont soc-group transfer-list-top-enter transfer-list-top-enter-active";
    discordBtn.id = "juice-discord-btn";
    discordBtn.style = `
    background: linear-gradient(to top, rgba(255,147,45,.75), rgba(172,250,112,.75)) !important;
    border-bottom-color: #c47022 !important;
    border-top-color: #c5ff99 !important;
    border-right-color: #e48329 !important;`;
    const textDivs = discordBtn.querySelector(".text-soc").children;
    textDivs[0].innerText = "JUICE";
    textDivs[1].innerText = "DISCORD";

    const i = document.createElement("i");
    i.className = "fab fa-discord";
    i.style.fontSize = "48px";
    i.style.fontFamily = "Font Awesome 6 Brands";
    i.style.margin = "3.2px 1.6px 0 1.6px";
    i.style.textShadow = "0 0 0 transparent";
    discordBtn.querySelector("svg").replaceWith(i);

    discordBtn.onclick = () => {
      window.open("https://discord.gg/FjzAAdSjng", "_blank");
    };

    btn.replaceWith(discordBtn);

    setInterval(() => {
      discordBtn.className = "card-cont soc-group";
    }, 300);
  };

  const loadTheme = () => {
    const addedStyles = document.createElement("style");
    addedStyles.id = "juice-styles-theme";
    document.head.appendChild(addedStyles);

    const customStyles = document.createElement("style");
    customStyles.id = "juice-styles-custom";
    document.head.appendChild(customStyles);

    const updateTheme = () => {
      const settings = ipcRenderer.sendSync("get-settings");
      const cssLink = settings.css_link;
      const advancedCSS = settings.advanced_css;

      if (cssLink && settings.css_enabled) {
        addedStyles.innerHTML = `@import url('${formatLink(cssLink)}');`;
      } else {
        addedStyles.innerHTML = "";
      }

      customStyles.innerHTML = advancedCSS;
    };

    document.addEventListener("juice-settings-changed", (e) => {
      if (
        e.detail.setting === "css_link" ||
        e.detail.setting === "css_enabled" ||
        e.detail.setting === "advanced_css"
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

      if (settings.perm_crosshair)
        styles.push(
          ".crosshair-static { opacity: 1 !important; visibility: visible !important; display: block !important; }"
        );
      if (settings.hide_chat)
        styles.push(
          ".desktop-game-interface > #bottom-left > .chat { display: none !important; }"
        );
      if (settings.hide_interface)
        styles.push(
          ".desktop-game-interface, .crosshair-cont, .ach-cont, .hitme-cont, .sniper-mwNMW-cont, .team-score, .score { display: none !important; }"
        );
      if (settings.skip_loading)
        styles.push(".loading-scene { display: none !important; }");
      if (settings.interface_opacity)
        styles.push(
          `.desktop-game-interface { opacity: ${settings.interface_opacity}% !important; }`
        );
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
      if (settings.hitmarker_link !== "")
        styles.push(
          `.hitmark { content: url(${formatLink(
            settings.hitmarker_link
          )}) !important; }`
        );
      if (settings.killicon_link !== "")
        styles.push(`.animate-cont::before { content: ""; 
      background: url(${formatLink(
        settings.killicon_link
      )}); width: 10rem; height: 10rem; margin-bottom: 2rem; display: inline-block; background-position: center; background-size: contain; background-repeat: no-repeat; }
      .animate-cont svg { display: none; }`);
      if (!settings.ui_animations)
        styles.push(
          "* { transition: none !important; animation: none !important; }"
        );
      if (settings.rave_mode)
        styles.push(
          "canvas { animation: rotateHue 1s linear infinite !important; }"
        );
      if (!settings.lobby_keybind_reminder)
        styles.push("#juice-keybind-reminder { display: none; }");

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
        "lobby_keybind_reminder",
      ];
      if (relevantSettings.includes(e.detail.setting)) updateUIFeatures();
    });
    updateUIFeatures();
  };

  const handleLobby = () => {
    const settings = ipcRenderer.sendSync("get-settings");

    lobbyKeybindReminder(settings);
    lobbyNews(settings);
    juiceDiscordButton();

    const customizations = JSON.parse(
      localStorage.getItem("juice-customizations")
    );
    const currentUser = JSON.parse(localStorage.getItem("current-user"));

    const applyCustomizations = () => {
      if (customizations?.find((c) => c.shortId === currentUser?.shortId)) {
        const customs = customizations.find(
          (c) => c.shortId === currentUser.shortId
        );
        const lobbyNickname = document.querySelector(
          ".team-section .heads .nickname"
        );

        if (customs.gradient)
          lobbyNickname.style = `
              display: flex; align-items: flex-end; gap: 0.25rem; overflow: unset !important;
              background: linear-gradient(${
                customs.gradient.rot
              }, ${customs.gradient.stops.join(", ")});
              -webkit-background-clip: text !important;
              -webkit-text-fill-color: transparent;
              text-shadow: ${
                customs.gradient.shadow || "0 0 0 transparent"
              } !important;
          `;
        else
          lobbyNickname.style =
            "display: flex; align-items: flex-end; gap: 0.25rem; overflow: unset !important;";

        if (lobbyNickname.querySelector(".juice-badges")) return;

        const badgesElem = document.createElement("div");
        badgesElem.style =
          "display: flex; gap: 0.25rem; align-items: center; width: 0;";
        badgesElem.className = "juice-badges";

        lobbyNickname.appendChild(badgesElem);

        let badgeStyle = "height: 32px; width: auto;";

        if (customs.discord) {
          const linkedBadge = document.createElement("img");
          linkedBadge.src = "https://juice.irrvlo.xyz/linked.png";
          linkedBadge.style = badgeStyle;
          badgesElem.appendChild(linkedBadge);
        }

        if (customs.booster) {
          const boosterBadge = document.createElement("img");
          boosterBadge.src = "https://juice.irrvlo.xyz/booster.png";
          boosterBadge.style = badgeStyle;
          badgesElem.appendChild(boosterBadge);
        }

        if (customs.badges && customs.badges.length) {
          customs.badges.forEach((badge) => {
            const img = document.createElement("img");
            img.src = badge;
            img.style = badgeStyle;
            badgesElem.appendChild(img);
          });
        }
      }
    };

    const removeCustomizations = () => {
      const lobbyNickname = document.querySelector(
        ".team-section .heads .nickname"
      );
      lobbyNickname.style =
        "display: flex; align-items: flex-end; gap: 0.25rem;";
      lobbyNickname.querySelector(".juice-badges")?.remove();
    };

    if (settings.customizations) applyCustomizations();

    document.addEventListener("juice-settings-changed", ({ detail }) => {
      if (detail.setting === "customizations")
        detail.value ? applyCustomizations() : removeCustomizations();
    });

    const formatMoney = (money) => {
      if (!money.dataset.formatted) {
        const formatted = parseInt(money.innerText).toLocaleString();
        money.innerHTML = money.innerHTML.replace(money.innerText, formatted);
        money.dataset.formatted = true;
      }
    };

    const formatExpValues = (expValues) => {
      if (!expValues.dataset.formatted) {
        const [current, max] = expValues.innerText.split("/");
        expValues.innerText = `${parseInt(current).toLocaleString()}/${parseInt(
          max
        ).toLocaleString()}`;
        expValues.dataset.formatted = true;
      }
    };

    const formatQuests = () => {
      const quests = document.querySelectorAll(
        ".right-interface > .quests .quest"
      );

      quests.forEach((quest) => {
        const amounts = quest.querySelectorAll(".amount");
        const progress2 = quest.querySelector(".progress2");

        if (progress2 && !progress2.dataset.formatted) {
          const [progressAmt, progressMax] = progress2.innerText.split("/");
          progress2.innerText = `${parseInt(
            progressAmt
          ).toLocaleString()}/${parseInt(progressMax).toLocaleString()}`;
          progress2.dataset.formatted = true;
        }

        amounts.forEach((amount) => {
          if (!amount.dataset.formatted) {
            const formatted = parseInt(
              amount.innerText.split(" ")[0]
            ).toLocaleString();
            amount.innerHTML = amount.innerHTML.replace(
              amount.innerText.split(" ")[0],
              formatted
            );
            amount.dataset.formatted = true;
          }
        });
      });
    };

    const interval = setInterval(() => {
      const moneys = document.querySelectorAll(".moneys > .card-cont");
      const expValues = document.querySelector(".exp-values");
      const quests = document.querySelectorAll(
        ".right-interface > .quests .quest"
      );
      const questsTabs = document.querySelector(
        ".right-interface > .quests .tabs"
      );

      if (moneys.length && expValues && quests.length && questsTabs) {
        clearInterval(interval);
        moneys.forEach(formatMoney);
        formatExpValues(expValues);
        formatQuests();

        questsTabs.addEventListener("click", formatQuests);
      }
    }, 100);
  };

  const handleServers = async () => {
    const mapImages = await fetch(
      "https://raw.githubusercontent.com/SheriffCarry/KirkaSkins/main/maps/full_mapimages.json"
    ).then((res) => res.json());

    const replaceMapImages = () => {
      const servers = document.querySelectorAll(".server");
      servers.forEach((server) => {
        let mapName = server.querySelector(".map").innerText.split("_").pop();
        if (mapImages[mapName]) {
          server.style.backgroundImage = `url(${mapImages[mapName]})`;
          server.style.backgroundSize = "cover";
          server.style.backgroundPosition = "center";
        } else server.style.backgroundImage = "none";
      });
    };
    replaceMapImages();

    let interval = setInterval(() => {
      if (!window.location.href.startsWith(`${base_url}servers/`))
        clearInterval(interval);
      replaceMapImages();
    }, 250);

    document.addEventListener("click", (e) => {
      if (e.shiftKey && e.target.classList.contains("author-name"))
        setTimeout(() => {
          navigator.clipboard.readText().then((text) => {
            window.location.href = `${base_url}profile/${text.replace(
              "#",
              ""
            )}`;
            const username = e.target.innerText.replace(":", "");
            customNotification({
              message: `Loading ${username}${text}'s profile...`,
            });
          });
        }, 250);
    });
  };

  const handleProfile = () => {
    const settings = ipcRenderer.sendSync("get-settings");

    const interval = setInterval(() => {
      if (!window.location.href.startsWith(`${base_url}profile/`))
        clearInterval(interval);

      if (document.querySelector(".profile > .content")) {
        clearInterval(interval);

        const profile = document.querySelector(
          ".content > .profile-cont > .profile"
        );
        const content = profile.querySelector(".profile > .content");
        const statistics = document.querySelectorAll(".statistic");
        const progressExp = document.querySelector(".progress-exp");

        profile.style = "width: unset; min-width: 60rem;";
        profile.querySelector(".you").style = "width: 100%;";
        content.style = "width: 36.5rem; flex-shrink: 0;";

        if (progressExp) {
          const [current, max] = progressExp.innerText.split("/");
          progressExp.innerText = `${parseInt(
            current
          ).toLocaleString()}/${parseInt(max).toLocaleString()}`;
        }

        let kills;
        let deaths;

        statistics.forEach((stat) => {
          const name = stat.querySelector(".stat-name").innerText;
          const value = stat.querySelector(".stat-value").innerText;

          if (name === "kills") kills = value;
          if (name === "deaths") deaths = value;

          if (stat.innerText.includes(".")) return;

          stat.querySelector(".stat-value").innerText = value.replace(
            value.split(" ")[0],
            parseInt(value.split(" ")[0]).toLocaleString()
          );
        });

        const kloElem = content.querySelector(".card.k-d");
        const kloStat = kloElem.querySelector(".stat-value");
        kloStat.innerText = kloStat.innerText.replace(
          kloStat.innerText,
          parseInt(kloStat.innerText).toLocaleString()
        );

        const kloClone = kloElem.cloneNode(true);
        kloClone.querySelector(".v-popover").remove();
        kloClone.querySelector(".stat-name").innerText = "K/D";
        kloClone.querySelector(".stat-value").innerText = (
          parseFloat(kills) / parseFloat(deaths)
        ).toFixed(2);
        const contentTop = content.querySelector(".top-medium > .top");

        contentTop.insertBefore(kloClone, contentTop.children[1]);

        content
          .querySelectorAll(".top-medium > .top > .card")
          .forEach((card) => {
            if (card.classList.contains("progress")) return;
            card.style.width = "unset";
          });

        const shortId = content
          .querySelector(".card-profile .copy-cont > .value")
          .innerText.replace("#", "");

        if (settings.customizations) {
          const nickname = profile.querySelector(".nickname");
          nickname.style.cssText +=
            "display: flex; align-items: flex-end; gap: 0.25rem; overflow: unset !important;";

          const textNode = nickname.firstChild;
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            const span = document.createElement("span");
            span.className = "nickname-span";
            span.textContent = textNode.textContent;
            nickname.replaceChild(span, textNode);
          }

          const badgesElem = document.createElement("div");
          badgesElem.style =
            "display: flex; gap: 0.25rem; align-items: center;";
          badgesElem.className = "juice-badges";
          nickname.appendChild(badgesElem);

          const customizations = JSON.parse(
            localStorage.getItem("juice-customizations")
          );

          if (customizations?.find((c) => c.shortId === shortId)) {
            const customs = customizations.find((c) => c.shortId === shortId);

            let badgeStyle = "height: 32px; width: auto;";

            if (customs.gradient) {
              nickname.querySelector(".nickname-span").style.cssText += `
              background: linear-gradient(${
                customs.gradient.rot
              }, ${customs.gradient.stops.join(", ")});
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              text-shadow: ${
                customs.gradient.shadow || "0 0 0 transparent"
              } !important;
            `;
            }

            if (customs.discord) {
              const linkedBadge = document.createElement("img");
              linkedBadge.src = "https://juice.irrvlo.xyz/linked.png";
              linkedBadge.style = badgeStyle;
              badgesElem.appendChild(linkedBadge);
            }

            if (customs.booster) {
              const boosterBadge = document.createElement("img");
              boosterBadge.src = "https://juice.irrvlo.xyz/booster.png";
              boosterBadge.style = badgeStyle;
              badgesElem.appendChild(boosterBadge);
            }

            if (customs.badges && customs.badges.length) {
              customs.badges.forEach((badge) => {
                const img = document.createElement("img");
                img.src = badge;
                img.style = badgeStyle;
                badgesElem.appendChild(img);
              });
            }
          }
        }

        if (shortId && shortId === "H8N3U4") {
          const profile = document.querySelector(".profile-cont > .profile");
          profile.style.position = "relative";

          const div = document.createElement("div");
          div.style = `
            position: absolute;
            bottom: 1rem;
            left: 1rem;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          `;
          div.innerHTML = `
          <img src="https://juice.irrvlo.xyz/bubbles.png" style="height: 0.8rem; width: auto;" />
          <span style="font-size: 1rem; font-weight: 600; color: #fff;">Juice Client Developer</span>
          `;
          profile.appendChild(div);
        }
      }
    }, 250);
  };

  const handleInGame = () => {
    let settings = ipcRenderer.sendSync("get-settings");

    const updateKD = () => {
      const kills = document.querySelector(".kill-death .kill");
      const deaths = document.querySelector(
        "div > svg.icon-death"
      ).parentElement;
      const kd = document.querySelector(".kill-death .kd");

      const killCount = parseFloat(kills.innerText);
      const deathCount = parseFloat(deaths.innerText) || 1;

      let kdRatio = (killCount / deathCount).toFixed(2);

      kdRatio = parseFloat(kdRatio).toString();

      kd.innerHTML = `<span class="kd-ratio">${kdRatio}</span> <span class="text-kd" style="font-size: 0.75rem;">K/D</span>`;
    };

    const createKD = () => {
      if (document.querySelector(".kill-death .kd")) return;
      const kills = document.querySelector(".kill-death .kill");
      const deaths = document.querySelector(
        "div > svg.icon-death"
      )?.parentElement;
      const kd = kills?.cloneNode(true);

      if (!kd) return;
      kd.classList.add("kd");
      kd.classList.remove("kill");
      kd.style.display = "flex";
      kd.style.alignItems = "center";
      kd.style.gap = "0.25rem";
      kd.innerHTML = `<span class="kd-ratio">0</span> <span class="text-kd" style="font-size: 0.75rem;">K/D</span>`;

      document.querySelector(".kill-death").appendChild(kd);
      kills.addEventListener("DOMSubtreeModified", updateKD);
      deaths.addEventListener("DOMSubtreeModified", updateKD);
    };

    document.addEventListener("juice-settings-changed", ({ detail }) => {
      if (detail.setting === "kd_indicator")
        settings.kd_indicator = detail.value;
      else if (detail.setting === "customizations")
        settings.customizations = detail.value;
    });

    const customizations = JSON.parse(
      localStorage.getItem("juice-customizations")
    );

    const interval = setInterval(() => {
      if (!window.location.href.startsWith(`${base_url}games/`))
        clearInterval(interval);

      const tabplayers = document.querySelectorAll(
        ".desktop-game-interface .player-cont"
      );

      if (settings.customizations) {
        tabplayers.forEach((player) => {
          const playerLeft = player.querySelector(".player-left");
          const nickname = player.querySelector(".nickname");
          const shortId = player
            .querySelector(".short-id")
            ?.innerText.replace("#", "");

          if (!shortId) {
            player.querySelector(".juice-badges")?.remove();
            nickname.style = "";
            playerLeft.style = "";
            return;
          }

          const customs = customizations?.find((c) => c.shortId === shortId);

          if (customs) {
            let badgesElem = player.querySelector(".juice-badges");

            if (!badgesElem || badgesElem.dataset.shortId !== shortId) {
              if (badgesElem) {
                badgesElem.remove();
              }
              badgesElem = document.createElement("div");
              badgesElem.style =
                "display: flex; gap: 0.25rem; align-items: center; margin-left: 0.25rem;";
              badgesElem.className = "juice-badges";
              badgesElem.dataset.shortId = shortId;

              nickname.style = "overflow: unset;";
              playerLeft.style = "width: 0;";
              playerLeft.insertBefore(badgesElem, playerLeft.lastChild);
            } else if (badgesElem.dataset.shortId === shortId) {
              return;
            }

            const badgeStyle = "height: 22px; width: auto;";

            if (customs.gradient) {
              nickname.style = `
              overflow: unset;
              background: linear-gradient(${
                customs.gradient.rot
              }, ${customs.gradient.stops.join(", ")}) !important;
              -webkit-background-clip: text !important;
              -webkit-text-fill-color: transparent !important;
              text-shadow: ${
                customs.gradient.shadow || "0 0 0 transparent"
              } !important;
              font-weight: 700 !important;
            `;
            } else {
              nickname.style = "overflow: unset;";
            }

            if (customs.discord) {
              const linkedBadge = document.createElement("img");
              linkedBadge.src = "https://juice.irrvlo.xyz/linked.png";
              linkedBadge.style.cssText = badgeStyle;
              badgesElem.appendChild(linkedBadge);
            }

            if (customs.booster) {
              const boosterBadge = document.createElement("img");
              boosterBadge.src = "https://juice.irrvlo.xyz/booster.png";
              boosterBadge.style.cssText = badgeStyle;
              badgesElem.appendChild(boosterBadge);
            }

            if (customs.badges && customs.badges.length) {
              customs.badges.forEach((badge) => {
                const img = document.createElement("img");
                img.src = badge;
                img.style.cssText = badgeStyle;
                badgesElem.appendChild(img);
              });
            }
          } else {
            playerLeft.querySelector(".juice-badges")?.remove();
            nickname.style = "";
            playerLeft.style = "";
          }
        });
      } else {
        tabplayers.forEach((player) => {
          player.querySelector(".juice-badges")?.remove();
          player.querySelector(".nickname").style = "";
          player.querySelector(".player-left").style = "";
        });
      }

      if (!document.querySelector(".kill-death .kd") && settings.kd_indicator) {
        createKD();
      } else if (
        document.querySelector(".kill-death .kd") &&
        !settings.kd_indicator
      ) {
        document.querySelector(".kill-death .kd").remove();
      }
    }, 1000);
  };

  const handleMarket = () => {
    const interval = setInterval(() => {
      if (!window.location.href === `${base_url}hub/market`) {
        clearInterval(interval);
        return;
      }

      const subjects = document.querySelectorAll(".subject");

      subjects.forEach((subject) => {
        const count = subject.querySelector(".count");
        if (count && !count.dataset.formatted) {
          count.innerHTML = count.innerHTML.replace(
            count.innerText,
            parseInt(count.innerText).toLocaleString()
          );
          count.dataset.formatted = true;
        }
      });
    }, 250);
  };

  const handleFriends = () => {
    const settings = ipcRenderer.sendSync("get-settings");

    document.addEventListener("click", (e) => {
      if (e.shiftKey && e.target.classList.contains("online")) {
        const online = e.target;
        if (online && online.innerText.includes("in game")) {
          const content = online.innerText.match(/\[(.*?)\]/)[1];
          const gameLink = `${base_url}games/${content}`;
          navigator.clipboard.writeText(gameLink);
          customNotification({
            message: `Copied game link to clipboard: ${gameLink}`,
          });
        }
      }
    });

    const interval = setInterval(() => {
      if (!window.location.href.startsWith(`${base_url}friends`))
        clearInterval(interval);

      const friendsCont = document.querySelector(".friends > .content > .allo");
      const limit = document.querySelector(
        ".friends > .content > .tabs > .limit"
      );
      const addFriends = document.querySelector(".friends > .add-friends");

      if (!friendsCont || !limit || !addFriends) return;

      const friendsList = friendsCont.querySelector(".list");
      const requestsList = friendsCont.querySelector(".requests");

      function createSearch() {
        const searchFriends = document.createElement("div");
        searchFriends.className = "search-friends";
        searchFriends.style = `display: flex; flex-direction: column; align-items: flex-start; margin-top: 1.5rem; padding: 0 1rem;`;
        searchFriends.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: .5rem; width: 100%;">
            <span class="search-text">Search</span>
            <span>Press Enter to search</span>
          </div>
          <input type="text" placeholder="ENTER USERNAME OR ID" class="search-input" style="border: .125rem solid #202639; outline: none; background: #2f3957; width: 100%; height: 2.875rem; padding-left: .5rem; box-sizing: border-box; font-weight: 600; font-size: 1rem; color: #f2f2f2; box-shadow: 0 1px 2px rgba(0,0,0,.4), inset 0 0 8px rgba(0,0,0,.4); border-radius: .25rem;"/>`;
        addFriends.appendChild(searchFriends);

        searchFriends
          .querySelector(".search-input")
          .addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll(".friend").forEach((friend) => {
              const nickname =
                friend.querySelector(".nickname")?.innerText.toLowerCase() ||
                "";
              const shortId =
                friend.querySelector(".friend-id")?.innerText.toLowerCase() ||
                "";
              friend.style.display =
                nickname.includes(query) || shortId.includes(query)
                  ? "flex"
                  : "none";
            });
          });
      }

      function createDenyButton() {
        const denyRequests = document.createElement("div");
        denyRequests.className = "deny-requests";
        denyRequests.style = `display: flex; flex-direction: column; align-items: flex-start; margin-top: 1.5rem; padding: 0 1rem;`;
        denyRequests.innerHTML = `
          <span style="margin-bottom: .5rem; font-size: 1rem; font-weight: 600; color: #f2f2f2;">Deny Requests</span>
          <div style="display: flex; gap: 0.25rem; width: 100%;">
            <button class="deny-button text-2" style="cursor: pointer; padding: 1rem 0; color: white; width: 100%; height: 2.875rem; display: flex; justify-content: center; align-items: center; font-family: Rowdies; font-size: 0.9rem; background: #e73131; border-top: 4px solid #e24f4f; border-bottom: 4px solid #cb1414; border-left: 0px; border-right: 0px;">DENY ALL REQUESTS</button>
            <button class="deny-reset text-2" style="cursor: pointer; padding: 1rem 0; color: white; width: 100%; height: 2.875rem; display: none; justify-content: center; align-items: center; font-family: Rowdies; font-size: 0.9rem; background: #ffb914; border-top: 4px solid #fcd373; border-bottom: 4px solid #b6830e; border-left: 0px; border-right: 0px;">BACK</button>
          </div>`;
        addFriends.appendChild(denyRequests);
      
        const denyButton = denyRequests.querySelector(".deny-button");
        const denyReset = denyRequests.querySelector(".deny-reset");
        let updating = false;
        let confirm = true;

        denyReset.addEventListener("click", () => {
          denyButton.innerText = "DENY ALL REQUESTS";
          denyReset.style.display = "none";
          confirm = true;
        });
      
        denyButton.addEventListener("click", () => {
          if (updating || !document.querySelector(".allo > .requests")) return;
      
          if (confirm) {
            denyButton.innerText = "ARE YOU SURE?";
            denyReset.style.display = "flex";
            confirm = false;
            return;
          }
      
          updating = true;
          denyButton.innerText = "DENYING...";
          denyReset.style.display = "none";
      
          const requests = document.querySelectorAll(".allo > .requests .friend");
          requests.forEach((request, i) => {
            const deleteButton = request.querySelector(".delete");
            setTimeout(() => {
              if (document.querySelector(".allo > .requests")) {
                deleteButton.click();
              } else {
                updating = false;
                confirm = true;
                denyButton.innerText = "DENY ALL REQUESTS";
                return;
              }
              if (i === requests.length - 1) {
                updating = false;
                confirm = true;
                denyButton.innerText = "DENY ALL REQUESTS";
              }
            }, i * 200);
          });
        });
      }
      

      if (!addFriends.querySelector(".search-friends")) createSearch();
      if (!addFriends.querySelector(".deny-requests")) createDenyButton();

      if (friendsList) {
        limit.innerText = `${friendsList.children.length}/50`;
        addFriends.querySelector(".deny-requests").style.display = "none";
      } else if (requestsList) {
        limit.innerText = `${requestsList.children.length} Requests`;
        addFriends.querySelector(".deny-requests").style.display = "flex";
      } else {
        limit.innerText = "-";
        addFriends.querySelector(".deny-requests").style.display = "none";
      }

      const customizations = JSON.parse(
        localStorage.getItem("juice-customizations")
      );

      if (settings.customizations) {
        const friends = document.querySelectorAll(".friend");
        friends.forEach((friend) => {
          const shortId = friend.querySelector(".friend-id").innerText;
          const customs = customizations?.find((c) => c.shortId === shortId);

          if (customs) {
            const nickname = friend.querySelector(".nickname");
            nickname.style = `
            display: flex !important;
            align-items: flex-end !important;
            gap: 0.25rem !important;
            overflow: unset !important;
            `;

            if (customs.gradient)
              nickname.style = `
              display: flex !important;
              align-items: flex-end !important;
              gap: 0.25rem !important;
              max-width: min-width !important;
              flex-direction: row !important;
              background: linear-gradient(${
                customs.gradient.rot
              }, ${customs.gradient.stops.join(", ")}) !important;
              -webkit-background-clip: text !important;
              -webkit-text-fill-color: transparent !important;
              text-shadow: ${
                customs.gradient.shadow || "0 0 0 transparent"
              } !important;
              font-weight: 700 !important;
            `;

            let badgesElem = nickname.querySelector(".juice-badges");

            if (!badgesElem || badgesElem.dataset.shortId !== shortId) {
              if (badgesElem) badgesElem.remove();

              badgesElem = document.createElement("div");
              badgesElem.style =
                "display: flex; gap: 0.25rem; align-items: center; width: 0;";
              badgesElem.className = "juice-badges";
              badgesElem.dataset.shortId = shortId;
              nickname.appendChild(badgesElem);
            } else if (badgesElem.dataset.shortId === shortId) return;

            const badgeStyle = "height: 18px; width: auto;";

            if (customs.discord) {
              const linkedBadge = document.createElement("img");
              linkedBadge.src = "https://juice.irrvlo.xyz/linked.png";
              linkedBadge.style.cssText = badgeStyle;
              badgesElem.appendChild(linkedBadge);
            }

            if (customs.booster) {
              const boosterBadge = document.createElement("img");
              boosterBadge.src = "https://juice.irrvlo.xyz/booster.png";
              boosterBadge.style.cssText = badgeStyle;
              badgesElem.appendChild(boosterBadge);
            }

            if (customs.badges && customs.badges.length)
              customs.badges.forEach((badge) => {
                const img = document.createElement("img");
                img.src = badge;
                img.style.cssText = badgeStyle;
                badgesElem.appendChild(img);
              });
          }
        });
      }
    }, 250);
  };

  const customNotification = (data) => {
    const notifElement = document.createElement("div");
    notifElement.classList.add("vue-notification-wrapper");
    notifElement.style =
      "transition-timing-function: ease; transition-delay: 0s; transition-property: all;";
    notifElement.innerHTML = `
    <div
      style="
        display: flex;
        align-items: center;
        padding: .9rem 1.1rem;
        margin-bottom: .5rem;
        color: var(--white);
        cursor: pointer;
        box-shadow: 0 0 0.7rem rgba(0,0,0,.25);
        border-radius: .2rem;
        background: linear-gradient(262.54deg,#202639 9.46%,#223163 100.16%);
        margin-left: 1rem;
        border: solid .15rem #ffb914;
        font-family: Exo\ 2;" class="alert-default"
    > ${
      data.icon
        ? `
        <img
          src="${data.icon}"
          style="
            min-width: 2rem;
            height: 2rem;
            margin-right: .9rem;"
        />`
        : ""
    }
      <span style="font-size: 1rem; font-weight: 600; text-align: left;" class="text">${
        data.message
      }</span>
    </div>`;

    document
      .getElementsByClassName("vue-notification-group")[0]
      .children[0].appendChild(notifElement);

    setTimeout(() => {
      try {
        notifElement.remove();
      } catch {}
    }, 5000);
  };

  ipcRenderer.on("notification", (_, data) => customNotification(data));

  ipcRenderer.on("url-change", (_, url) => {
    if (url === `${base_url}`) handleLobby();
    if (url.startsWith(`${base_url}servers/`)) handleServers();
    if (url.startsWith(`${base_url}profile/`)) handleProfile();
    if (url.startsWith(`${base_url}games/`)) handleInGame();
    if (url === `${base_url}hub/market`) handleMarket();
    if (url === `${base_url}friends`) handleFriends();
  });

  const handleInitialLoad = () => {
    const url = window.location.href;
    if (url.startsWith(`${base_url}`) && !url.includes("games")) handleLobby();
    if (url.startsWith(`${base_url}servers/`)) handleServers();
    if (url.startsWith(`${base_url}profile/`)) handleProfile();
    if (url.startsWith(`${base_url}games/`)) handleInGame();
    if (url === `${base_url}hub/market`) handleMarket();
    if (url === `${base_url}friends`) handleFriends();

    loadTheme();
    applyUIFeatures();
  };

  handleInitialLoad();
});

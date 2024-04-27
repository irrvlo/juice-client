document.addEventListener("DOMContentLoaded", () => {
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
        console.log("Error reading from clipboard.");
      }
    });

    const container = document.querySelector(".play-content");
    if (container) {
      if (container.querySelector(".joinUsingURL")) return;
      container.insertBefore(
        joinBtn,
        container.querySelector(".play-content-up")
      );
    } else {
      console.error("Element with class 'play-content' not found.");
    }
  };

  new MutationObserver(() => {
    joinUsingURL();
  }).observe(document.body, {
    childList: true,
    subtree: true,
  });
});

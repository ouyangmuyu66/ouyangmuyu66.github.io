function checkPassword() {
  const input = document.getElementById("passwordInput").value;
  const correctPassword = "1";
  const btn = document.querySelector('#lockScreen button');
  const lockScreen = document.getElementById("lockScreen");
  const loader = document.getElementById("loadingScreen");
  const content = document.getElementById("content");
  const pressedDelay = 500; // ms
  const minLoader = 2000;   // ms

  if (input !== correctPassword) {
    const errorText = document.getElementById("errorText");
    errorText.innerText = "密码输入错误";
    lockScreen.classList.add("error");
    btn.classList.remove("pressed");

    clearTimeout(window._errorTimer);
    window._errorTimer = setTimeout(() => {
      lockScreen.classList.remove("error");
      errorText.innerText = "";
    }, 500);

    return;
  }

  btn.classList.add('pressed');

  requestAnimationFrame(() => {
    setTimeout(() => {
      lockScreen.style.display = "none";
      loader.style.display = "flex";
      const loaderStart = Date.now();

      document.fonts.ready.then(() => {
        const elapsed = Date.now() - loaderStart;
        const remaining = Math.max(minLoader - elapsed, 0);

        setTimeout(() => {
          loader.style.display = "none";
          content.style.display = "block";
          loader.style.display = "none";
          content.style.display = "block";
          // ✅ iPad/Safari fix: content was display:none, so IO may not trigger.
          // Re-attach observers AFTER layout settles.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // force layout + IO recalculation
              window.dispatchEvent(new Event("scroll"));
              window.dispatchEvent(new Event("resize"));

              // re-observe typing groups so Chart 1 header typing triggers on iPad
              if (window.reobserveTypingGroups) window.reobserveTypingGroups();

              // keep your chart renders (optional but helps layout)
              if (window.renderMsgChart) window.renderMsgChart();
              if (window.renderBarChart2) window.renderBarChart2();
            });
          });

          

          // ✅ Start BGM after unlock
          if (window.startBgmAfterUnlock) window.startBgmAfterUnlock();

          // ✅ Your existing init
          if (window.initAvatarFocus) window.initAvatarFocus();

          // ✅ Render chart safely (only if element exists)
          const tryRenderChart = () => {
            const dom = document.getElementById("msgChart");
            if (!dom) {
              console.warn("msgChart not found");
              return;
            }
            // helpful debug
            // console.log("msgChart size:", dom.getBoundingClientRect());

            if (window.renderMsgChart) window.renderMsgChart(); //section3 chart

            if (window.renderBarChart2) window.renderBarChart2(); //section4 bar
            window.dispatchEvent(new Event("resize"));
          };

          // 1) immediately
          tryRenderChart();
          // 2) next frame (after layout)
          requestAnimationFrame(tryRenderChart);
          // 3) a bit later (after animations / typing layout changes)
          setTimeout(tryRenderChart, 300);

          btn.classList.remove('pressed');
        }, remaining);
      });

    }, pressedDelay);
  });
}


(() => {
  function pathJoin(...parts) {
    return parts.join("/");
  }

  function loadJson(url, callback) {
    const xhr = new XMLHttpRequest();

    xhr.addEventListener("load", function () {
      try {
        const json = JSON.parse(this.responseText);
        callback?.(json);
      } catch (err) {
        console.error("JSON parse failed:", url, err);
      }
    });

    xhr.addEventListener("error", () => {
      console.error("Failed to load JSON:", url);
    });

    xhr.open("GET", `${url}?v=1gefx1jwdk0gj12hb`);
    xhr.send();
  }

  function loadScript(src, callback) {
    const script = document.createElement("script");

    script.src = `${src}?v=1gefx1jwdk0gj12hb`;
    script.onload = callback || null;

    script.onerror = () => {
      console.error("Failed to load script:", src);
    };

    document.head.appendChild(script);
  }

  function loadFont(href, fontName) {
    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = `${href}?v=1gefx1jwdk0gj12hb`;
    link.media = "all";

    link.onerror = () => {
      console.error("Failed to load font:", href);
    };

    document.head.appendChild(link);

    const cache = document.createElement("div");

    cache.className = "fontcache";
    cache.style.fontFamily = `"${fontName}"`;
    cache.textContent = ".";

    document.body.appendChild(cache);
  }

  function initApp(bundle) {
    const meta = bundle.meta;

    const splashPath = pathJoin(meta.path, meta.splash);

    const holder = document.querySelector("#og-game-holder");

    holder.style.backgroundColor = meta.color;
    holder.style.backgroundImage =
      `url("${splashPath}?v=1gefx1jwdk0gj12hb")`;

    // Fonts
    loadFont("../assets/font/lilita-one.css", "Lilita One");
    loadFont("../assets/font/titan-one.css", "Titan One");

    // Optional scripts
    if (window.sharedAppData.config.leaderboards) {
      loadScript("leaderboard.js");
    }

    if (window.sharedAppData.config.vconsole) {
      loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/vConsole/3.3.0/vconsole.min.js"
      );
    }

    // Core scripts
    loadScript("inflate.min.js");
    loadScript("vendor.js");
    loadScript("main.js");
  }

  // Silence logs
  console.log = () => null;
  console.warn = () => null;

  // Default config
  window.GAME_CONFIG ||= {
    fastplay: false
  };

  // Load game config
  loadJson("new-york/assets/data/config.json", (config) => {
    const queryParams = (() => {
      const params = {};
      const raw = location.search
        .replace("?", "")
        .split("&");

      for (const item of raw) {
        const [key, value] = item.split("=");

        if (value === undefined) continue;

        let parsed = value;

        if (value === "true" || value === "false") {
          parsed = value === "true";
        } else if (/^[-.0-9]+$/.test(value)) {
          parsed = parseFloat(value);
        }

        params[key] = parsed;
      }

      return params;
    })();

    // Merge configs
    config.pokiSdkDebug = false;

    Object.assign(config, window.GAME_CONFIG);
    Object.assign(config, queryParams);

    // Shared app state
    window.sharedAppData = {
      config,

      bundle: {
        meta: {
          path: "./",
          color: "#ffa4cd",
          splash: "../assets/preload/splash_mip.png"
        }
      }
    };

    function startGame(adBlocked) {
      if (config.adBlocking === undefined) {
        config.adBlocking = adBlocked;
      }

      if (config.bundlepath && config.env !== config.env_builtin) {
        const bundleDir = pathJoin(
          config.bundlepath,
          config.env
        );

        loadJson(
          pathJoin(bundleDir, "manifest.json"),
          (manifest) => {
            manifest.meta.path = bundleDir;

            window.sharedAppData.bundle = manifest;

            initApp(window.sharedAppData.bundle);
          }
        );
      } else {
        initApp(window.sharedAppData.bundle);
      }
    }

    const sdk = window.Tabouzigtsdk;

    if (sdk) {
      sdk.init()
        .then(() => {
          sdk.gameLoadingStart();
          startGame(false);
        })
        .catch(() => {
          sdk.gameLoadingStart();
          startGame(true);
        });

      sdk.setDebug(config.pokiSdkDebug);
    } else {
      startGame(true);
    }
  });
})();

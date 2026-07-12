(function () {
  const concepts = [
    { id: "live-ledger", file: "01-live-ledger.html", short: "ledger", label: "Live ledger" },
    { id: "workstreams", file: "02-workstreams.html", short: "streams", label: "Workstreams" },
    { id: "day-score", file: "03-day-score.html", short: "score", label: "Day score" },
    { id: "herdr-map", file: "04-herdr-map.html", short: "map", label: "Herdr map" },
  ];

  const icons = {
    github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.35 1.09 2.92.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.55 9.55 0 0 1 12 6.83c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.7" d="M3.5 5.5h17v13h-17zM4 6l8 7 8-7"/></svg>',
    theme: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.7" d="M12 3a9 9 0 1 0 0 18V3Zm0 0a9 9 0 0 1 0 18"/></svg>',
  };

  function shellMarkup(meta) {
    const conceptLinks = concepts
      .map((item, index) => {
        const current = item.id === meta.id ? ' aria-current="page"' : "";
        return `<a href="${item.file}"${current} title="${item.label}">${index + 1}</a>`;
      })
      .join("");

    return `
      <a class="skip-link" href="#concept-root">Skip to live activity</a>
      <header class="surface-strip">
        <nav class="surface-tabs" aria-label="Site surfaces">
          <a href="#" class="surface-active">1:portfolio</a>
          <a href="#">2:thought-sandboxes</a>
        </nav>
        <div class="prototype-switch" aria-label="Now panel concepts">
          <span class="prototype-label">now mock</span>
          ${conceptLinks}
          <button class="icon-button" type="button" data-theme-toggle aria-label="Switch color theme" title="Switch color theme">${icons.theme}</button>
        </div>
      </header>

      <aside class="sidebar" aria-label="Portfolio workspaces">
        <div class="side-head">
          <a class="wordmark" href="#"><span>~</span>/ibraheem</a>
          <button class="icon-button side-theme" type="button" data-theme-toggle aria-label="Switch color theme" title="Switch color theme">${icons.theme}</button>
        </div>
        <div class="side-group">
          <p class="overline">workspaces</p>
          <nav class="workspace-list">
            <a class="workspace-link home" href="#" aria-current="page"><span class="grip">::</span><span>home</span><kbd>1</kbd></a>
            <a class="workspace-link work" href="#"><span class="grip">::</span><span>work</span><kbd>2</kbd></a>
            <a class="workspace-link projects" href="#"><span class="grip">::</span><span>projects</span><kbd>3</kbd></a>
            <a class="workspace-link certs" href="#"><span class="grip">::</span><span>certifications</span><kbd>4</kbd></a>
            <a class="workspace-link coursework" href="#"><span class="grip">::</span><span>coursework</span><kbd>5</kbd></a>
          </nav>
        </div>
        <div class="side-group pinned">
          <p class="overline">pinned</p>
          <a href="https://github.com/DIodide" class="pin-row"><span class="pin-icon">${icons.github}</span><span>github</span></a>
          <a href="mailto:ibraheem@example.com" class="pin-row"><span class="pin-icon">${icons.mail}</span><span>email</span></a>
        </div>
        <p class="side-foot">home workspace<br><span>live prototype</span></p>
      </aside>

      <main class="main" id="main-content">
        <div class="machine home-machine">
          <section class="pane identity-pane" aria-labelledby="identity-label">
            <span class="pane-notch" id="identity-label"><span class="light-label">at a glance</span><span class="dark-label">neofetch</span></span>
            <pre class="glyph" aria-hidden="true">IA
IA
IA</pre>
            <dl class="identity-grid">
              <dt>user</dt><dd>ibraheem amin <span>(he/him)</span></dd>
              <dt>host</dt><dd>princeton university</dd>
              <dt>os</dt><dd>computer science '28</dd>
              <dt>location</dt><dd>new jersey, usa</dd>
              <dt>uptime</dt><dd>shipping since 2019</dd>
              <dt>pkgs</dt><dd>9 projects / 14 certs / 4 roles</dd>
            </dl>
          </section>

          <section class="pane bio-pane" aria-labelledby="bio-label">
            <span class="pane-notch" id="bio-label"><span class="light-label">bio</span><span class="dark-label">cat bio.md</span></span>
            <h1>ibraheem amin<span class="cursor" aria-hidden="true"></span></h1>
            <p class="bio-meta">computer science / princeton '28 / new jersey</p>
            <p>I build software where infrastructure, product design, and applied machine learning meet.</p>
            <p>Currently exploring agent systems, observability, and interfaces that make complex technical work legible.</p>
          </section>

          <section class="pane resume-pane" aria-labelledby="resume-label">
            <span class="pane-notch" id="resume-label"><span class="light-label">resume</span><span class="dark-label">open resume.pdf</span></span>
            <p class="resume-kicker">selected record</p>
            <p class="resume-title">Experience, research, and shipped work.</p>
            <a class="text-command" href="#">open resume.pdf <span aria-hidden="true">-&gt;</span></a>
          </section>

          <section class="pane now-pane" aria-labelledby="now-pane-label">
            <span class="pane-notch" id="now-pane-label"><span class="light-label">now / ${meta.short}</span><span class="dark-label">watch agents --${meta.short}</span></span>
            <button class="pane-zoom" type="button" aria-label="Expand now pane" aria-pressed="false" title="Expand now pane">[ ]</button>
            <div class="now-toolbar">
              <div>
                <strong>${meta.title}</strong>
                <span>${meta.subtitle}</span>
              </div>
              <p><span class="presence-dot"></span>3 active <span>/</span> updated 8s ago</p>
            </div>
            <div id="concept-root" class="concept-root" aria-live="polite"></div>
          </section>
        </div>
      </main>

      <footer class="status-bar">
        <div class="status-left"><span class="status-session">portfolio</span><strong>1:home</strong><span>lightweight mux</span></div>
        <div class="status-right"><span>${meta.label}</span><time>15:24</time></div>
      </footer>
    `;
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("now-mock-theme", theme);
  }

  function initTheme() {
    const saved = localStorage.getItem("now-mock-theme");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    applyTheme(saved || preferred);
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
      });
    });
    window.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "t" && !/input|textarea|select/i.test(document.activeElement.tagName)) {
        applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
      }
    });
  }

  function initShellControls() {
    document.querySelectorAll('a[href="#"]').forEach((link) => {
      link.addEventListener("click", (event) => event.preventDefault());
    });

    const zoomButton = document.querySelector(".pane-zoom");
    const nowPane = document.querySelector(".now-pane");
    const setZoom = (expanded) => {
      nowPane.classList.toggle("is-zoomed", expanded);
      zoomButton.setAttribute("aria-pressed", String(expanded));
      zoomButton.setAttribute("aria-label", expanded ? "Restore now pane" : "Expand now pane");
      zoomButton.setAttribute("title", expanded ? "Restore now pane" : "Expand now pane");
      zoomButton.textContent = expanded ? "x" : "[ ]";
    };
    zoomButton.addEventListener("click", () => setZoom(!nowPane.classList.contains("is-zoomed")));
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nowPane.classList.contains("is-zoomed")) setZoom(false);
    });
  }

  window.mountNowMock = function mountNowMock(meta, render) {
    document.body.innerHTML = shellMarkup(meta);
    document.title = `${meta.label} / now panel mock`;
    initTheme();
    initShellControls();
    const root = document.getElementById("concept-root");
    const mockState = new URLSearchParams(window.location.search).get("state");
    if (mockState === "loading") {
      root.innerHTML = `
        <div class="mock-state mock-loading" role="status" aria-label="Loading current agent activity">
          <span></span><span></span><span></span><span></span>
        </div>`;
      return;
    }
    if (mockState === "empty") {
      root.innerHTML = `
        <div class="mock-state" role="status">
          <strong>the desk is quiet</strong>
          <span>no current agents / no runs recorded in the last 24 hours</span>
        </div>`;
      return;
    }
    if (mockState === "error") {
      root.innerHTML = `
        <div class="mock-state mock-error" role="alert">
          <strong>telemetry stream delayed</strong>
          <span>last reconciled snapshot: 12 minutes ago</span>
          <button type="button">retry</button>
        </div>`;
      root.querySelector("button").addEventListener("click", () => {
        root.replaceChildren();
        render(root, window.NOW_MOCK);
      });
      return;
    }
    render(root, window.NOW_MOCK);
  };
})();

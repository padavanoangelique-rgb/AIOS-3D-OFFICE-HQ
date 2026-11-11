/* AIOS 3D office: switch between the 3D office and the 2D dashboard.
   Loads after app.js and leaves it alone. The office talks to the dashboard only through the
   dashboard's own buttons (data-act), so chat, to-dos and decisions keep working exactly as before. */
(() => {
  "use strict";
  const PREF = "aios2-3d";
  const $ = s => document.querySelector(s);
  const app = $("#app"), nav = $("#nav");
  if (!app || !nav) return;
  let on = false, office = null, loading = null;

  const ICON = {
    office: '<path d="M3 20V9l9-5 9 5v11M3 20h18M9 20v-6h6v6"/>',
    left: '<path d="M4 5v5h5M4.6 10A8 8 0 1 1 6 17.3"/>',
    right: '<path d="M20 5v5h-5M19.4 10A8 8 0 1 0 18 17.3"/>',
    home: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  };
  const svg = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;

  const root = document.createElement("section");
  root.id = "office3d";
  root.hidden = true;
  root.innerHTML = `<div class="o3-host"></div><div class="o3-ov"></div>
    <div class="o3-bar"><button class="o3-btn" data-o3="2d">2D view</button><span class="o3-sp"></span>
      <button class="o3-btn ic" data-o3="left" aria-label="Turn left">${svg("left")}</button>
      <button class="o3-btn ic" data-o3="home" aria-label="Reset view">${svg("home")}</button>
      <button class="o3-btn ic" data-o3="right" aria-label="Turn right">${svg("right")}</button></div>
    <div class="o3-hint">Drag to move · pinch to zoom · twist to turn</div>
    <div class="o3-load">Opening the office…</div>`;
  app.appendChild(root);

  /* Press one of the dashboard's own buttons on the office's behalf. */
  function act(name, id, state) {
    const b = document.createElement("button");
    b.hidden = true; b.dataset.act = name;
    if (id != null) b.dataset.id = id;
    if (state != null) b.dataset.state = state;
    document.body.appendChild(b); b.click(); b.remove();
  }
  function say(m) { const t = $("#toast"); if (!t) return; t.textContent = m; t.hidden = false; setTimeout(() => { t.hidden = true; }, 3200); }
  function store(v) { try { localStorage.setItem(PREF, v); } catch (e) { /* private mode */ } }
  function pref() { try { return localStorage.getItem(PREF); } catch (e) { return null; } }

  /* The dashboard redraws its nav often, so put the Office button back whenever it does. */
  function paintNav() {
    let b = nav.querySelector("[data-o3=on]");
    if (!b) {
      b = document.createElement("button");
      b.dataset.o3 = "on";
      b.innerHTML = `${svg("office")}<span>Office</span>`;
      nav.insertBefore(b, nav.querySelector("button"));
    }
    b.classList.toggle("on", on);
  }
  new MutationObserver(paintNav).observe(nav, { childList: true });
  paintNav();

  function enter(save) {
    if (save) store("1");
    if (on) return;
    on = true;
    document.body.classList.add("o3d"); root.hidden = false; paintNav();
    if (office) return office.start();
    loading = loading || import("./main.js").then(m => m.mount(root, { act })).then(o => {
      office = o; root.classList.add("ready");
      if (on) office.start();
    }).catch(err => {
      console.warn("3D office unavailable:", err);
      loading = null; exit(false);
      say("The 3D office could not load here. Showing the 2D view.");
    });
  }
  function exit(save) {
    if (save) store("0");
    if (!on) return;
    on = false;
    document.body.classList.remove("o3d"); root.hidden = true; paintNav();
    if (office) office.stop();
  }

  document.addEventListener("click", e => {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    const o = t.closest("[data-o3]");
    if (o) {
      const k = o.dataset.o3;
      if (k === "on") enter(true);
      else if (k === "2d") { exit(true); act("view", "city"); }
      else if (office) office.command(k, o);
      return;
    }
    /* Opening a chat or another dashboard page leaves the office (your 3D/2D choice is kept). */
    if (on && t.closest("[data-act=view],[data-act=chat],[data-act=div]")) exit(false);
  }, true);

  /* Start in the office unless you chose 2D, or the link points at a specific page. */
  if (pref() !== "0" && !location.hash.slice(1)) enter(false);
})();

/* AIOS 3D office: read-only data tap.
   Listens to three Supabase reads the dashboard already makes (roster, open decisions, XP) so the
   office shows exactly the same data with no extra requests and no keys.
   It never changes a request or a response: the original promise is returned untouched. */
(() => {
  "use strict";
  const real = window.fetch;
  if (!real) return;
  const tap = window.AIOS_TAP = { bots: null, dec: null, prog: null };
  const KEY = { aios_bots: "bots", aios_decisions: "dec", aios_progress: "prog" };
  window.fetch = function (input, init) {
    const p = real.apply(this, arguments);
    try {
      const url = typeof input === "string" ? input : (input && input.url) || "";
      const m = /\/rest\/v1\/(aios_bots|aios_decisions|aios_progress)\?/.exec(url);
      if (m && (!init || !init.method || init.method === "GET")) {
        p.then(r => (r.ok ? r.clone().json() : null)).then(rows => {
          if (!Array.isArray(rows)) return;
          tap[KEY[m[1]]] = rows;
          window.dispatchEvent(new CustomEvent("aios-data"));
        }).catch(() => {});
      }
    } catch (e) { /* never get in the way of the real request */ }
    return p;
  };
})();

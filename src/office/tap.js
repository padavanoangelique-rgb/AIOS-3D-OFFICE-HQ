/* AIOS 3D office: read-only data tap.
   Listens to the two Supabase reads the dashboard already makes (roster + open decisions) so the
   office shows exactly the same data with no extra requests and no keys.
   It never changes a request or a response: the original promise is returned untouched. */
(() => {
  "use strict";
  const real = window.fetch;
  if (!real) return;
  const tap = window.AIOS_TAP = { bots: null, dec: null };
  const KEY = { aios_bots: "bots", aios_decisions: "dec" };
  window.fetch = function (input, init) {
    const p = real.apply(this, arguments);
    try {
      const url = typeof input === "string" ? input : (input && input.url) || "";
      const m = /\/rest\/v1\/(aios_bots|aios_decisions)\?/.exec(url);
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

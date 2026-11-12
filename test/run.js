// Local harness: serves src/, swaps the CDN + Supabase calls for local copies, takes screenshots.
const http = require("http"), fs = require("fs"), path = require("path");
const { chromium, devices } = require("playwright");
const mock = require("./mock.js");
const SRC = path.join(__dirname, "../src"), SHOTS = path.join(__dirname, "shots");
const TYPES = { ".html":"text/html", ".js":"text/javascript", ".css":"text/css", ".md":"text/plain", ".webmanifest":"application/json" };
fs.mkdirSync(SHOTS, { recursive:true });
const server = http.createServer((q, s) => { let p = q.url.split("?")[0]; if (p === "/") p = "/index.html"; const f = path.join(SRC, p);
  if (!f.startsWith(SRC) || !fs.existsSync(f)) { s.writeHead(404); return s.end("nope"); }
  s.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); s.end(fs.readFileSync(f)); });
exports.open = async (opt = {}) => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port, browser = await chromium.launch({ args:["--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
  const ctx = await browser.newContext(opt.phone ? { ...devices["iPhone 13"] } : { viewport:{ width:1280, height:800 } });
  const page = await ctx.newPage(), log = [], state = { over:{}, dec:mock.dec(), writes:[] };
  page.on("console", m => { if (["error","warning"].includes(m.type())) log.push(m.type() + ": " + m.text()); });
  page.on("pageerror", e => log.push("PAGEERROR: " + e.message));
  await page.route("**/*", route => { const u = route.request().url();
    if (u.startsWith("http://localhost")) return route.continue();
    if (u.includes("/build/three.module.min.js")) return route.fulfill({ contentType:"text/javascript", body:fs.readFileSync(path.join(__dirname, "node_modules/three/build/three.module.min.js")), headers:{ "access-control-allow-origin":"*" } });
    if (u.includes("/rest/v1/aios_bots")) return route.fulfill({ json: mock.bots(state.over) });
    if (u.includes("/rest/v1/aios_decisions")) return route.fulfill({ json: state.dec });
    if (u.includes("/rest/v1/aios_progress")) return route.fulfill({ json: [{ id:1, xp:240, quest:"Clear the queue", quest_done:false }] });
    if (u.includes("/rest/v1/")) return route.fulfill({ json: [] });
    if (u.includes("/functions/v1/aios-city")) { const j = JSON.parse(route.request().postData()), tok = route.request().headers()["x-aios-token"];
      state.city = state.city || { rooms:[], notes:[], n:1 }; const c = state.city;
      if (j.action === "load") return route.fulfill({ json:{ ok:true, owner:!!tok, rooms:c.rooms, notes: tok ? c.notes : null } });
      if (!tok) return route.fulfill({ status:401, json:{ error:"owner key required" } });
      state.writes.push("city:" + JSON.stringify(j));
      if (j.action === "room_set") { c.rooms = c.rooms.filter(r => r.bot_id !== j.bot).concat({ bot_id:j.bot, place:j.place }); return route.fulfill({ json:{ ok:true, data:[] } }); }
      if (j.action === "note_add") { const row = { id:c.n++, place:j.place, kind:j.kind, body:j.body }; c.notes.push(row); return route.fulfill({ json:{ ok:true, data:[row] } }); }
      if (j.action === "note_delete") { c.notes = c.notes.filter(n => n.id !== j.id); return route.fulfill({ json:{ ok:true, data:[{ id:j.id }] } }); }
      return route.fulfill({ status:400, json:{} }); }
    if (u.includes("/functions/v1/")) { const body = route.request().postData(); state.writes.push(body);
      if (!opt.unlocked) return route.fulfill({ status:401, json:{} });
      const j = JSON.parse(body); if (j.action === "resolve") state.dec = state.dec.filter(d => d.id !== j.id);
      return route.fulfill({ json:{ owner:true, data:[] } }); }
    return route.abort(); });
  if (opt.init) await page.addInitScript(opt.init);
  await page.goto(`http://localhost:${port}/` + (opt.hash || ""));
  const shot = n => page.screenshot({ path: path.join(SHOTS, n + ".png") });
  return { page, log, state, shot, close: async () => { await browser.close(); server.close(); } };
};

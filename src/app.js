(() => {
"use strict";
/* ---------- config ---------- */
const SB_URL = "https://qbgfrpikwlogorzyxuye.supabase.co";
const SB_KEY = "sb_publishable_Rk6tOSnbLs7tbOAsFa_VLQ_kHNVA2SG"; // public read-only key
const FN = SB_URL + "/functions/v1";
const TK = "aios-owner-token";
const TZ = "America/New_York";
const DIV = {
  cos:{n:"Chief of Staff",s:"CHIEF OF STAFF",c:"#e3c9ff"}, ceo:{n:"Office of the CEO",s:"CEO OFFICE",c:"#c56bff"},
  permit:{n:"PermitAIO",s:"PERMITAIO",c:"#3fe0ff"}, sales:{n:"Sales & Leads",s:"SALES",c:"#ff5fb7"},
  mkt:{n:"Marketing",s:"MARKETING",c:"#ffc94d"}, guard:{n:"Guardian",s:"GUARDIAN",c:"#4dff9a"},
  lanai:{n:"Majestic Lanai",s:"LANAI",c:"#7f9bff"}, side:{n:"Side Quests",s:"SIDE QUESTS",c:"#ff9a4d"},
  majestic:{n:"Majestic Permits",s:"MAJESTIC",c:"#5fc8ff"}, closer:{n:"Permit Closer",s:"CLOSER",c:"#ff5f6e"},
};
const PLAT = { grok:{n:"Grok",c:"#d9d9e3"}, claude:{n:"Claude",c:"#e8926a"}, codex:{n:"Codex",c:"#7ee0b0"}, nova:{n:"Nova",c:"#b89bff"}, hermes:{n:"Hermes",c:"#ffd166"}, other:{n:"Other",c:"#9a8db5"} };
const VIEWS = [
  ["city","City",'<path d="M3 21V9l6-3v15M9 21V4l6 3v14M15 21V11l6 2v8M2 21h20"/>'],
  ["command","Command",'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>'],
  ["chat","Chat",'<path d="M4 5h16v11H9l-5 4z"/>'],
  ["tasks","To-do",'<path d="M4 6l2 2 3-3M4 13l2 2 3-3M4 20l2 2 3-3M12 7h8M12 14h8M12 21h8" transform="translate(0,-2)"/>'],
  ["org","Org",'<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M5 16v-4h14v4"/>'],
  ["memory","Memory",'<path d="M5 4h11l3 3v13H5zM9 9h6M9 13h6M9 17h3"/>'],
];

/* ---------- state ---------- */
const S = { bots:[], goals:[], dec:[], act:[], usage:null, prog:null, rout:[], mem:[], tasks:[], threads:{}, msgs:[], msgSig:"",
  view: location.hash.slice(1) || localStorage.getItem("aios2-view") || "city", div:null, sel:null, chatBot:null, tok: localStorage.getItem(TK) || null,
  owner:false, live:false, hidden:new Set(), tf:"all", memQ:"", memBot:"" };
if (!VIEWS.some(v => v[0] === S.view)) S.view = "city";

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const bot = id => S.bots.find(b => b.id === id);
const botByName = n => S.bots.find(b => b.name === n || b.id === n);
const divc = d => (DIV[d] || {}).c || "#b98cff";
const plat = b => PLAT[b && b.platform] || PLAT.other;
const fmtT = d => new Date(d).toLocaleTimeString("en-US", { timeZone:TZ, hour:"numeric", minute:"2-digit" });
const fmtD = d => new Date(d).toLocaleDateString("en-US", { timeZone:TZ, month:"short", day:"numeric" });
const etDay = d => new Intl.DateTimeFormat("en-CA", { timeZone:TZ }).format(new Date(d));
const stamp = d => (etDay(d) === etDay(Date.now()) ? "" : fmtD(d) + " ") + fmtT(d);
function span(ms) { const m = Math.round(Math.abs(ms) / 6e4); if (m < 60) return m + "m"; const h = Math.floor(m / 60); if (h < 24) return h + "h " + (m % 60) + "m"; return Math.floor(h / 24) + "d " + (h % 24) + "h"; }
const ago = d => d ? span(Date.now() - new Date(d)) + " ago" : "never";
function dueLabel(d) { if (!d) return ""; const ms = new Date(d) - Date.now(); return ms < 0 ? "Overdue " + span(ms) : "Due in " + span(ms); }
function hash(s) { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
let toastT; function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2800); }
const sortedBots = () => [...S.bots].sort((a, b) => a.name.localeCompare(b.name));
const openTasks = id => S.tasks.filter(t => t.state !== "done" && (id === undefined || t.bot_id === id));

/* ---------- avatar / sprite ---------- */
const SKIN = ["#f6d3b3","#e9b98f","#c98d62","#8d5a3a","#f1c7a5"], HAIR = ["#2a1b12","#5a3a1c","#d8a657","#111","#7a2e1d","#c9c9d6"];
function sprite(b) {
  const h = hash(b.id), c = divc(b.division), sk = SKIN[h % SKIN.length], hr = HAIR[(h >> 3) % HAIR.length];
  return `<rect x="-5" y="-14" width="10" height="11" fill="${c}"/><rect x="-5" y="-14" width="10" height="2" fill="#fff" opacity=".25"/>`
    + `<rect x="-3.5" y="-3" width="3" height="3" fill="#221636"/><rect x=".5" y="-3" width="3" height="3" fill="#221636"/>`
    + `<rect x="-4" y="-22" width="8" height="8" fill="${sk}"/><rect x="-4" y="-23" width="8" height="3" fill="${hr}"/><rect x="-4" y="-21" width="1.5" height="3" fill="${hr}"/>`
    + `<rect x="-2.5" y="-18.5" width="1.5" height="1.5" fill="#1a1024"/><rect x="1" y="-18.5" width="1.5" height="1.5" fill="#1a1024"/>`
    + (b.is_head ? `<path d="M-4-23.5v-4l2 2 2-3 2 3 2-2v4z" fill="#ffc94d"/>` : "")
    + `<circle cx="5" cy="-13" r="2.2" fill="${plat(b).c}" stroke="#0a0613" stroke-width=".8"/>`;
}
const avatar = (b, sz = 40) => `<svg class="av" width="${sz}" height="${sz}" viewBox="-11 -30 22 32">${sprite(b)}</svg>`;

/* ---------- data ---------- */
async function rest(path) { const r = await fetch(SB_URL + "/rest/v1/" + path, { headers:{ apikey:SB_KEY } }); if (!r.ok) throw new Error("read " + r.status); return r.json(); }
let loading = false;
async function loadPublic() {
  if (loading) return; loading = true;
  try {
    const [bots, goals, dec, act, usage, prog, rout, mem] = await Promise.all([
      rest("aios_bots?select=*"), rest("aios_goals?select=*"), rest("aios_decisions?select=*&state=eq.open&order=due_at.asc.nullslast"),
      rest("aios_activity?select=*&order=id.desc&limit=80"), rest("aios_usage?select=*"), rest("aios_progress?select=*"),
      rest("aios_routines?select=*&order=id"), rest("aios_memory?select=*&order=id.desc&limit=300") ]);
    Object.assign(S, { bots, goals, dec, act, usage:usage[0] || null, prog:prog[0] || null, rout, mem, live:true });
  } catch (e) { S.live = false; }
  loading = false; update();
}
async function call(fn, body, quiet) {
  if (!S.tok) return null;
  try {
    const r = await fetch(FN + "/" + fn, { method:"POST", headers:{ "content-type":"application/json", "x-aios-token":S.tok }, body:JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { localStorage.removeItem(TK); S.tok = null; S.owner = false; toast("That key was not accepted"); update(); return null; }
    if (!r.ok) { if (!quiet) toast(j.error || "Request failed"); return null; }
    return j;
  } catch (e) { if (!quiet) toast("Offline — not saved"); return null; }
}
/* write = needs the key; asks for it once */
async function write(fn, body) { if (!S.tok && !(await askKey())) return null; return call(fn, body); }
async function askKey() {
  const v = await form({ title:"Enter your owner key", note:"Reading is open. Chat, to-dos, approvals and edits need your private owner key. It is stored only on this device.", ok:"Unlock",
    fields:[{ name:"key", label:"Owner key", type:"password" }] });
  if (!v || !v.key.trim()) return false;
  S.tok = v.key.trim(); const w = await call("aios-chat", { action:"whoami" }, true);
  if (!w) { S.tok = null; toast("That key was not accepted"); return false; }
  localStorage.setItem(TK, S.tok); S.owner = !!w.owner; toast(w.owner ? "Unlocked" : "Unlocked with a bot key (limited)"); pollPrivate(); return true;
}
async function pollPrivate() {
  if (!S.tok) return;
  const t = await call("aios-chat", { action:"tasks" }, true); if (t) S.tasks = t.data;
  if (S.owner) { const th = await call("aios-chat", { action:"threads" }, true); if (th) { S.threads = {}; th.data.forEach(x => S.threads[x.bot_id] = x); } }
  update();
}
async function pollThread(force) {
  if (!S.tok || S.view !== "chat" || !S.chatBot) return;
  const id = S.chatBot, r = await call("aios-chat", { action:"thread", bot:id, limit:200 }, true);
  if (!r || id !== S.chatBot) return;
  const sig = r.data.map(m => m.id + (m.picked_at ? "p" : "")).join(",");
  if (sig !== S.msgSig || force) { S.msgs = r.data; S.msgSig = sig; if (S.threads[id]) S.threads[id].unread = 0; views.chat.msgs(true); renderNav(); }
}

/* ---------- modal form ---------- */
function form({ title, note, fields = [], ok = "Save", danger }) {
  return new Promise(res => {
    const m = $("#modal");
    m.innerHTML = `<form><h3>${esc(title)}</h3>${note ? `<p>${esc(note)}</p>` : ""}` + fields.map(f => {
      const v = f.value ?? "";
      const el = f.type === "select" ? `<select class="in" name="${f.name}">${f.options.map(o => `<option value="${esc(o[0])}"${String(o[0]) === String(v) ? " selected" : ""}>${esc(o[1])}</option>`).join("")}</select>`
        : f.type === "textarea" ? `<textarea class="in" name="${f.name}" rows="4">${esc(v)}</textarea>`
        : `<input class="in" name="${f.name}" type="${f.type || "text"}" value="${esc(v)}" autocomplete="off"${f.step ? ` step="${f.step}"` : ""}>`;
      return `<label>${esc(f.label)}${el}</label>`;
    }).join("") + `<div class="row" style="margin-top:6px"><button class="btn pri" type="submit">${esc(ok)}</button><button class="btn ghost" type="button" data-x="cancel">Cancel</button>${danger ? `<span style="flex:1"></span><button class="btn no" type="button" data-x="danger">${esc(danger)}</button>` : ""}</div></form>`;
    m.hidden = false;
    const f = $("form", m), done = v => { m.hidden = true; m.innerHTML = ""; res(v); };
    const first = f.querySelector(".in"); if (first) setTimeout(() => first.focus(), 50);
    f.onsubmit = e => { e.preventDefault(); done(Object.fromEntries(new FormData(f))); };
    f.onclick = e => { const x = e.target.dataset.x; if (x === "cancel") done(null); if (x === "danger") done({ _danger:true }); };
    m.onclick = e => { if (e.target === m) done(null); };
  });
}
const botOptions = (none) => (none ? [["", none]] : []).concat(sortedBots().map(b => [b.id, b.name + " · " + plat(b).n]));

/* ---------- top bar + nav ---------- */
function renderTop() {
  const w = S.bots.filter(b => b.status === "working").length, wt = S.bots.filter(b => b.status === "waiting").length;
  const xp = S.prog ? S.prog.xp : 0, u = S.usage;
  const stale = u && u.resets_at && new Date(u.resets_at) < Date.now();
  $("#top").innerHTML = `<div class="brand"><i class="dot ${S.live ? "on" : ""}"></i>AIOS</div>
    <span class="chip go"><b>${w}</b> working</span>
    <span class="chip ${wt ? "warn" : ""}"><b>${wt}</b> waiting</span>
    <button class="chip ${S.dec.length ? "warn" : ""}" data-act="view" data-id="command"><b>${S.dec.length}</b> need you</button>
    <button class="chip hide-s" data-act="view" data-id="tasks"><b>${S.tok ? openTasks().length : "–"}</b> to-dos</button>
    ${u ? `<span class="chip hide-s" title="Grok plan usage">Grok ${esc(u.plan || "")} <span class="bar" style="--c:${u.weekly_pct > 85 ? "var(--red)" : "var(--violet)"}"><i style="width:${Math.min(100, u.weekly_pct || 0)}%"></i></span> <b>${stale ? "–" : Math.round(u.weekly_pct) + "%"}</b></span>` : ""}
    <span class="chip hide-s">LV <b>${Math.floor(xp / 100) + 1}</b> · ${xp % 100}/100 XP</span>
    <span class="top-sp"></span>
    <button class="chip" data-act="key">${S.tok ? (S.owner ? "Unlocked" : "Bot key") : "Locked · enter key"}</button>
    <span class="clock" id="clock"></span>`;
  tick();
}
function tick() { const c = $("#clock"); if (c) c.textContent = new Date().toLocaleTimeString("en-US", { timeZone:TZ, hour:"numeric", minute:"2-digit" }) + " ET"; }
function renderNav() {
  const unread = Object.values(S.threads).reduce((n, t) => n + (t.unread || 0), 0);
  const badge = { command:S.dec.length, chat:unread, tasks:0 };
  $("#nav").innerHTML = `<div class="logo">AIOS</div>` + VIEWS.map(([id, label, icon]) =>
    `<button class="${S.view === id ? "on" : ""}" data-act="view" data-id="${id}"><svg viewBox="0 0 24 24">${icon}</svg><span>${label}</span>${badge[id] ? `<i class="badge">${badge[id]}</i>` : ""}</button>`).join("") + `<div class="sp"></div>`;
}

/* ---------- shared cards ---------- */
function decCard(d) {
  const b = botByName(d.bot), od = d.due_at && new Date(d.due_at) < Date.now();
  const btns = d.kind === "answer" ? `<button class="btn pri" data-act="answer" data-id="${d.id}">Answer</button>`
    : d.kind === "done" ? `<button class="btn ok" data-act="resolve" data-id="${d.id}" data-state="done">Mark done</button>`
    : `<button class="btn ok" data-act="resolve" data-id="${d.id}" data-state="approved">Approve</button><button class="btn no" data-act="resolve" data-id="${d.id}" data-state="declined">Decline</button>`;
  return `<div class="card" style="--c:${divc(d.division)}"><div class="meta"><span class="tag" style="--c:${divc(d.division)}">${esc((DIV[d.division] || {}).s || d.division || "")}</span><span>${esc(d.bot || "")}</span><span class="sp"></span><span class="${od ? "bad" : ""}">${esc(dueLabel(d.due_at))}</span></div>
    <div class="ttl">${esc(d.title)}</div><div class="row">${btns}${b ? `<button class="btn ghost" data-act="chat" data-id="${b.id}">Chat</button>` : ""}<button class="btn ghost" data-act="hide" data-id="${d.id}">Later</button></div></div>`;
}
const queue = () => S.dec.filter(d => !S.hidden.has(d.id));
function taskRow(t, move) {
  const b = bot(t.bot_id), next = { todo:"doing", doing:"done", done:"todo" }[t.state];
  const od = t.due_at && t.state !== "done" && new Date(t.due_at) < Date.now();
  return `<div class="task ${t.state}"><button class="ck" data-act="tstate" data-id="${t.id}" data-state="${t.state === "done" ? "todo" : "done"}" aria-label="Toggle done">${t.state === "done" ? "✓" : ""}</button>
    <button class="b" data-act="tedit" data-id="${t.id}"><div class="tt">${esc(t.title)}</div><div class="mm">${b ? `<span class="tag" style="--c:${divc(b.division)}">${esc(b.name)}</span>` : `<span class="tag">Me</span>`}${t.priority !== "med" ? `<span class="pr-${t.priority}">${t.priority}</span>` : ""}${t.due_at ? `<span class="${od ? "bad" : ""}">${esc(dueLabel(t.due_at))}</span>` : ""}</div></button>
    ${move && t.state !== "done" ? `<button class="btn sm mv" data-act="tstate" data-id="${t.id}" data-state="${next}">${next === "doing" ? "Start" : "Done"}</button>` : ""}</div>`;
}

/* ---------- isometric building ---------- */
const TW = 22, TH = 11, WALL = 24;
const P = (x, y, z = 0) => [(x - y) * TW, (x + y) * TH - z];
const pts = a => a.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
const poly = (a, at) => `<polygon points="${pts(a)}" ${at}/>`;
function box(x, y, w, d, h, ct, cl, cr, z = 0) {
  return poly([P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)], `fill="${cl}"`)
    + poly([P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)], `fill="${cr}"`)
    + poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], `fill="${ct}"`);
}
const ROOMS = [["cos",0,0,5,6],["ceo",6,0,13,6],["permit",0,7,4,6],["sales",5,7,4,6],["mkt",10,7,4,6],["guard",15,7,4,6],["lanai",0,14,4,6],["side",5,14,4,6],["majestic",10,14,4,6],["closer",15,14,4,6]];
function building() {
  let s = `<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  // plaza + slab
  s += poly([P(-3, -3), P(22, -3), P(22, 23), P(-3, 23)], `fill="#0d0719" stroke="#1d1233"`);
  for (let i = -2; i <= 22; i += 2) s += `<line x1="${P(i, -3)[0]}" y1="${P(i, -3)[1]}" x2="${P(i, 23)[0]}" y2="${P(i, 23)[1]}" stroke="#170e2a"/><line x1="${P(-3, i)[0]}" y1="${P(-3, i)[1]}" x2="${P(22, i)[0]}" y2="${P(22, i)[1]}" stroke="#170e2a"/>`;
  s += box(-.7, -.7, 20.4, 21.4, 12, "#1b1130", "#0f0920", "#140c28", -12);
  s += poly([P(-.7, -.7), P(19.7, -.7), P(19.7, 20.7), P(-.7, 20.7)], `fill="none" stroke="#5b3da0" stroke-width="1.2" filter="url(#glow)"`);
  for (const [div, ox, oy, w, d] of ROOMS) {
    const c = divc(div), bots = S.bots.filter(b => b.division === div).sort((a, b) => (b.is_head ? 1 : 0) - (a.is_head ? 1 : 0) || a.name.localeCompare(b.name));
    const busy = bots.filter(b => b.status === "working").length, off = S.div && S.div !== div;
    let g = "";
    // floor + tiles
    g += poly([P(ox, oy), P(ox + w, oy), P(ox + w, oy + d), P(ox, oy + d)], `fill="#170e2b" stroke="${c}" stroke-opacity=".55" stroke-width="1"`);
    g += poly([P(ox, oy), P(ox + w, oy), P(ox + w, oy + d), P(ox, oy + d)], `fill="${c}" opacity=".06"`);
    for (let i = 1; i < w; i++) g += `<line x1="${P(ox + i, oy)[0]}" y1="${P(ox + i, oy)[1]}" x2="${P(ox + i, oy + d)[0]}" y2="${P(ox + i, oy + d)[1]}" stroke="#fff" stroke-opacity=".045"/>`;
    for (let j = 1; j < d; j++) g += `<line x1="${P(ox, oy + j)[0]}" y1="${P(ox, oy + j)[1]}" x2="${P(ox + w, oy + j)[0]}" y2="${P(ox + w, oy + j)[1]}" stroke="#fff" stroke-opacity=".045"/>`;
    // rug
    g += poly([P(ox + .6, oy + 2.6), P(ox + w - .6, oy + 2.6), P(ox + w - .6, oy + 3.4), P(ox + .6, oy + 3.4)], `fill="${c}" opacity=".1"`);
    // low glass walls (back two sides) with neon top edge
    g += poly([P(ox, oy), P(ox + w, oy), P(ox + w, oy, WALL), P(ox, oy, WALL)], `fill="${c}" fill-opacity=".13" stroke="${c}" stroke-opacity=".5" stroke-width=".8"`);
    g += poly([P(ox, oy), P(ox, oy + d), P(ox, oy + d, WALL), P(ox, oy, WALL)], `fill="${c}" fill-opacity=".08" stroke="${c}" stroke-opacity=".5" stroke-width=".8"`);
    const a = P(ox, oy + d, WALL), b0 = P(ox, oy, WALL), e = P(ox + w, oy, WALL);
    g += `<polyline points="${pts([a, b0, e])}" fill="none" stroke="${c}" stroke-width="1.6" filter="url(#glow)"/>`;
    // wall signs
    const sp = P(ox + .35, oy, 8), cp = P(ox, oy + d - .35, 9);
    g += `<text class="sign" transform="matrix(1,.5,0,1,${sp[0].toFixed(1)},${sp[1].toFixed(1)})" fill="${c}" filter="url(#glow)">${esc(DIV[div].s)}</text>`;
    g += `<text class="cnt" transform="matrix(1,-.5,0,1,${cp[0].toFixed(1)},${cp[1].toFixed(1)})">${bots.length} bot${bots.length === 1 ? "" : "s"} · ${busy} busy</text>`;
    // plant
    g += box(ox + w - .75, oy + .35, .4, .4, 5, "#3b2a1c", "#2a1d13", "#33241a");
    const pl = P(ox + w - .55, oy + .55, 9); g += `<circle cx="${pl[0]}" cy="${pl[1]}" r="4.5" fill="#2fbf71"/><circle cx="${pl[0] - 2}" cy="${pl[1] - 3}" r="3" fill="#4dff9a" opacity=".8"/>`;
    // seats
    const per = Math.max(1, Math.min(bots.length, Math.floor(w / 2))), rows = Math.max(1, Math.ceil(bots.length / per));
    if (!bots.length) { const m = P(ox + w / 2, oy + d / 2); g += `<text class="lbl" x="${m[0]}" y="${m[1]}" opacity=".6">NO BOTS YET</text>`; }
    bots.forEach((bt, i) => {
      const r = Math.floor(i / per), col = i % per, inRow = Math.min(per, bots.length - r * per);
      const x = ox + (col + .5) * (w / inRow), y = oy + (rows === 1 ? d / 2 - .2 : 1.5 + r * ((d - 2.9) / (rows - 1)));
      const [sx, sy] = P(x, y), sel = S.sel === bt.id, working = bt.status === "working", waiting = bt.status === "waiting";
      let q = `<ellipse cx="${sx}" cy="${sy + 1}" rx="${sel ? 19 : 12}" ry="${sel ? 9.5 : 5}" fill="${sel ? "none" : "#000"}" ${sel ? `stroke="#fff" stroke-width="1.4"` : `opacity=".35"`}/>`;
      q += `<g transform="translate(${sx.toFixed(1)},${sy.toFixed(1)}) scale(1.6)" opacity="${bt.status === "idle" ? .78 : 1}">${sprite(bt)}</g>`;
      // desk in front of the bot + laptop
      q += box(x - .7, y + .25, 1.4, .6, 11, "#3a2a5c", "#241840", "#2c1e4d");
      const lp = P(x, y + .55, 11);
      q += `<polygon points="${lp[0] - 7},${lp[1] - 1} ${lp[0] + 7},${lp[1] - 1} ${lp[0] + 6},${lp[1] - 11} ${lp[0] - 6},${lp[1] - 11}" fill="${working ? c : "#15102a"}" ${working ? `filter="url(#glow)"` : ""} stroke="#0a0613" stroke-width=".6"/>`;
      if (working) q += `<g class="typing" fill="#0a0613"><circle cx="${lp[0] - 2.5}" cy="${lp[1] - 6}" r="1.3"/><circle cx="${lp[0]}" cy="${lp[1] - 6}" r="1.3"/><circle cx="${lp[0] + 2.5}" cy="${lp[1] - 6}" r="1.3"/></g>`;
      if (waiting) q += `<g class="bang"><rect x="${sx - 5}" y="${sy - 58}" width="10" height="12" rx="3" fill="#ff5f6e"/><text x="${sx}" y="${sy - 48.5}" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" font-family="Inter,sans-serif">!</text></g>`;
      const lb = P(x, y + .9); q += `<text class="lbl" x="${lb[0].toFixed(1)}" y="${(lb[1] + 9).toFixed(1)}">${esc(bt.name.split(/[ -]/)[0].slice(0, 10))}</text>`;
      q += `<rect x="${sx - 20}" y="${sy - 44}" width="40" height="66" fill="transparent"/>`;
      g += `<g class="bot" data-act="bot" data-id="${bt.id}">${q}</g>`;
    });
    s += `<g class="room${off ? " off" : ""}" data-act="div" data-id="${div}">${g}</g>`;
  }
  return `<svg viewBox="-466 -44 912 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Office building with every bot at its desk">${s}</svg>`;
}

/* ---------- views ---------- */
const views = {
  city: {
    mount: () => `<div class="city"><div><div class="divs" id="divs"></div><div class="panel stage"><div id="bld"></div><div class="legend">Tap a bot to open it · lit screen = working · ! = waiting on you · tap a room to focus</div></div></div>
      <div class="side"><section class="panel"><h2>Waiting on you <span class="n" id="qn"></span></h2><div id="q"></div></section><section class="panel"><h2>To-do <span class="sp"></span><button class="btn sm" data-act="tadd">+ Add</button></h2><div id="td"></div></section></div></div>`,
    update() {
      $("#divs").innerHTML = `<button class="${S.div ? "" : "on"}" data-act="div" data-id="">All</button>` + ROOMS.map(([d]) => `<button class="${S.div === d ? "on" : ""}" style="--c:${divc(d)}" data-act="div" data-id="${d}">${esc(DIV[d].s)}</button>`).join("");
      $("#bld").innerHTML = building();
      const q = queue().filter(d => !S.div || d.division === S.div); $("#qn").textContent = q.length || "";
      $("#q").innerHTML = q.slice(0, 5).map(decCard).join("") || `<div class="empty">Nothing needs you right now.</div>`;
      const t = openTasks().slice(0, 6);
      $("#td").innerHTML = !S.tok ? `<div class="empty">Enter your owner key to see to-dos.</div>` : t.map(x => taskRow(x)).join("") || `<div class="empty">No open to-dos.</div>`;
    },
  },
  command: {
    mount: () => `<div class="stats" id="stats"></div><div class="cols2"><div><section class="panel"><h2>Priority queue <span class="n" id="cqn"></span></h2><div id="cq"></div></section>
      <section class="panel" style="margin-top:14px"><h2>Daily quest</h2><div id="quest"></div></section></div>
      <div><section class="panel"><h2>Activity log</h2><div class="log" id="log"></div></section><section class="panel" style="margin-top:14px"><h2>Routines <span class="n" id="rn"></span></h2><div id="rout"></div></section></div></div>`,
    update() {
      const today = etDay(Date.now()), done = S.act.filter(a => a.kind === "done" && etDay(a.created_at) === today).length;
      const w = S.bots.filter(b => b.status === "working").length, wt = S.bots.filter(b => b.status === "waiting").length;
      const st = [["Bots", S.bots.length, Object.keys(PLAT).filter(p => S.bots.some(b => b.platform === p)).map(p => PLAT[p].n).join(" · ")], ["Working", w, "right now", "var(--green)"], ["Waiting", wt, "blocked on you", wt ? "var(--red)" : ""],
        ["Queue", S.dec.length, "decisions open", S.dec.length ? "var(--accent)" : ""], ["To-dos", S.tok ? openTasks().length : "–", "open"], ["Done today", done, "tasks finished", "var(--cyan)"]];
      $("#stats").innerHTML = st.map(([k, v, s, c]) => `<div class="stat" style="${c ? "--c:" + c : ""}"><div class="k px">${k}</div><div class="v">${v}</div><div class="s">${esc(s)}</div></div>`).join("");
      const q = queue(); $("#cqn").textContent = q.length + " open";
      $("#cq").innerHTML = q.map(decCard).join("") || `<div class="empty">Queue is clear.</div>`;
      const p = S.prog; $("#quest").innerHTML = p ? `<div class="row"><div style="flex:1;min-width:180px"><b>${esc(p.quest)}</b><div class="dim" style="font-size:12.5px">Resets daily · +150 XP</div></div>${p.quest_done && String(p.quest_date) === today ? `<span class="chip go"><b>Claimed</b></span>` : `<button class="btn ok" data-act="quest">Claim +150</button>`}</div>` : "";
      $("#log").innerHTML = S.act.slice(0, 40).map(a => `<div><time>${esc(stamp(a.created_at))}</time><b>${esc(a.bot || "")}</b> ${esc(a.message)}</div>`).join("") || `<div class="empty">No activity yet.</div>`;
      const on = S.rout.filter(r => r.status === "on").length; $("#rn").textContent = on + " on · " + (S.rout.length - on) + " paused";
      $("#rout").innerHTML = [...S.rout].sort((a, b) => (a.status === "on" ? 0 : 1) - (b.status === "on" ? 0 : 1)).map(r => `<div class="rt"><span class="st px ${r.status}">${r.status}</span><div style="min-width:0"><b>${esc(r.name)}</b><div class="dim" style="font-size:12px">${esc((bot(r.bot_id) || {}).name || r.bot_id)} · ${esc(r.schedule)}</div></div></div>`).join("") || `<div class="empty">No routines reported.</div>`;
    },
  },
  org: {
    mount: () => `<section class="panel"><h2>AI company org chart</h2><div id="org"></div></section>`,
    update() {
      const node = (b, extra = "") => `<button class="node ${extra}" data-act="bot" data-id="${b.id}">${avatar(b, 36)}<div style="min-width:0"><div class="nm">${esc(b.name)}</div><div class="rl">${esc(b.role || "")}</div></div><span style="flex:1"></span><span class="plat" style="--c:${plat(b).c}">${plat(b).n}</span></button>`;
      const cos = S.bots.filter(b => b.division === "cos").sort((a, b) => (b.is_head ? 1 : 0) - (a.is_head ? 1 : 0));
      let h = `<div class="org-top"><div class="node me"><div><div class="rl px" style="font-size:9px">CEO · human</div><div class="nm">Angelique Padavano</div></div></div>` + cos.map(b => `<div class="vline"></div><div style="width:min(340px,100%)">${node(b, b.is_head ? "me" : "")}</div>`).join("") + `<div class="vline"></div></div><div class="org-cols">`;
      for (const [d] of ROOMS) { if (d === "cos") continue;
        const bs = S.bots.filter(b => b.division === d), head = bs.find(b => b.is_head), g = S.goals.find(x => x.division === d), c = divc(d);
        const pct = g && g.target ? Math.min(100, Math.round(g.current / g.target * 100)) : 0;
        h += `<div class="org-col" style="--c:${c}"><h3>${esc(DIV[d].n)}</h3><div class="head">${head ? node(head) : `<div class="empty">No head assigned${d === "ceo" ? " · run by Chief of Staff" : ""}</div>`}
          <button class="goal" data-act="goal" data-id="${d}"><div class="g1"><span>GOAL</span><span>${pct}%</span></div><div class="bar" style="--c:${c}"><i style="width:${pct}%"></i></div><div class="g2">${g ? esc(g.label || "Tap to set a goal") + ` · ${g.current}/${g.target}${g.unit ? " " + esc(g.unit) : ""}` : "Tap to set a goal"}</div></button></div>`
          + bs.filter(b => !b.is_head).map(b => node(b)).join("") + `</div>`;
      }
      $("#org").innerHTML = h + `</div>`;
    },
  },
  chat: {
    mount: () => `<div class="chat" id="chat"><div class="panel list" id="clist"></div><div class="panel thread"><div class="th-head" id="thh"></div><div class="msgs" id="msgs"></div>
      <div class="composer"><textarea class="in" id="cin" rows="1" placeholder="Message this bot…" enterkeyhint="send"></textarea><button class="btn pri" data-act="send">Send</button></div></div></div>`,
    update() {
      if (!S.chatBot && S.bots.length && innerWidth > 720) { S.chatBot = (bot(S.sel) || bot("maximus") || S.bots[0]).id; pollThread(true); }
      $("#chat").classList.toggle("open", !!S.chatBot);
      const lastId = b => ((S.threads[b.id] || {}).last || {}).id || 0;
      const list = [...S.bots].sort((a, b) => lastId(b) - lastId(a) || a.name.localeCompare(b.name));
      $("#clist").innerHTML = list.map(b => { const t = S.threads[b.id];
        return `<button class="cl ${S.chatBot === b.id ? "on" : ""}" data-act="chat" data-id="${b.id}">${avatar(b, 38)}<div class="t"><div class="nm">${esc(b.name)}<span class="plat" style="--c:${plat(b).c}">${plat(b).n}</span></div><div class="pv">${t ? esc((t.last.sender === "owner" ? "You: " : "") + t.last.body) : esc(b.role || "")}</div></div>${t && t.unread ? `<span class="un">${t.unread}</span>` : ""}</button>`; }).join("");
      const b = bot(S.chatBot);
      $("#thh").innerHTML = b ? `<button class="btn sm back" data-act="chatback">‹</button>${avatar(b, 36)}<div style="min-width:0;flex:1"><b>${esc(b.name)}</b><div class="dim" style="font-size:12px">${esc(b.status)}${b.status_line ? " · " + esc(b.status_line) : ""} · inbox checked ${ago(b.last_seen_at)}</div></div><button class="btn sm" data-act="bot" data-id="${b.id}">Profile</button>` : `<span class="dim">Pick a bot</span>`;
    },
    msgs(scroll) {
      const el = $("#msgs"); if (!el) return; const b = bot(S.chatBot);
      const body = !S.tok ? `<div class="note">Enter your owner key to use chat.</div>` : S.msgs.map(m => `<div class="msg ${m.sender}">${esc(m.body)}<small>${esc(stamp(m.created_at))}${m.sender === "owner" ? (m.picked_at ? " · picked up" : " · waiting in inbox") : ""}</small></div>`).join("");
      el.innerHTML = body + (S.tok && b && !b.last_seen_at ? `<div class="note">${esc(b.name)} has not checked its inbox yet. Messages wait here until it does — give it the instructions in BOT_API.md.</div>` : "") + (S.tok && !S.msgs.length && b && b.last_seen_at ? `<div class="note">No messages yet.</div>` : "");
      if (scroll) el.scrollTop = el.scrollHeight;
    },
  },
  tasks: {
    mount: () => `<div class="addbar"><input class="in" id="tnew" placeholder="Add a to-do…" enterkeyhint="done"><select class="in" id="tbot"></select><select class="in" id="tpri"><option value="med">Normal</option><option value="high">High</option><option value="low">Low</option></select><button class="btn pri" data-act="tquick">Add</button></div>
      <div class="divs" id="tfil"></div><div class="kan" id="kan"></div>`,
    update() {
      const sel = $("#tbot"); if (sel && sel.options.length !== S.bots.length + 1) { const v = sel.value; sel.innerHTML = botOptions("Me (no bot)").map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join(""); sel.value = v; }
      const withTasks = sortedBots().filter(b => S.tasks.some(t => t.bot_id === b.id));
      $("#tfil").innerHTML = [["all","All"],["me","Mine"]].concat(withTasks.map(b => [b.id, b.name])).map(([id, n]) => `<button class="${S.tf === id ? "on" : ""}" data-act="tfil" data-id="${id}">${esc(n)}</button>`).join("");
      if (!S.tok) { $("#kan").innerHTML = `<div class="empty">Enter your owner key to see and manage to-dos. <button class="btn sm" data-act="key">Enter key</button></div>`; return; }
      const ts = S.tasks.filter(t => S.tf === "all" || (S.tf === "me" ? !t.bot_id : t.bot_id === S.tf));
      const pr = { high:0, med:1, low:2 };
      $("#kan").innerHTML = [["todo","To do"],["doing","In progress"],["done","Done"]].map(([st, n]) => { const l = ts.filter(t => t.state === st).sort((a, b) => st === "done" ? new Date(b.done_at) - new Date(a.done_at) : pr[a.priority] - pr[b.priority] || a.id - b.id).slice(0, st === "done" ? 25 : 200);
        return `<section class="panel"><h2>${n} <span class="n">${l.length}</span></h2>${l.map(t => taskRow(t, true)).join("") || `<div class="empty">Nothing here.</div>`}</section>`; }).join("");
    },
  },
  memory: {
    mount: () => `<div class="memrow"><input class="in" id="mq" placeholder="Search every bot's memory…"><select class="in" id="mbot"></select><button class="btn pri" data-act="madd">+ Note</button></div><div id="mem"></div>`,
    update() {
      const sel = $("#mbot"); if (sel && sel.options.length !== S.bots.length + 1) { sel.innerHTML = botOptions("All bots").map(o => `<option value="${esc(o[0])}">${esc(o[1])}</option>`).join(""); sel.value = S.memBot; }
      const q = S.memQ.toLowerCase(), l = S.mem.filter(m => !m.archived && (!S.memBot || m.bot_id === S.memBot) && (!q || m.content.toLowerCase().includes(q)));
      $("#mem").innerHTML = l.map(m => { const b = bot(m.bot_id) || { name:m.bot_id, division:"" };
        return `<div class="card" style="--c:${divc(b.division)}"><div class="meta"><b style="color:var(--text)">${esc(b.name)}</b><span class="tag">${esc(m.kind)}</span><span class="sp"></span><span>${esc(stamp(m.created_at))}</span><button class="btn sm ghost" data-act="marc" data-id="${m.id}">Archive</button></div><div style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(m.content)}</div></div>`; }).join("")
        || `<div class="panel empty">${S.mem.length ? "No memory matches." : "No bot memory yet. Bots save notes with memory_add (see BOT_API.md), or add one yourself."}</div>`;
    },
  },
};

/* ---------- drawer (bot profile) ---------- */
function renderDrawer() {
  const d = $("#drawer"), b = bot(S.sel); if (!b) { d.hidden = true; return; }
  const ts = openTasks(b.id), rt = S.rout.filter(r => r.bot_id === b.id), mm = S.mem.filter(m => m.bot_id === b.id && !m.archived).slice(0, 3), ac = S.act.filter(a => a.bot === b.name).slice(0, 5);
  d.hidden = false;
  d.innerHTML = `<div class="hd">${avatar(b, 64)}<div style="min-width:0"><div class="nm">${esc(b.name)}</div><div class="dim" style="font-size:13px">${esc(b.role || "")}</div><div class="row" style="margin-top:6px"><span class="plat" style="--c:${plat(b).c}">${plat(b).n}</span><span class="tag" style="--c:${divc(b.division)}">${esc((DIV[b.division] || {}).n || b.division)}</span>${b.is_head ? `<span class="tag" style="--c:var(--yellow)">Head</span>` : ""}</div></div><button class="btn sm x" data-act="close">Close</button></div>
    <div class="seg">${["working","waiting","idle"].map(s => `<button class="btn sm ${b.status === s ? "on" : ""}" data-act="status" data-id="${b.id}" data-state="${s}">${s}</button>`).join("")}</div>
    <div class="kv">${b.status_line ? `<b>${esc(b.status_line)}</b><br>` : ""}Status updated ${ago(b.updated_at)} · inbox checked ${ago(b.last_seen_at)}</div>
    <div class="row"><button class="btn pri" data-act="chat" data-id="${b.id}">Open chat</button><button class="btn" data-act="tadd" data-id="${b.id}">+ To-do</button><button class="btn" data-act="madd" data-id="${b.id}">+ Note</button></div>
    <h2>Open to-dos <span class="n">${S.tok ? ts.length : ""}</span></h2>${!S.tok ? `<div class="empty">Locked.</div>` : ts.map(t => taskRow(t)).join("") || `<div class="empty">None.</div>`}
    <h2>Routines <span class="n">${rt.length}</span></h2>${rt.map(r => `<div class="rt"><span class="st px ${r.status}">${r.status}</span><div><b>${esc(r.name)}</b><div class="dim" style="font-size:12px">${esc(r.schedule)}</div></div></div>`).join("") || `<div class="empty">None reported.</div>`}
    <h2>Memory</h2>${mm.map(m => `<div class="card"><div class="meta"><span class="tag">${esc(m.kind)}</span></div>${esc(m.content)}</div>`).join("") || `<div class="empty">No notes.</div>`}
    <h2>Recent activity</h2><div class="log">${ac.map(a => `<div><time>${esc(stamp(a.created_at))}</time>${esc(a.message)}</div>`).join("") || `<div class="empty">Nothing posted yet.</div>`}</div>`;
}

/* ---------- render plumbing ---------- */
function setView(v) { S.view = v; localStorage.setItem("aios2-view", v); $("#main").innerHTML = views[v].mount(); $("#main").scrollTop = 0; update(); if (v === "chat") { views.chat.msgs(true); pollThread(true); } }
function update() { renderTop(); renderNav(); if (!$("#main").firstChild) $("#main").innerHTML = views[S.view].mount(); views[S.view].update(); if (S.sel) renderDrawer(); }
function openChat(id) { S.chatBot = id; S.msgs = []; S.msgSig = ""; S.sel = null; $("#drawer").hidden = true; if (S.view !== "chat") setView("chat"); else { update(); views.chat.msgs(true); pollThread(true); } if (!S.tok) askKey().then(ok => ok && pollThread(true)); }
async function editTask(t, preBot) {
  const v = await form({ title: t ? "Edit to-do" : "New to-do", ok: t ? "Save" : "Add", danger: t && S.owner ? "Delete" : null, fields: [
    { name:"title", label:"What needs doing", value: t ? t.title : "" },
    { name:"bot", label:"Assigned to", type:"select", value: t ? t.bot_id || "" : preBot || "", options: botOptions("Me (no bot)") },
    { name:"priority", label:"Priority", type:"select", value: t ? t.priority : "med", options:[["high","High"],["med","Normal"],["low","Low"]] },
    ...(t ? [{ name:"state", label:"Status", type:"select", value:t.state, options:[["todo","To do"],["doing","In progress"],["done","Done"]] }] : []),
    { name:"due", label:"Due (optional)", type:"datetime-local", value: t && t.due_at ? new Date(new Date(t.due_at) - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "" },
    { name:"notes", label:"Notes (optional)", type:"textarea", value: t ? t.notes || "" : "" } ] });
  if (!v) return;
  if (v._danger) { if (await write("aios-chat", { action:"task_delete", id:t.id })) { toast("Deleted"); pollPrivate(); } return; }
  if (!v.title.trim()) return toast("Give it a title");
  const body = { title:v.title, bot:v.bot || (t ? null : undefined), priority:v.priority, due_at: v.due ? new Date(v.due).toISOString() : (t ? null : undefined), notes: v.notes || (t ? null : undefined) };
  const r = t ? await write("aios-chat", { action:"task_update", id:t.id, state:v.state, ...body }) : await write("aios-chat", { action:"task_add", ...body });
  if (r) { toast(t ? "Saved" : "Added"); pollPrivate(); }
}
async function sendChat() {
  const el = $("#cin"), body = el.value.trim(); if (!body || !S.chatBot) return;
  el.value = ""; el.style.height = "";
  const r = await write("aios-chat", { action:"send", bot:S.chatBot, body });
  if (!r) { el.value = body; return; }
  await pollThread(true); pollPrivate();
}

/* ---------- actions ---------- */
const A = {
  view: id => setView(id),
  div: id => { S.div = !id || S.div === id ? null : id; if (S.view !== "city") setView("city"); else update(); },
  bot: id => { S.sel = id; update(); },
  close: () => { S.sel = null; $("#drawer").hidden = true; update(); },
  chat: id => openChat(id),
  chatback: () => { S.chatBot = null; update(); },
  send: () => sendChat(),
  hide: id => { S.hidden.add(+id); update(); },
  key: async () => { if (!S.tok) return askKey().then(update); const v = await form({ title:"Owner key", note:"This device is unlocked. Forget the key to lock it again.", ok:"Keep", danger:"Forget key", fields:[] }); if (v && v._danger) { localStorage.removeItem(TK); S.tok = null; S.owner = false; S.tasks = []; S.threads = {}; S.msgs = []; update(); toast("Locked"); } },
  resolve: async (id, el) => { if (await write("aios-write", { action:"resolve", id:+id, state:el.dataset.state })) { toast(el.dataset.state === "declined" ? "Declined" : "Done · XP earned"); loadPublic(); } },
  answer: async id => { const d = S.dec.find(x => x.id === +id); const v = await form({ title: d ? d.title : "Answer", ok:"Send answer", fields:[{ name:"a", label:"Your answer", type:"textarea" }] }); if (v && v.a.trim() && await write("aios-write", { action:"resolve", id:+id, state:"answered", answer:v.a.trim() })) { toast("Answered"); loadPublic(); } },
  status: async (id, el) => { if (await write("aios-write", { action:"status", bot:id, status:el.dataset.state })) loadPublic(); },
  quest: async () => { if (await write("aios-write", { action:"quest", done:true })) { toast("+150 XP"); loadPublic(); } },
  goal: async id => { const g = S.goals.find(x => x.division === id) || {}; const v = await form({ title:DIV[id].n + " goal", fields:[{ name:"label", label:"Goal", value:g.label || "" }, { name:"current", label:"Current", type:"number", step:"any", value:g.current ?? 0 }, { name:"target", label:"Target", type:"number", step:"any", value:g.target ?? 100 }, { name:"unit", label:"Unit (optional)", value:g.unit || "" }] });
    if (v && await write("aios-write", { action:"goal", division:id, label:v.label, current:+v.current || 0, target:+v.target || 100, unit:v.unit || null })) { toast("Goal saved"); loadPublic(); } },
  tadd: id => editTask(null, id),
  tedit: id => editTask(S.tasks.find(t => t.id === +id)),
  tstate: async (id, el) => { if (await write("aios-chat", { action:"task_update", id:+id, state:el.dataset.state })) pollPrivate(); },
  tfil: id => { S.tf = id; update(); },
  tquick: async () => { const el = $("#tnew"), title = el.value.trim(); if (!title) return el.focus(); if (await write("aios-chat", { action:"task_add", title, bot:$("#tbot").value || undefined, priority:$("#tpri").value })) { el.value = ""; pollPrivate(); } },
  madd: async id => { const v = await form({ title:"New memory note", ok:"Save note", fields:[{ name:"bot", label:"Bot", type:"select", value:id || S.memBot || (S.bots[0] || {}).id, options:botOptions() }, { name:"kind", label:"Kind", type:"select", value:"note", options:["note","fact","preference","profile","journal"].map(k => [k, k]) }, { name:"content", label:"Note (no passwords or keys)", type:"textarea" }] });
    if (v && v.content.trim() && await write("aios-write", { action:"memory_add", bot:v.bot, kind:v.kind, content:v.content.trim() })) { toast("Saved"); loadPublic(); } },
  marc: async id => { if (await write("aios-write", { action:"memory_archive", id:+id })) { toast("Archived"); loadPublic(); } },
};
document.addEventListener("click", e => {
  const el = e.target.closest("[data-act]"); if (!el || $("#modal").contains(el)) return;
  const fn = A[el.dataset.act]; if (fn) { e.stopPropagation(); fn(el.dataset.id, el); }
});
document.addEventListener("input", e => {
  if (e.target.id === "mq") { S.memQ = e.target.value; views.memory.update(); }
  if (e.target.id === "cin") { e.target.style.height = "auto"; e.target.style.height = Math.min(140, e.target.scrollHeight) + "px"; }
});
document.addEventListener("change", e => { if (e.target.id === "mbot") { S.memBot = e.target.value; views.memory.update(); } });
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || e.isComposing) return;
  if (e.target.id === "cin" && !e.shiftKey) { e.preventDefault(); sendChat(); }
  if (e.target.id === "tnew") A.tquick();
});

/* ---------- boot ---------- */
setView(S.view);
loadPublic();
if (S.tok) call("aios-chat", { action:"whoami" }, true).then(w => { if (w) { S.owner = !!w.owner; pollPrivate(); } });
setInterval(loadPublic, 20000);
setInterval(pollPrivate, 8000);
setInterval(() => pollThread(), 3000);
setInterval(tick, 15000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) { loadPublic(); pollPrivate(); } });
try {
  if (window.supabase) { let t; const sb = window.supabase.createClient(SB_URL, SB_KEY, { auth:{ persistSession:false } });
    sb.channel("aios2").on("postgres_changes", { event:"*", schema:"public" }, () => { clearTimeout(t); t = setTimeout(loadPublic, 400); }).subscribe(); }
} catch (e) { /* realtime is optional; polling covers it */ }
})();

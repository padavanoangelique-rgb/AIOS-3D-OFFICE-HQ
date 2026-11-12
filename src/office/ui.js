/* AIOS 3D city: panels. Team list, agent card, business file (goals / notes / ideas / materials),
   daily quest card and XP pop-ups. Talk, Profile, Claim and "enter key" press the dashboard's own buttons. */
import { PLACES, PLAT_NAME, KINDS, placeOfId } from "./data.js";
import { modeOf } from "./anim.js";

function node(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function btn(cls, text, attrs) { const b = node("button", "btn " + cls, text); Object.assign(b.dataset, attrs); return b; }
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

export function createUI(root, store) {
  const team = node("div", "o3-team"), card = node("div", "o3-card"), file = node("div", "o3-sheet o3-file"), xp = node("div", "o3-xp");
  team.hidden = card.hidden = file.hidden = xp.hidden = true;
  root.append(team, card, file);
  const bar = root.querySelector(".o3-bar");
  bar.insertBefore(xp, bar.querySelector(".o3-sp"));        // level badge sits in the toolbar
  let roster = [], prog = null, shown = null, place = null, lastXp = null;

  /* true while you have a menu open, or text half-typed, inside this panel */
  function busy(panel) { const a = document.activeElement; return !!a && panel.contains(a) && (a.tagName === "SELECT" || (a.tagName === "TEXTAREA" && !!a.value)); }
  function picker(bot) {
    const s = node("select", "in");
    s.dataset.o3Move = bot.id;
    s.setAttribute("aria-label", "Business for " + bot.name);
    for (const p of PLACES) { const o = node("option", "", (p.small ? "PermitAIO · " : "") + p.name); o.value = p.id; s.appendChild(o); }
    s.value = store.of(bot);
    return s;
  }
  function drawTeam() {
    if (team.hidden || busy(team)) return;                                   // do not redraw under an open picker
    team.textContent = "";
    const h = node("h2", "", "Team "); h.append(node("span", "n", String(roster.length)), btn("sm x", "Close", { o3: "team-close" }));
    team.append(h, node("p", "dim", "Tap a name to walk to them. Use the menu to choose their business."));
    for (const b of [...roster].sort((a, c) => String(a.name).localeCompare(String(c.name)))) {
      const r = node("div", "o3-pick"), go = node("button", "who");
      go.dataset.o3 = "goto"; go.dataset.id = b.id;
      const name = node("b", "", b.name); name.prepend(node("i", "st " + modeOf(b)));
      go.append(name, node("span", "", b.role || ""));
      r.append(go, picker(b));
      team.appendChild(r);
    }
  }
  function drawCard() {
    card.textContent = "";
    const head = node("div", "hd"), who = node("div", "who"), row = node("div", "row"), close = btn("sm ghost", "✕", { o3: "card-close" });
    close.setAttribute("aria-label", "Close");
    if (shown === "quest") {
      const claimed = prog && prog.quest_done && String(prog.quest_date) === today();
      who.append(node("b", "", "Daily quest"), node("span", "", "Resets every day · +150 XP"));
      head.append(node("i", "st idle"), who, close);
      card.append(head, node("p", "", (prog && prog.quest) || "No quest set yet."));
      if (claimed) row.append(node("span", "chip go", "Claimed today")); else row.append(btn("ok", "Claim +150 XP", { act: "quest" }));
      card.append(row); card.hidden = false;
      return;
    }
    const b = roster.find(x => x.id === shown);
    if (!b) { card.hidden = true; return; }
    const mode = modeOf(b), move = node("label", "mv", "Works for ");
    who.append(node("b", "", b.name), node("span", "", [b.role, PLAT_NAME[b.platform] || "", mode].filter(Boolean).join(" · ")));
    head.append(node("i", "st " + mode), who, close);
    move.appendChild(picker(b));
    row.append(btn("pri", "Talk", { act: "chat", id: b.id }), btn("", "Profile", { act: "bot", id: b.id }), move);
    card.append(head);
    if (b.status_line) card.append(node("p", "", String(b.status_line).slice(0, 160)));
    card.append(row); card.hidden = false;
  }
  function drawFile() {
    if (file.hidden || busy(file)) return;                                   // do not wipe what you are typing
    const p = placeOfId(place), notes = store.notes(place), staff = roster.filter(b => store.of(b) === place);
    file.textContent = ""; file.style.setProperty("--c", p.c);
    const h = node("h2", "", p.name + " "); h.append(btn("sm", "Close", { o3: "file-close" }));
    file.append(h);
    if (p.sub) file.append(node("p", "dim", p.sub));
    const crew = node("div", "row crew");
    if (!staff.length) crew.append(node("span", "dim", "No agents assigned yet. Use Team to add some."));
    for (const b of staff) crew.append(btn("sm ghost", b.name, { o3: "goto", id: b.id }));
    file.append(crew);
    if (!notes) { const lock = node("div", "empty", "Enter your owner key to see and add goals, notes, ideas and materials. "); lock.append(btn("sm", "Enter key", { act: "key" })); file.append(lock); return; }
    for (const [kind, title] of KINDS) {
      const list = notes.filter(n => n.kind === kind), sec = node("h3", "", title + " "); sec.append(node("span", "n", list.length ? String(list.length) : ""));
      file.append(sec);
      for (const n of list) {
        const it = node("div", "o3-note"), text = node("div", "tx");
        for (const part of String(n.body).split(/(https?:\/\/[^\s]+)/)) {                     // links in materials open in a new tab
          if (/^https?:\/\//.test(part)) { const a = node("a", "", part); a.href = part; a.target = "_blank"; a.rel = "noopener noreferrer"; text.append(a); } else text.append(part);
        }
        const x = btn("sm ghost", "✕", { o3: "note-del", id: n.id }); x.setAttribute("aria-label", "Delete");
        it.append(text, x); file.append(it);
      }
      if (!list.length) file.append(node("div", "empty", "Nothing yet."));
    }
    const add = node("div", "o3-add"), kind = node("select", "in"), text = node("textarea", "in");
    for (const [k, title] of KINDS) { const o = node("option", "", title.replace(/s$/, "")); o.value = k; kind.append(o); }
    kind.value = "note"; text.rows = 2; text.placeholder = "Add a goal, note, idea or material (a link works too)…";
    add.append(kind, text, btn("pri", "Add", { o3: "note-add" }));
    file.append(add);
  }
  function pop(text) {
    const p = node("div", "o3-pop", text);
    root.appendChild(p);
    setTimeout(() => p.remove(), 1900);
  }
  root.addEventListener("change", e => {
    const id = e.target && e.target.dataset && e.target.dataset.o3Move;
    if (id) { e.target.blur(); store.setRoom(id, e.target.value); }
  });

  return {
    sync(bots, progress) {
      roster = bots;
      if (progress) {
        prog = progress;
        const n = Number(prog.xp) || 0;
        xp.textContent = "LV " + (Math.floor(n / 100) + 1) + " · " + (n % 100) + "/100 XP"; xp.hidden = false;
        if (lastXp !== null && n > lastXp) pop("+" + (n - lastXp) + " XP");
        lastXp = n;
      }
      drawTeam(); drawFile();
      if (shown) drawCard();
    },
    showBot(id) { shown = id; drawCard(); },
    showQuest() { shown = "quest"; drawCard(); },
    hideCard() { shown = null; card.hidden = true; },
    openTeam() { team.hidden = false; drawTeam(); team.scrollTop = 0; },
    closeTeam() { team.hidden = true; },
    openFile(id) { place = id; file.hidden = false; if (busy(file)) document.activeElement.blur(); drawFile(); file.scrollTop = 0; },
    closeFile() { file.hidden = true; },
    async addNote() {
      const text = file.querySelector("textarea"), kind = file.querySelector(".o3-add select");
      if (!text || !text.value.trim()) return;
      if (await store.addNote(place, kind.value, text.value.trim())) { text.value = ""; drawFile(); }
    },
  };
}

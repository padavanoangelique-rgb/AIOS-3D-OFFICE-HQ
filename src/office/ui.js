/* AIOS 3D city: the agent card (Talk / Profile / Move to...), the Rooms list, and the level badge.
   Talk and Profile press the dashboard's own buttons, so chat and the drawer are the existing ones. */
import { PLACES, PLAT_NAME } from "./data.js";
import { modeOf } from "./anim.js";

function node(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function picker(bot, rooms) {
  const s = node("select", "in");
  s.dataset.o3Move = bot.id;
  s.setAttribute("aria-label", "Building for " + bot.name);
  for (const p of PLACES) { const o = node("option", "", p.id === "lobby" ? "Lobby (not placed)" : (p.small ? "PermitAIO · " : "") + p.name); o.value = p.id; s.appendChild(o); }
  s.value = rooms.of(bot);
  return s;
}

export function createUI(root, rooms) {
  const card = node("div", "o3-card"), sheet = node("div", "o3-sheet"), xp = node("div", "o3-xp");
  card.hidden = sheet.hidden = xp.hidden = true;
  root.append(card, sheet, xp);
  let roster = [], shown = null, listOpen = false;

  function drawCard() {
    const b = roster.find(x => x.id === shown);
    if (!b) { card.hidden = true; return; }
    const mode = modeOf(b), head = node("div", "hd"), who = node("div", "who"), row = node("div", "row");
    const dot = node("i", "st " + mode);
    who.append(node("b", "", b.name), node("span", "", [b.role, PLAT_NAME[b.platform] || "", mode].filter(Boolean).join(" · ")));
    const x = node("button", "btn sm ghost", "✕"); x.dataset.o3 = "card-close"; x.setAttribute("aria-label", "Close");
    head.append(dot, who, x);
    const talk = node("button", "btn pri", "Talk"), prof = node("button", "btn", "Profile");
    talk.dataset.act = "chat"; talk.dataset.id = b.id; prof.dataset.act = "bot"; prof.dataset.id = b.id;
    const move = node("label", "mv", "Office in "); move.appendChild(picker(b, rooms));
    row.append(talk, prof, move);
    card.textContent = "";
    card.append(head);
    if (b.status_line) card.append(node("p", "", String(b.status_line).slice(0, 160)));
    card.append(row);
    card.hidden = false;
  }
  function drawList() {
    sheet.textContent = "";
    const h = node("h2", "", "Rooms "), x = node("button", "btn sm", "Close");
    x.dataset.o3 = "rooms-close"; h.appendChild(x);
    sheet.append(h, node("p", "dim", "Choose a building for each agent. Each one gets its own office inside it."));
    for (const b of [...roster].sort((a, c) => String(a.name).localeCompare(String(c.name)))) {
      const r = node("div", "o3-pick"), who = node("div", "who");
      who.append(node("b", "", b.name), node("span", "", b.role || ""));
      r.append(who, picker(b, rooms));
      sheet.appendChild(r);
    }
  }
  root.addEventListener("change", e => {
    const id = e.target && e.target.dataset && e.target.dataset.o3Move;
    if (id) rooms.set(id, e.target.value);
  });

  return {
    sync(bots, prog) {
      roster = bots;
      if (shown) drawCard();
      if (listOpen && !sheet.contains(document.activeElement)) drawList();   // do not redraw under an open picker
      if (prog) { const n = Number(prog.xp) || 0; xp.textContent = "LV " + (Math.floor(n / 100) + 1) + " · " + (n % 100) + "/100 XP"; xp.hidden = false; }
    },
    showBot(id) { shown = id; drawCard(); },
    hideBot() { shown = null; card.hidden = true; },
    openList() { listOpen = true; drawList(); sheet.hidden = false; sheet.scrollTop = 0; },
    closeList() { listOpen = false; sheet.hidden = true; },
  };
}

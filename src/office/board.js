/* AIOS 3D office: the decision whiteboard on the back wall.
   Shows the same open decisions as the dashboard, glows with a badge when something needs an answer,
   and opens a sheet whose buttons are the dashboard's own Approve / Decline / Answer / Chat actions. */
import * as THREE from "./three.js";
import { DIV, divColor } from "./data.js";
import { block } from "./scene.js";

const BX = 12.5, BY = 2.75, BZ = -0.57, BW = 7.6, BH = 2.7, ROWS = 4;
function span(ms) { const m = Math.round(Math.abs(ms) / 6e4); if (m < 60) return m + "m"; const h = Math.floor(m / 60); if (h < 24) return h + "h " + (m % 60) + "m"; return Math.floor(h / 24) + "d " + (h % 24) + "h"; }
function due(d) { if (!d) return { text: "", late: false }; const ms = Date.parse(d) - Date.now(); return { text: ms < 0 ? "Overdue " + span(ms) : "Due in " + span(ms), late: ms < 0 }; }
function node(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

export function createBoard(office, root) {
  const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let dec = [], roster = [], open = false;

  /* ---- the board itself: a canvas drawn as a texture ---- */
  block(office.scene, 0x6d4bb0, BW + 0.3, BH + 0.3, 0.08, BX, BY, BZ - 0.05);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(BW + 1.2, BH + 1.2), new THREE.MeshBasicMaterial({ color: 0xff5f6e, transparent: true, opacity: 0, depthWrite: false }));
  halo.position.set(BX, BY, BZ - 0.105);
  office.scene.add(halo);
  const cv = document.createElement("canvas");
  cv.width = 1024; cv.height = 364;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshBasicMaterial({ map: tex }));
  face.position.set(BX, BY, BZ);
  face.userData.tap = { board: true };
  office.scene.add(face); office.picks.push(face);

  const badgeEl = node("div", "o3-badge");
  const badge = office.addLabel(badgeEl, new THREE.Vector3(BX + BW / 2, BY + BH / 2, BZ), "-50%,-50%");

  function fit(g, text, max) {
    if (g.measureText(text).width <= max) return text;
    let s = text;
    while (s.length > 1 && g.measureText(s + "…").width > max) s = s.slice(0, -1);
    return s.trimEnd() + "…";
  }
  function draw() {
    const g = cv.getContext("2d"), W = cv.width, H = cv.height, PX = '"Silkscreen", monospace', SANS = '600 30px "Inter", system-ui, sans-serif';
    g.fillStyle = "#f4eefc"; g.fillRect(0, 0, W, H);
    g.textBaseline = "middle"; g.textAlign = "left";
    g.font = "28px " + PX; g.fillStyle = "#3a1d6e"; g.fillText("DECISION QUEUE", 28, 40);
    g.textAlign = "right"; g.fillStyle = dec.length ? "#d42c45" : "#1f9d5b";
    g.fillText(dec.length ? dec.length + " NEED YOU" : "ALL CLEAR", W - 28, 40);
    g.fillStyle = "#cdbdea"; g.fillRect(28, 68, W - 56, 3);
    if (!dec.length) {
      g.textAlign = "center"; g.font = SANS; g.fillStyle = "#6d5a96";
      g.fillText("Nothing needs you right now.", W / 2, 200);
    }
    dec.slice(0, ROWS).forEach((d, i) => {
      const y = 108 + i * 60, when = due(d.due_at);
      g.fillStyle = divColor(d.division); g.fillRect(28, y - 13, 26, 26);
      g.strokeStyle = "#3a1d6e"; g.lineWidth = 2; g.strokeRect(28, y - 13, 26, 26);
      g.textAlign = "right"; g.font = "20px " + PX; g.fillStyle = when.late ? "#d42c45" : "#6d5a96";
      const wt = when.text.toUpperCase(), room = W - 70 - 28 - (wt ? g.measureText(wt).width + 30 : 0);
      g.fillText(wt, W - 28, y);
      g.textAlign = "left"; g.font = SANS; g.fillStyle = "#1b1030";
      g.fillText(fit(g, String(d.title || ""), room), 70, y);
    });
    if (dec.length) {
      g.textAlign = "right"; g.font = "18px " + PX; g.fillStyle = "#8b78b3";
      g.fillText((dec.length > ROWS ? "+" + (dec.length - ROWS) + " MORE · " : "") + "TAP TO OPEN", W - 28, H - 20);
    }
    tex.needsUpdate = true;
    office.invalidate();
  }
  /* The board uses the page's fonts; draw again once they have loaded. */
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('28px "Silkscreen"'), document.fonts.load('600 30px "Inter"')]).then(draw, () => {});

  /* ---- the sheet: real buttons, handled by the dashboard itself ---- */
  const sheet = node("div", "o3-sheet");
  sheet.hidden = true;
  root.appendChild(sheet);
  function button(cls, text, act, id, state) {
    const b = node("button", "btn " + cls, text);
    b.dataset.act = act; b.dataset.id = id;
    if (state) b.dataset.state = state;
    return b;
  }
  function renderSheet() {
    sheet.textContent = "";
    const h = node("h2", "", "Waiting on you ");
    h.appendChild(node("span", "n", dec.length ? String(dec.length) : ""));
    const x = node("button", "btn sm", "Close"); x.dataset.o3 = "sheet-close"; h.appendChild(x);
    sheet.appendChild(h);
    if (!dec.length) sheet.appendChild(node("div", "empty", "Nothing needs you right now."));
    for (const d of dec) {
      const c = divColor(d.division), when = due(d.due_at), bot = roster.find(b => b.name === d.bot || b.id === d.bot);
      const card = node("div", "card"); card.style.setProperty("--c", c);
      const meta = node("div", "meta"), tag = node("span", "tag", (DIV[d.division] || {}).s || d.division || "");
      tag.style.setProperty("--c", c);
      meta.append(tag, node("span", "", d.bot || ""), node("span", "sp"), node("span", when.late ? "bad" : "", when.text));
      const row = node("div", "row");
      if (d.kind === "answer") row.appendChild(button("pri", "Answer", "answer", d.id));
      else if (d.kind === "done") row.appendChild(button("ok", "Mark done", "resolve", d.id, "done"));
      else row.append(button("ok", "Approve", "resolve", d.id, "approved"), button("no", "Decline", "resolve", d.id, "declined"));
      if (bot) row.appendChild(button("ghost", "Chat", "chat", bot.id));
      card.append(meta, node("div", "ttl", d.title || ""), row);
      sheet.appendChild(card);
    }
  }

  office.onTick(t => { if (dec.length) halo.material.opacity = calm ? 0.5 : 0.4 + 0.3 * Math.sin(t * 4.5); });

  return {
    get glowing() { return dec.length > 0 && !calm; },
    /* Call after every read of the decision queue. */
    sync(decisions, bots) {
      dec = decisions; roster = bots;
      badgeEl.textContent = String(dec.length);
      badge.hidden = !dec.length;
      halo.visible = dec.length > 0;
      draw();
      if (open) renderSheet();
      office.relabel();
    },
    open() { open = true; renderSheet(); sheet.hidden = false; sheet.scrollTop = 0; },
    close() { open = false; sheet.hidden = true; },
  };
}

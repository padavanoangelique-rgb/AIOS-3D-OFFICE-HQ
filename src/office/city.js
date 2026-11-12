/* AIOS 3D city: one building per business, and inside each building a private office for every agent.
   Which building an agent sits in comes from rooms.js (your choice). Agents with no building wait in the lobby. */
import * as THREE from "./three.js";
import { PLACES, PLAT } from "./data.js";
import { block, mat, mix, batcher } from "./scene.js";
import { modeOf } from "./anim.js";

const SKIN = ["#f6d3b3", "#e9b98f", "#c98d62", "#8d5a3a", "#f1c7a5"], HAIR = ["#2a1b12", "#5a3a1c", "#d8a657", "#111111", "#7a2e1d", "#c9c9d6"];
const DARK = 0x15102a, CHAIR = 0x2c1e4d, PANTS = 0x221636, LAMP_ON = 0xffd98a, LAMP_OFF = 0x2a2140, BASE = 0x170e2b;
const CW = 2.6, CD = 2.8, PAD = 0.45;                 // one private office: width, depth; margin around a building
function hash(s) { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
const shortName = b => String(b.name || b.id).split(/[ -]/)[0].slice(0, 10);
const hitShape = new THREE.BoxGeometry(1.6, 1.7, 2), unseen = new THREE.MeshBasicMaterial({ visible: false });

/* Head, torso and arms. Used for every agent and for your own character. Returns the parts that animate. */
export function person(parent, shirt, skin, hair, crown) {
  const rig = new THREE.Group(), head = new THREE.Group();
  parent.add(rig); rig.add(head);
  block(rig, shirt, 0.4, 0.46, 0.24, 0, 0.3, 0);
  block(head, skin, 0.32, 0.32, 0.3, 0, 0.72, 0);
  block(head, hair, 0.34, 0.1, 0.32, 0, 0.9, 0);
  block(head, hair, 0.34, 0.22, 0.06, 0, 0.78, -0.15);
  block(head, 0x1a1024, 0.05, 0.05, 0.02, 0.08, 0.74, 0.155);
  block(head, 0x1a1024, 0.05, 0.05, 0.02, -0.08, 0.74, 0.155);
  if (crown) { block(head, 0xffc94d, 0.3, 0.06, 0.28, 0, 0.98, 0, true); for (const x of [-0.11, 0, 0.11]) block(head, 0xffc94d, 0.06, 0.08, 0.06, x, 1.04, 0, true); }
  const arms = [-1, 1].map(s => {
    const a = new THREE.Group();
    a.position.set(s * 0.25, 0.48, 0);
    block(a, mix(shirt, 0x000000, 0.25), 0.1, 0.34, 0.1, 0, -0.15, 0);
    block(a, skin, 0.1, 0.08, 0.1, 0, -0.35, 0);
    rig.add(a);
    return a;
  });
  return { rig, head, arms };
}

/* Small per-platform touch so you can tell Grok, Claude, Codex, Nova and Hermes apart at a glance. */
function flair(rig, head, platform) {
  const c = PLAT[platform] || PLAT.other;
  block(rig, c, 0.1, 0.1, 0.03, 0.1, 0.4, 0.125, true);                                   // chest badge
  if (platform === "claude") block(head, c, 0.36, 0.07, 0.34, 0, 0.83, 0);                // headband
  else if (platform === "codex") block(head, c, 0.34, 0.08, 0.05, 0, 0.75, 0.16, true);   // visor
  else if (platform === "nova") { block(head, 0x6d6187, 0.03, 0.16, 0.03, 0, 1.02, 0); block(head, c, 0.1, 0.1, 0.1, 0, 1.13, 0, true); }   // antenna
  else if (platform === "hermes") { block(head, c, 0.05, 0.16, 0.16, 0.2, 0.86, -0.02); block(head, c, 0.05, 0.16, 0.16, -0.2, 0.86, -0.02); } // wings
}

/* One agent at a desk. x / z is the chair. */
function station(office, group, fixed, b, x, z, c) {
  const h = hash(b.id), skin = SKIN[h % SKIN.length], hair = HAIR[(h >> 3) % HAIR.length] || "#0b0b0b";   // same pick as the 2D avatars
  const put = (color, w, hh, d, dx, y, dz) => fixed.add(color, w, hh, d, x + dx, y, z + dz);
  put(0x3a2a5c, 1.4, 0.07, 0.7, 0, 0.72, 0.85);
  put(0x241840, 0.07, 0.7, 0.62, 0.64, 0.35, 0.85);
  put(0x241840, 0.07, 0.7, 0.62, -0.64, 0.35, 0.85);
  put(DARK, 0.44, 0.03, 0.3, 0, 0.77, 0.8);
  put(0x6d6187, 0.04, 0.2, 0.04, 0.55, 0.85, 0.62);
  put(CHAIR, 0.5, 0.08, 0.5, 0, 0.42, 0);
  put(CHAIR, 0.5, 0.56, 0.08, 0, 0.72, -0.25);
  put(0x1a1030, 0.08, 0.4, 0.08, 0, 0.2, 0);

  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const lid = block(g, DARK, 0.46, 0.3, 0.03, 0, 0.92, 0.98);
  lid.rotation.x = 0.22;
  const lamp = block(g, LAMP_ON, 0.14, 0.08, 0.14, 0.55, 0.98, 0.62, true);
  const body = new THREE.Group();
  body.position.set(0, 0.46, 0);
  block(body, PANTS, 0.34, 0.14, 0.42, 0, 0.07, 0.2);
  block(body, PANTS, 0.34, 0.4, 0.13, 0, -0.13, 0.36);
  const p = person(body, c, skin, hair, b.is_head);
  p.arms.forEach(a => { a.rotation.x = -1.1; });
  flair(p.rig, p.head, b.platform);
  g.add(body);
  const hit = new THREE.Mesh(hitShape, unseen);            // roomy invisible box so a fingertip can hit the agent
  hit.position.set(0, 0.85, 0.4);
  hit.userData.tap = { bot: b.id };
  g.add(hit);
  office.picks.push(hit);
  group.add(g);

  const nameEl = document.createElement("div");
  nameEl.className = "o3-name";
  nameEl.appendChild(document.createElement("i"));
  nameEl.appendChild(document.createTextNode(shortName(b)));
  const label = office.addLabel(nameEl, new THREE.Vector3(x, 0, z + 1.35), "-50%,0");
  return { id: b.id, bot: b, x, z, color: c, phase: (h % 628) / 100, g, body, rig: p.rig, head: p.head, arms: p.arms, lid, lamp, hit, label, nameEl, LAMP_ON, LAMP_OFF, DARK };
}

export function createCity(office) {
  const items = new Map(), signs = [];
  let group = null, layout = "", bounds = null;

  function clear() {
    if (group) { office.scene.remove(group); group.traverse(m => { if (m.isInstancedMesh) m.dispose(); }); group = null; }
    for (const it of items.values()) {
      office.removeLabel(it.label);
      if (it.bubble) office.removeLabel(it.bubble);
      const i = office.picks.indexOf(it.hit);
      if (i >= 0) office.picks.splice(i, 1);
    }
    for (const s of signs) office.removeLabel(s.label);
    items.clear(); signs.length = 0;
  }

  function build(bots, roomOf) {
    group = new THREE.Group();
    const fixed = batcher();
    bounds = { x0: -8, x1: 8, z0: -8, z1: 8 };
    for (const place of PLACES) {
      const lobby = place.id === "lobby", c = place.c;
      const staff = bots.filter(b => roomOf(b) === place.id).sort((a, b) => (b.is_head ? 1 : 0) - (a.is_head ? 1 : 0) || String(a.name).localeCompare(String(b.name)));
      const cols = Math.max(lobby ? 3 : place.small ? 1 : 2, Math.min(staff.length, lobby ? 5 : place.small ? 2 : 3)), rows = Math.max(1, Math.ceil(staff.length / cols));
      const w = cols * CW + PAD * 2, d = rows * CD + PAD * 2, x0 = place.x - w / 2, z0 = lobby ? place.z : place.z - d / 2, cx = place.x, cz = z0 + d / 2;
      bounds.x0 = Math.min(bounds.x0, x0 - 1); bounds.x1 = Math.max(bounds.x1, x0 + w + 1); bounds.z0 = Math.min(bounds.z0, z0 - 1); bounds.z1 = Math.max(bounds.z1, z0 + d + 1);

      fixed.add(mix(BASE, c, 0.1), w + 0.5, 0.3, d + 0.5, cx, -0.15, cz);                       // island slab
      fixed.add(mix(BASE, c, lobby ? 0.16 : 0.3), w, 0.04, d, cx, 0.02, cz);                    // floor
      fixed.add(c, w + 0.5, 0.05, 0.07, cx, 0, z0 + d + 0.25, true);                            // neon edge, front
      fixed.add(c, 0.07, 0.05, d + 0.5, x0 + w + 0.25, 0, cz, true);                            // neon edge, right
      if (!lobby) {
        const wall = mix(c, 0x1a1030, 0.42);
        fixed.add(wall, w, 1.8, 0.14, cx, 0.9, z0 + 0.07);                                      // back wall
        fixed.add(wall, 0.14, 1.8, d, x0 + 0.07, 0.9, cz);                                      // left wall
        fixed.add(c, w, 0.05, 0.16, cx, 1.83, z0 + 0.07, true);
        fixed.add(c, 0.16, 0.05, d, x0 + 0.07, 1.83, cz, true);
        fixed.add(0x3b2a1c, 0.3, 0.36, 0.3, x0 + w - 0.4, 0.2, z0 + 0.5);                       // plant pot + leaves
        fixed.add(0x2fbf71, 0.42, 0.42, 0.42, x0 + w - 0.4, 0.62, z0 + 0.5);
        fixed.add(0x4dff9a, 0.26, 0.26, 0.26, x0 + w - 0.48, 0.92, z0 + 0.44);
        const len = Math.hypot(cx, cz + 1.5);                                                   // lit path to the lobby
        fixed.add(0x3a2760, 0.22, 0.02, Math.max(0, len - 4), cx / 2, -0.27, (cz - 1.5) / 2, true, Math.atan2(cx, cz + 1.5));
      }
      staff.forEach((b, i) => {
        const col = i % cols, row = Math.floor(i / cols), ox = x0 + PAD + col * CW, oz = z0 + PAD + row * CD;
        if (!lobby) {                                                                            // each agent's own office: two low walls and a rug
          const part = mix(c, 0x1a1030, 0.62);
          if (row > 0) fixed.add(part, CW - 0.1, 1.05, 0.08, ox + CW / 2, 0.52, oz);
          if (col > 0) fixed.add(part, 0.08, 1.05, CD - 0.5, ox, 0.52, oz + CD / 2 - 0.25);
        }
        fixed.add(mix(BASE, c, 0.42), CW - 0.7, 0.02, CD - 0.9, ox + CW / 2, 0.05, oz + CD / 2);
        items.set(b.id, station(office, group, fixed, b, ox + CW / 2, oz + CD / 2 - 0.55, c));
      });

      const el = document.createElement("div"), title = document.createElement("b"), note = document.createElement("small");
      el.className = "o3-bld" + (place.small ? " small" : ""); el.style.setProperty("--c", c);
      const full = document.createElement("span"), brief = document.createElement("span");
      full.className = "full"; full.textContent = place.name; brief.className = "brief"; brief.textContent = place.short;
      title.append(full, brief); el.append(title, note);
      signs.push({ place, staff, note, label: office.addLabel(el, new THREE.Vector3(cx, lobby ? 0.4 : 2.1, lobby ? z0 + d + 0.6 : z0), lobby ? "-50%,0" : "-50%,-100%") });
    }
    fixed.build(group);
    office.scene.add(group);
    office.setBounds(bounds);
  }

  return {
    items,
    /* Call with the roster every time it is read. Rebuilds the city only when the roster or your room choices changed. */
    sync(bots, roomOf) {
      const sig = bots.map(b => [b.id, roomOf(b), b.name, b.platform, b.is_head ? 1 : 0].join("|")).sort().join(",");
      if (sig !== layout) { clear(); layout = sig; build(bots, roomOf); }
      for (const b of bots) { const it = items.get(b.id); if (it) it.bot = b; }
      for (const s of signs) {
        const live = s.staff.map(b => items.get(b.id)).filter(Boolean).map(it => modeOf(it.bot));
        const busy = live.filter(m => m === "working").length, n = live.length;
        s.note.textContent = n ? n + (n === 1 ? " agent" : " agents") + (busy ? " · " + busy + " working" : "") : s.place.id === "lobby" ? "Everyone has a room" : "No one here yet";
      }
      office.relabel();
    },
  };
}

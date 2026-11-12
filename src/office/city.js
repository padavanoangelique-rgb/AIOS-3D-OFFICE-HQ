/* AIOS 3D city: a neon night city. In the middle is the HQ office, where every agent has a private room.
   Around it stands one real building per business. Everything that never moves is drawn in a few batches. */
import * as THREE from "./three.js";
import { BUILDINGS, PLACES, PLAT, placeOfId } from "./data.js";
import { block, mix, batcher } from "./scene.js";
import { modeOf } from "./anim.js";

const SKIN = ["#f6d3b3", "#e9b98f", "#c98d62", "#8d5a3a", "#f1c7a5"], HAIR = ["#2a1b12", "#5a3a1c", "#d8a657", "#111111", "#7a2e1d", "#c9c9d6"];
const DARK = 0x15102a, CHAIR = 0x2c1e4d, PANTS = 0x221636, LAMP_ON = 0xffd98a, LAMP_OFF = 0x2a2140, BASE = 0x170e2b, HQ = "#b98cff";
const CW = 2.6, CD = 2.8, PAD = 0.45, BACK = -6;       // one private room: width, depth; margin; where the HQ back wall stands
export const ROAD = { x: 13.2, back: -11.4, front: 18.6 };   // the ring road around the HQ block
function hash(s) { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
const shortName = b => String(b.name || b.id).split(/[ -]/)[0].slice(0, 10);
const hitShape = new THREE.BoxGeometry(1.6, 1.7, 2), cube = new THREE.BoxGeometry(1, 1, 1), unseen = new THREE.MeshBasicMaterial({ visible: false });

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
/* A standing figure that can walk: you, and agents out for a stroll. */
export function walker(shirt, skin, hair, crown) {
  const g = new THREE.Group(), top = new THREE.Group();
  const legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * 0.1, 0.6, 0); block(l, PANTS, 0.15, 0.6, 0.17, 0, -0.3, 0); g.add(l); return l; });
  top.position.y = 0.58; g.add(top);
  const p = person(top, shirt, skin, hair, crown);
  return { g, top, legs, arms: p.arms, rig: p.rig, head: p.head };
}
/* Walking pose at time t; pace 0 = standing still. */
export function stride(w, t, pace) {
  const s = pace ? Math.sin(t * pace) * 0.7 : 0;
  w.legs[0].rotation.x = s; w.legs[1].rotation.x = -s; w.arms[0].rotation.x = -s * 0.8; w.arms[1].rotation.x = s * 0.8;
  w.top.position.y = 0.58 + (pace ? Math.abs(Math.sin(t * pace)) * 0.04 : 0);
}

/* Small per-platform touch so you can tell Grok, Claude, Codex, Nova and Hermes apart at a glance. */
export function flair(rig, head, platform) {
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
  return { id: b.id, bot: b, x, z, color: c, skin, hair, phase: (h % 628) / 100, g, body, rig: p.rig, head: p.head, arms: p.arms, lid, lamp, hit, label, nameEl, LAMP_ON, LAMP_OFF, DARK };
}

/* Streets, street lights, the skyline and trees. Always the same, so the city feels like a place. */
function scenery(fixed) {
  const R = ROAD, road = 0x1b1330, dash = 0x4a3a78;
  let seed = 20261111;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const lane = (x, z, len, alongX) => {
    fixed.add(road, alongX ? len : 2.6, 0.04, alongX ? 2.6 : len, x, -0.27, z);
    for (let s = -len / 2 + 1; s < len / 2; s += 2.4) fixed.add(dash, alongX ? 0.9 : 0.1, 0.02, alongX ? 0.1 : 0.9, alongX ? x + s : x, -0.24, alongX ? z : z + s, true);
  };
  lane(0, R.back, 130, true); lane(0, R.front, 130, true); lane(-R.x, 0, 130, false); lane(R.x, 0, 130, false);
  for (const x of [-R.x, R.x]) for (let z = R.back + 3; z < R.front; z += 7.4) {                 // street lights along the ring
    const sx = x + (x < 0 ? 1.7 : -1.7);
    fixed.add(0x2a2140, 0.09, 2, 0.09, sx, 0.7, z); fixed.add(0xffd98a, 0.3, 0.12, 0.3, sx, 1.76, z, true);
  }
  for (let x = -9; x <= 9; x += 6) for (const z of [R.back + 1.7, R.front - 1.7]) { fixed.add(0x2a2140, 0.09, 2, 0.09, x, 0.7, z); fixed.add(0xffd98a, 0.3, 0.12, 0.3, x, 1.76, z, true); }

  /* skyline: dark towers with lit floors, behind and beside the city, never in front of the camera */
  const tints = [0x120b22, 0x161030, 0x1b1338], lights = [0x6b4fd8, 0x2f9fd0, 0xd0468f, 0xc99a3a, 0x8f7fff];
  const tower = (x, z) => {
    const w = 3 + rnd() * 3.5, d = 3 + rnd() * 3.5, h = 7 + rnd() * rnd() * 26, glow = lights[Math.floor(rnd() * lights.length)];
    fixed.add(tints[Math.floor(rnd() * tints.length)], w, h, d, x, h / 2 - 0.3, z);
    for (let y = 1.4; y < h - 1; y += 1.7) if (rnd() < 0.6) fixed.add(glow, w + 0.05, 0.16, d + 0.05, x, y, z, true);
    if (h > 18) fixed.add(0xff5f6e, 0.25, 0.25, 0.25, x, h - 0.1, z, true);
  };
  for (let x = -62; x <= 62; x += 7.5) for (const z of [-30, -39, -49]) if (rnd() < 0.85) tower(x + rnd() * 3 - 1.5, z + rnd() * 3 - 1.5);
  for (const side of [-1, 1]) for (let z = -22; z <= 26; z += 8) for (const x of [33, 42, 52]) if (rnd() < 0.8) tower(side * (x + rnd() * 3), z + rnd() * 3 - 1.5);

  const tree = (x, z) => { fixed.add(0x3b2a1c, 0.22, 0.9, 0.22, x, 0.15, z); fixed.add(0x1f8f58, 0.95, 0.8, 0.95, x, 0.95, z); fixed.add(0x2fbf71, 0.6, 0.55, 0.6, x + 0.1, 1.5, z - 0.05); };
  for (const [x, z] of [[-16.5, 12.5], [-21.5, 13.5], [-19, 15.5], [16.5, 11.5], [19.5, 13], [22.5, 11.8], [21, 15.4], [17.5, 15.6], [-16, -11.5], [16, -11.5]]) tree(x, z);
}

export function createCity(office) {
  const items = new Map(), signs = [], taps = [];
  let group = null, layout = "", front = BACK + 12;
  const tappable = (x, y, z, w, h, d, tap) => { const m = new THREE.Mesh(cube, unseen); m.scale.set(w, h, d); m.position.set(x, y, z); m.userData.tap = tap; group.add(m); office.picks.push(m); taps.push(m); };

  function clear() {
    if (group) { office.scene.remove(group); group.traverse(m => { if (m.isInstancedMesh) m.dispose(); }); group = null; }
    for (const it of items.values()) { office.removeLabel(it.label); if (it.bubble) office.removeLabel(it.bubble); taps.push(it.hit); }
    for (const m of taps) { const i = office.picks.indexOf(m); if (i >= 0) office.picks.splice(i, 1); }
    for (const s of signs) office.removeLabel(s.label);
    items.clear(); signs.length = 0; taps.length = 0;
  }
  function sign(place, x, y, z, cls) {
    const el = document.createElement("div"), title = document.createElement("b"), note = document.createElement("small");
    el.className = "o3-bld " + (cls || ""); el.style.setProperty("--c", place.c);
    const full = document.createElement("span"), brief = document.createElement("span");
    full.className = "full"; full.textContent = place.name; brief.className = "brief"; brief.textContent = place.short;
    title.append(full, brief); el.append(title, note);
    const s = { place, note, label: office.addLabel(el, new THREE.Vector3(x, y, z)) };
    signs.push(s);
    return s;
  }

  function build(bots, placeOf) {
    group = new THREE.Group();
    const fixed = batcher();
    scenery(fixed);

    /* ---- HQ: every agent's private room. Rooms are grouped and coloured by the business they belong to. ---- */
    const order = id => PLACES.findIndex(p => p.id === id);
    const staff = [...bots].sort((a, b) => order(placeOf(a)) - order(placeOf(b)) || (b.is_head ? 1 : 0) - (a.is_head ? 1 : 0) || String(a.name).localeCompare(String(b.name)));
    const cols = staff.length > 12 ? 6 : staff.length > 6 ? 4 : 3, rows = Math.max(1, Math.ceil(staff.length / cols));
    const w = cols * CW + PAD * 2, d = rows * CD + PAD * 2, x0 = -w / 2, cz = BACK + d / 2, wall = mix(HQ, 0x1a1030, 0.5);
    front = BACK + d;
    fixed.add(mix(BASE, HQ, 0.1), w + 0.6, 0.3, d + 0.6, 0, -0.15, cz);                          // slab + floor
    fixed.add(mix(BASE, HQ, 0.14), w, 0.04, d, 0, 0.02, cz);
    fixed.add(HQ, w + 0.6, 0.05, 0.07, 0, 0, front + 0.3, true); fixed.add(HQ, 0.07, 0.05, d + 0.6, w / 2 + 0.3, 0, cz, true);
    fixed.add(wall, w, 2.4, 0.14, 0, 1.2, BACK); fixed.add(wall, 0.14, 2.4, d, x0, 1.2, cz);    // back and left walls
    fixed.add(HQ, w, 0.05, 0.16, 0, 2.43, BACK, true); fixed.add(HQ, 0.16, 0.05, d, x0, 2.43, cz, true);
    fixed.add(wall, 8.4, 3.2, 0.14, 0, 4, BACK); fixed.add(HQ, 8.4, 0.05, 0.16, 0, 5.62, BACK, true);   // tall panel that carries the decision board
    staff.forEach((b, i) => {
      const col = i % cols, row = Math.floor(i / cols), ox = x0 + PAD + col * CW, oz = BACK + PAD + row * CD, c = placeOfId(placeOf(b)).c, part = mix(c, 0x1a1030, 0.55);
      if (row > 0) fixed.add(part, CW - 0.1, 1.05, 0.08, ox + CW / 2, 0.52, oz);                // each room: two low walls and a rug in its business colour
      if (col > 0) fixed.add(part, 0.08, 1.05, CD - 0.5, ox, 0.52, oz + CD / 2 - 0.25);
      fixed.add(mix(BASE, c, 0.5), CW - 0.5, 0.02, CD - 0.6, ox + CW / 2, 0.05, oz + CD / 2);
      items.set(b.id, station(office, group, fixed, b, ox + CW / 2, oz + CD / 2 - 0.55, c));
    });
    sign({ id: "hq", name: "AIOS HQ", short: "HQ", c: HQ }, x0 + 2.2, 2.6, BACK, "hq").staff = () => staff;

    /* ---- plaza in front of HQ, with the daily quest stand ---- */
    const pz = (front + 0.6 + ROAD.front - 1.6) / 2, pd = ROAD.front - 1.6 - front - 0.6;
    fixed.add(mix(BASE, HQ, 0.07), w + 0.6, 0.06, pd, 0, -0.03, pz);
    for (const x of [-w / 2 + 0.6, w / 2 - 0.6]) for (const z of [front + 1.4, ROAD.front - 2.4]) { fixed.add(0x3b2a1c, 0.5, 0.4, 0.5, x, 0.2, z); fixed.add(0x2fbf71, 0.62, 0.6, 0.62, x, 0.7, z); }
    const q = { x: 5.5, z: Math.min(front + 5.5, ROAD.front - 3.4) };
    fixed.add(0x2c1e4d, 1, 0.9, 1, q.x, 0.45, q.z); fixed.add(0xffc94d, 1.1, 0.06, 1.1, q.x, 0.93, q.z, true); fixed.add(0xffc94d, 0.4, 0.4, 0.4, q.x, 1.45, q.z, true, 0.785);
    tappable(q.x, 1, q.z, 1.8, 2.2, 1.8, { quest: true });
    signs.push({ place: { id: "quest" }, note: null, label: office.addLabel(Object.assign(document.createElement("div"), { className: "o3-bld quest", textContent: "Daily quest" }), new THREE.Vector3(q.x, 2.05, q.z)) });

    /* ---- one real building per business ---- */
    for (const b of BUILDINGS) {
      const top = b.h - 0.3, shell = mix(0x120b22, b.c, 0.2), fz = b.z + b.d / 2;
      fixed.add(shell, b.w, b.h, b.d, b.x, b.h / 2 - 0.3, b.z);
      for (let y = 1.9; y < top - 0.5; y += 1.15) fixed.add(y % 2.3 < 1.15 ? b.c : 0xffd98a, b.w + 0.05, 0.2, b.d + 0.05, b.x, y, b.z, true);   // lit floors
      fixed.add(b.c, b.w + 0.2, 0.08, b.d + 0.2, b.x, top, b.z, true);                                 // neon roof line
      fixed.add(mix(shell, 0x000000, 0.3), b.w * 0.5, 0.5, b.d * 0.5, b.x, top + 0.25, b.z);
      fixed.add(0xffd98a, 0.9, 1.3, 0.06, b.x, 0.5, fz + 0.01, true);                                  // lit doorway + awning
      fixed.add(b.c, 1.5, 0.1, 0.5, b.x, 1.28, fz + 0.25, true);
      tappable(b.x, b.h / 2, b.z, b.w + 0.4, b.h, b.d + 0.4, { place: b.id });
      const s = sign(b, b.x, top + 0.75, fz, b.small ? "small" : "");
      s.staff = () => bots.filter(a => placeOf(a) === b.id);
    }
    fixed.build(group);
    office.scene.add(group);
    office.setBounds({ x0: -23, x1: 24.5, z0: -20.5, z1: ROAD.front + 1 });
    return q;
  }

  let quest = { x: 5.5, z: 12 };
  return {
    items,
    get door() { return { x: 0, z: front + 1 }; },                 // where people step out of HQ onto the plaza
    get quest() { return quest; },
    doorOf(id) { const b = BUILDINGS.find(p => p.id === id); return b ? { x: b.x, z: b.z + b.d / 2 + 1.1 } : null; },
    /* Call with the roster every time it is read. Rebuilds the city only when the roster or your choices changed. */
    sync(bots, placeOf, noteCount) {
      const sig = bots.map(b => [b.id, placeOf(b), b.name, b.platform, b.is_head ? 1 : 0].join("|")).sort().join(",");
      if (sig !== layout) { clear(); layout = sig; quest = build(bots, placeOf); }
      for (const b of bots) { const it = items.get(b.id); if (it) it.bot = b; }
      for (const s of signs) {
        if (!s.staff) continue;
        const team = s.staff(), busy = team.filter(b => modeOf(b) === "working").length, n = team.length, notes = s.place.id === "hq" ? 0 : noteCount(s.place.id);
        s.note.textContent = [n ? n + (n === 1 ? " agent" : " agents") : "No agents yet", busy ? busy + " working" : "", notes ? notes + (notes === 1 ? " note" : " notes") : ""].filter(Boolean).join(" · ");
      }
      office.relabel();
    },
  };
}

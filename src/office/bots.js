/* AIOS 3D office: one desk and one low-poly character per bot on the roster, grouped by division.
   Seats follow the same order as the 2D dashboard (division head first, then by name). */
import * as THREE from "./three.js";
import { ROOMS, PLAT, divColor } from "./data.js";
import { block, mat, mix } from "./scene.js";

const SKIN = ["#f6d3b3", "#e9b98f", "#c98d62", "#8d5a3a", "#f1c7a5"], HAIR = ["#2a1b12", "#5a3a1c", "#d8a657", "#111111", "#7a2e1d", "#c9c9d6"];
const DARK = 0x15102a, CHAIR = 0x2c1e4d, PANTS = 0x221636, LAMP_ON = 0xffd98a, LAMP_OFF = 0x2a2140;
function hash(s) { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; }
const shortName = b => String(b.name || b.id).split(/[ -]/)[0].slice(0, 10);

const unit = new THREE.BoxGeometry(1, 1, 1);
function batch(scene, furniture) {
  const by = new Map(), group = new THREE.Group(), o = new THREE.Object3D();
  for (const f of furniture) { if (!by.has(f[0])) by.set(f[0], []); by.get(f[0]).push(f); }
  for (const [color, list] of by) {
    const im = new THREE.InstancedMesh(unit, mat(color), list.length);
    list.forEach((f, i) => { o.scale.set(f[1], f[2], f[3]); o.position.set(f[4], f[5], f[6]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
    im.frustumCulled = false;
    group.add(im);
  }
  scene.add(group);
  return group;
}

function seats(bots) {
  const out = [];
  for (const [div, ox, oz, w, d] of ROOMS) {
    const list = bots.filter(b => b.division === div).sort((a, b) => (b.is_head ? 1 : 0) - (a.is_head ? 1 : 0) || String(a.name).localeCompare(String(b.name)));
    const per = Math.max(1, Math.min(list.length, Math.floor(w / 2))), rows = Math.max(1, Math.ceil(list.length / per));
    list.forEach((bot, i) => {
      const r = Math.floor(i / per), col = i % per, inRow = Math.min(per, list.length - r * per);
      out.push({ bot, x: ox + (col + 0.5) * (w / inRow), z: oz + (rows === 1 ? d / 2 - 0.6 : 1.1 + r * ((d - 2.9) / (rows - 1))) });
    });
  }
  return out;
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

function station(office, seat, furniture) {
  const b = seat.bot, h = hash(b.id), c = divColor(b.division), skin = SKIN[h % SKIN.length], hair = HAIR[(h >> 3) % HAIR.length] || "#0b0b0b";   // same pick as the 2D avatars
  const g = new THREE.Group();
  g.position.set(seat.x, 0, seat.z);

  // desk, chair, laptop base and lamp post never move, so they are drawn in shared batches
  const put = (color, w, h, d, x, y, z) => furniture.push([color, w, h, d, seat.x + x, y, seat.z + z]);
  put(0x3a2a5c, 1.4, 0.07, 0.7, 0, 0.72, 0.85);
  put(0x241840, 0.07, 0.7, 0.62, 0.64, 0.35, 0.85);
  put(0x241840, 0.07, 0.7, 0.62, -0.64, 0.35, 0.85);
  put(DARK, 0.44, 0.03, 0.3, 0, 0.77, 0.8);
  put(0x6d6187, 0.04, 0.2, 0.04, 0.55, 0.85, 0.62);
  put(CHAIR, 0.5, 0.08, 0.5, 0, 0.42, 0);
  put(CHAIR, 0.5, 0.56, 0.08, 0, 0.72, -0.25);
  put(0x1a1030, 0.08, 0.4, 0.08, 0, 0.2, 0);
  const lid = block(g, DARK, 0.46, 0.3, 0.03, 0, 0.92, 0.98);
  lid.rotation.x = 0.22;
  const lamp = block(g, LAMP_ON, 0.14, 0.08, 0.14, 0.55, 0.98, 0.62, true);

  // character: sits on the chair facing the desk. "rig" is everything above the hips, so it can lean.
  const body = new THREE.Group();
  body.position.set(0, 0.46, 0);
  block(body, PANTS, 0.34, 0.14, 0.42, 0, 0.07, 0.2);
  block(body, PANTS, 0.34, 0.4, 0.13, 0, -0.13, 0.36);
  const rig = new THREE.Group();
  body.add(rig);
  block(rig, c, 0.4, 0.46, 0.24, 0, 0.3, 0);
  const head = new THREE.Group();
  rig.add(head);
  block(head, skin, 0.32, 0.32, 0.3, 0, 0.72, 0);
  block(head, hair, 0.34, 0.1, 0.32, 0, 0.9, 0);
  block(head, hair, 0.34, 0.22, 0.06, 0, 0.78, -0.15);
  block(head, 0x1a1024, 0.05, 0.05, 0.02, 0.08, 0.74, 0.155);
  block(head, 0x1a1024, 0.05, 0.05, 0.02, -0.08, 0.74, 0.155);
  if (b.is_head) { block(head, 0xffc94d, 0.3, 0.06, 0.28, 0, 0.98, 0, true); for (const x of [-0.11, 0, 0.11]) block(head, 0xffc94d, 0.06, 0.08, 0.06, x, 1.04, 0, true); }
  const arms = [-1, 1].map(s => {
    const a = new THREE.Group();
    a.position.set(s * 0.25, 0.48, 0);
    block(a, mix(c, 0x000000, 0.25), 0.1, 0.34, 0.1, 0, -0.15, 0);
    block(a, skin, 0.1, 0.08, 0.1, 0, -0.35, 0);
    a.rotation.x = -1.1;
    rig.add(a);
    return a;
  });
  flair(rig, head, b.platform);
  g.add(body);

  // roomy invisible box so a fingertip can hit the bot
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 1.9), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0, 0.85, 0.4);
  hit.userData.tap = { bot: b.id };
  g.add(hit);
  office.picks.push(hit);
  office.scene.add(g);

  const nameEl = document.createElement("div");
  nameEl.className = "o3-name";
  nameEl.appendChild(document.createElement("i"));
  nameEl.appendChild(document.createTextNode(shortName(b)));
  const label = office.addLabel(nameEl, new THREE.Vector3(seat.x, 0, seat.z + 1.3), "-50%,0");

  return { id: b.id, bot: b, x: seat.x, z: seat.z, color: c, phase: (h % 628) / 100, g, body, rig, head, arms, lid, lamp, hit, label, nameEl, LAMP_ON, LAMP_OFF, DARK };
}

export function createBots(office) {
  const items = new Map();
  let layout = "", shared = null;
  function clear() {
    if (shared) { office.scene.remove(shared); shared.children.forEach(m => m.dispose()); shared = null; }
    for (const it of items.values()) {
      office.scene.remove(it.g);
      office.removeLabel(it.label);
      if (it.bubble) office.removeLabel(it.bubble);
      const i = office.picks.indexOf(it.hit);
      if (i >= 0) office.picks.splice(i, 1);
      it.hit.geometry.dispose(); it.hit.material.dispose();
    }
    items.clear();
  }
  /* When zoomed out, name tags would overlap, so they collapse to status dots (see office.css). */
  const overlay = document.querySelector("#office3d .o3-ov"), p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3();
  office.onTick(() => {
    p0.set(9.5, 0, 10).project(office.camera); p1.set(10.5, 0, 10).project(office.camera); p2.set(9.5, 0, 11).project(office.camera);
    const px = Math.max(Math.abs(p1.x - p0.x), Math.abs(p2.x - p0.x)) * overlay.clientWidth / 2;
    overlay.classList.toggle("tiny", px < 30);
  });
  return {
    items,
    /* Call with the roster every time it is read. Rebuilds desks only when the roster itself changed. */
    sync(bots) {
      const sig = bots.map(b => [b.id, b.division, b.name, b.platform, b.is_head ? 1 : 0].join("|")).sort().join(",");
      if (sig !== layout) {
        clear(); layout = sig;
        const furniture = [];
        for (const seat of seats(bots)) items.set(seat.bot.id, station(office, seat, furniture));
        shared = batch(office.scene, furniture);
      }
      for (const b of bots) {
        const it = items.get(b.id);
        if (!it) continue;
        it.bot = b;
        it.nameEl.className = "o3-name " + (["working", "waiting", "idle"].includes(b.status) ? b.status : "");
      }
      office.relabel();
    },
  };
}

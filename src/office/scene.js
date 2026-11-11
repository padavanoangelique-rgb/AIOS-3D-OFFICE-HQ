/* AIOS 3D office: the room, the camera and touch controls.
   Kept cheap for phones: box shapes, two lights, no shadows, and it only redraws when something moves. */
import * as THREE from "./three.js";
import { DIV, ROOMS, divColor } from "./data.js";

const BG = 0x0a0613, DMIN = 6, DMAX = 110, EYE = 0.6;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const unit = new THREE.BoxGeometry(1, 1, 1);
const mats = new Map();
/* Shared materials: one per colour. glow = unlit, used for neon and screens. */
export function mat(color, glow) {
  const k = color + (glow ? "g" : "");
  if (!mats.has(k)) mats.set(k, glow ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color }));
  return mats.get(k);
}
export function block(parent, color, w, h, d, x, y, z, glow) {
  const m = new THREE.Mesh(unit, mat(color, glow));
  m.scale.set(w, h, d); m.position.set(x, y, z); parent.add(m);
  return m;
}
export const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();

function buildShell(scene, addLabel) {
  const g = new THREE.Group();
  scene.add(g);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mat(0x0d0719));
  ground.rotation.x = -Math.PI / 2; ground.position.set(9.5, -0.3, 10); g.add(ground);
  const grid = new THREE.GridHelper(120, 60, 0x2b1c48, 0x1a1030);
  grid.position.set(9.5, -0.29, 10); g.add(grid);

  block(g, 0x1b1130, 20.4, 0.3, 21.4, 9.5, -0.15, 10);                 // floor slab
  block(g, 0x5b3da0, 20.5, 0.05, 0.08, 9.5, 0, 20.72, true);           // neon edge, front
  block(g, 0x5b3da0, 0.08, 0.05, 21.5, 19.72, 0, 10, true);            // neon edge, right
  block(g, 0x5b3da0, 0.08, 0.05, 21.5, -0.72, 0, 10, true);            // neon edge, left

  block(g, 0x1a1030, 20.4, 4.6, 0.3, 9.5, 2.3, -0.85);                 // back wall
  block(g, 0xb98cff, 20.4, 0.06, 0.34, 9.5, 4.63, -0.85, true);        // neon cap
  for (const x of [1.3, 3.7]) {                                        // two night windows
    block(g, 0x3a2760, 1.7, 1.9, 0.08, x, 2.75, -0.68);
    block(g, 0x2a1670, 1.5, 1.7, 0.1, x, 2.75, -0.67, true);
    block(g, 0x3a2760, 0.07, 1.7, 0.12, x, 2.75, -0.66);
    block(g, 0x3a2760, 1.5, 0.07, 0.12, x, 2.75, -0.66);
    block(g, 0xffe9a8, 0.09, 0.09, 0.12, x - 0.4, 3.2, -0.66, true);
    block(g, 0xffffff, 0.06, 0.06, 0.12, x + 0.35, 2.4, -0.66, true);
  }
  const hq = document.createElement("div");
  hq.className = "o3-sign big"; hq.textContent = "AIOS HQ";
  addLabel(hq, new THREE.Vector3(2.5, 3.85, -0.68));

  const leaf = new THREE.IcosahedronGeometry(0.34, 0);
  for (const [div, ox, oz, w, d] of ROOMS) {
    const c = divColor(div), cx = ox + w / 2, cz = oz + d / 2;
    block(g, mix(0x170e2b, c, 0.1), w, 0.04, d, cx, 0.02, cz);                       // floor
    block(g, mix(0x170e2b, c, 0.26), w - 1.2, 0.02, 0.9, cx, 0.05, oz + 3);         // rug
    block(g, mix(0x170e2b, c, 0.5), w, 0.03, 0.05, cx, 0.045, oz + d);              // floor edges
    block(g, mix(0x170e2b, c, 0.5), 0.05, 0.03, d, ox + w, 0.045, cz);
    const glass = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.13, depthWrite: false });
    const back = new THREE.Mesh(unit, glass); back.scale.set(w, 1.3, 0.06); back.position.set(cx, 0.65, oz); g.add(back);
    const side = new THREE.Mesh(unit, glass); side.scale.set(0.06, 1.3, d); side.position.set(ox, 0.65, cz); g.add(side);
    block(g, c, w, 0.05, 0.08, cx, 1.32, oz, true);                                 // neon tops
    block(g, c, 0.08, 0.05, d, ox, 1.32, cz, true);
    block(g, 0x3b2a1c, 0.34, 0.4, 0.34, ox + w - 0.5, 0.2, oz + 0.5);               // plant
    const l1 = new THREE.Mesh(leaf, mat(0x2fbf71)); l1.position.set(ox + w - 0.5, 0.72, oz + 0.5); g.add(l1);
    const l2 = new THREE.Mesh(leaf, mat(0x4dff9a)); l2.scale.setScalar(0.6); l2.position.set(ox + w - 0.62, 0.98, oz + 0.42); g.add(l2);
    const sign = document.createElement("div");
    sign.className = "o3-sign"; sign.style.setProperty("--c", c); sign.textContent = (DIV[div] || {}).s || div;
    addLabel(sign, new THREE.Vector3(cx, 1.45, oz));
  }
}

export function createScene(root) {
  const host = root.querySelector(".o3-host"), overlay = root.querySelector(".o3-ov");
  const probe = document.createElement("canvas");
  if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) throw new Error("WebGL is not available");

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = new THREE.WebGLRenderer({ antialias: dpr < 2 });
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(BG);
  const el = renderer.domElement;
  host.appendChild(el);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 70, 190);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 400);
  scene.add(new THREE.HemisphereLight(0xd9c8ff, 0x24163f, 2.6));
  const sun = new THREE.DirectionalLight(0xffe6cf, 1.6);
  sun.position.set(6, 18, 14); scene.add(sun);

  /* ---- labels (plain HTML floating over the canvas, so the pixel font stays crisp) ---- */
  const labels = [], v = new THREE.Vector3();
  let W = 1, H = 1, dirty = true, labelsDirty = true;
  function addLabel(node, pos, anchor) {
    const L = { el: node, pos, anchor: anchor || "-50%,-100%", shown: true };
    overlay.appendChild(node); labels.push(L); labelsDirty = true;
    return L;
  }
  function removeLabel(L) { const i = labels.indexOf(L); if (i >= 0) labels.splice(i, 1); L.el.remove(); }
  function layoutLabels() {
    const ppu = H / (2 * cur.dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    overlay.classList.toggle("far", ppu < 15);
    overlay.classList.toggle("vfar", ppu < 8);
    for (const L of labels) {
      v.copy(L.pos).project(camera);
      const ok = !L.hidden && v.z < 1 && Math.abs(v.x) < 1.15 && Math.abs(v.y) < 1.15;
      if (ok !== L.shown) { L.el.style.display = ok ? "" : "none"; L.shown = ok; }
      if (ok) L.el.style.transform = `translate(${((v.x * 0.5 + 0.5) * W).toFixed(1)}px,${((-v.y * 0.5 + 0.5) * H).toFixed(1)}px) translate(${L.anchor})`;
    }
    labelsDirty = false;
  }

  buildShell(scene, addLabel);

  /* ---- camera: a point on the floor we look at, plus turn / tilt / distance ---- */
  const goal = { tx: 9.5, tz: 9.6, yaw: 0, pitch: 1, dist: 40 }, cur = { ...goal };
  let pristine = true, lastInput = 0;
  function place(c) {
    const cp = Math.cos(c.pitch);
    camera.position.set(c.tx + c.dist * Math.sin(c.yaw) * cp, EYE + c.dist * Math.sin(c.pitch), c.tz + c.dist * Math.cos(c.yaw) * cp);
    camera.lookAt(c.tx, EYE, c.tz);
    camera.updateMatrixWorld();
  }
  const corners = [];
  for (const x of [-0.7, 19.7]) { corners.push([x, 0, 20.7], [x, 0, -1], [x, 4.7, -1]); }
  function fits(c) {
    place(c);
    return corners.every(p => { v.set(p[0], p[1], p[2]).project(camera); return Math.abs(v.x) < 0.95 && v.y > -0.93 && v.y < (H < 520 ? 0.72 : 0.82); });
  }
  /* Default view: the whole office, as close as the screen allows. */
  function home(snap) {
    const tall = W < H;
    Object.assign(goal, { tx: 9.5, tz: 9.6, yaw: tall ? 0 : 0.42, pitch: tall ? 1.02 : 0.8 });
    let lo = DMIN, hi = DMAX;
    for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (fits({ ...goal, dist: mid })) hi = mid; else lo = mid; }
    goal.dist = hi;
    if (snap) Object.assign(cur, goal);
    dirty = true;
  }
  function limit() {
    goal.tx = clamp(goal.tx, -1, 20); goal.tz = clamp(goal.tz, -1, 21);
    goal.yaw = clamp(goal.yaw, -1.25, 1.25); goal.pitch = clamp(goal.pitch, 0.42, 1.4); goal.dist = clamp(goal.dist, DMIN, DMAX);
  }
  function pan(dx, dy) {
    const s = 2 * cur.dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / H, cy = Math.cos(cur.yaw), sy = Math.sin(cur.yaw), f = dy * s / Math.sin(cur.pitch);
    goal.tx -= cy * dx * s + sy * f;
    goal.tz -= -sy * dx * s + cy * f;
  }
  function used() { lastInput = performance.now(); dirty = true; if (pristine) { pristine = false; root.classList.add("used"); } }

  /* ---- touch + mouse ---- */
  const pts = new Map(), picks = [], ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let tap = null, pinch = null, onTap = null;
  function gauge() {
    const [a, b] = [...pts.values()];
    return { d: Math.hypot(b.x - a.x, b.y - a.y), a: Math.atan2(b.y - a.y, b.x - a.x), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
  }
  el.addEventListener("pointerdown", e => {
    try { el.setPointerCapture(e.pointerId); } catch (x) { /* synthetic events */ }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastInput = performance.now();
    tap = pts.size === 1 ? { t: lastInput, moved: 0, turn: e.button === 2 || e.shiftKey } : null;
    pinch = pts.size === 2 ? gauge() : null;
  });
  el.addEventListener("pointermove", e => {
    const p = pts.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pts.size === 1) {
      if (tap) { tap.moved += Math.abs(dx) + Math.abs(dy); if (tap.moved < 8) return; }
      if (tap && tap.turn) { goal.yaw -= dx * 0.006; goal.pitch += dy * 0.005; } else pan(dx, dy);
    } else if (pts.size === 2 && pinch) {
      const g = gauge();
      goal.dist *= pinch.d / Math.max(1, g.d);
      let da = g.a - pinch.a;
      if (da > Math.PI) da -= 2 * Math.PI; else if (da < -Math.PI) da += 2 * Math.PI;
      goal.yaw += da;
      pan(g.cx - pinch.cx, g.cy - pinch.cy);
      pinch = g;
    }
    limit(); used();
  });
  function release(e) {
    if (!pts.has(e.pointerId)) return;
    const wasTap = e.type === "pointerup" && tap && pts.size === 1 && tap.moved < 8 && performance.now() - tap.t < 600;
    pts.delete(e.pointerId); tap = null; pinch = null;
    if (!wasTap || !onTap) return;
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(picks, false)[0];
    onTap(hit ? hit.object.userData.tap : null);
  }
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);
  el.addEventListener("wheel", e => { e.preventDefault(); goal.dist *= Math.exp(e.deltaY * 0.0012); limit(); used(); }, { passive: false });
  el.addEventListener("contextmenu", e => e.preventDefault());

  /* ---- sizing + draw loop ---- */
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    W = w; H = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w < h ? 50 : 38; camera.updateProjectionMatrix();
    if (pristine) home(true);
    dirty = true;
  }
  new ResizeObserver(resize).observe(host);

  const tickers = [];
  const api = { animated: false };
  let raf = 0, lastDraw = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const moving = Math.abs(goal.tx - cur.tx) + Math.abs(goal.tz - cur.tz) + Math.abs(goal.yaw - cur.yaw) + Math.abs(goal.pitch - cur.pitch) + Math.abs(goal.dist - cur.dist) / cur.dist > 0.0015;
    if (!moving && !dirty && !api.animated) return;                   // nothing changed: skip the frame
    const active = moving || t - lastInput < 900;
    if (!active && !dirty && t - lastDraw < 33) return;               // idle animation runs at ~30 fps
    const dt = Math.min(0.1, (t - lastDraw) / 1000);
    lastDraw = t;
    if (moving) { const k = 1 - Math.exp(-dt * 14); for (const key in goal) cur[key] += (goal[key] - cur[key]) * k; }
    else Object.assign(cur, goal);
    place(cur);
    for (const f of tickers) f(t / 1000, dt);
    renderer.render(scene, camera);
    if (moving || dirty || labelsDirty) layoutLabels();
    dirty = false;
  }

  return Object.assign(api, {
    THREE, scene, camera, picks, addLabel, removeLabel,
    start() { if (raf) return; resize(); dirty = true; lastDraw = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { cancelAnimationFrame(raf); raf = 0; },
    invalidate() { dirty = true; },
    relabel() { labelsDirty = true; dirty = true; },
    onTap(fn) { onTap = fn; },
    onTick(fn) { tickers.push(fn); },
    command(k) {
      if (k === "left") goal.yaw -= Math.PI / 6;
      else if (k === "right") goal.yaw += Math.PI / 6;
      else if (k === "home") home(false);
      limit(); lastInput = performance.now(); dirty = true;
    },
    lookAt(x, z, dist) { goal.tx = x; goal.tz = z; if (dist) goal.dist = Math.min(goal.dist, dist); limit(); used(); },
  });
}

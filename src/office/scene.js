/* AIOS 3D city: renderer, camera, touch controls and floating labels.
   Kept cheap for phones: box shapes, two lights, no shadows, and it only redraws when something moves. */
import * as THREE from "./three.js";

const BG = 0x0a0613, DMIN = 5, DMAX = 170, EYE = 0.6;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const unit = new THREE.BoxGeometry(1, 1, 1);
const mats = new Map();
/* Shared materials: one per colour. glow = unlit, used for neon and screens. */
export function mat(color, glow) {
  const k = color + (glow ? "g" : "");
  if (!mats.has(k)) mats.set(k, glow ? new THREE.MeshBasicMaterial({ color }) : new THREE.MeshLambertMaterial({ color }));
  return mats.get(k);
}
/* A single box that can move on its own (characters, screens). */
export function block(parent, color, w, h, d, x, y, z, glow) {
  const m = new THREE.Mesh(unit, mat(color, glow));
  m.scale.set(w, h, d); m.position.set(x, y, z); parent.add(m);
  return m;
}
export const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();

/* Boxes that never move (floors, walls, desks) are collected here and drawn in a few big batches. */
export function batcher() {
  const list = [];
  return {
    add(color, w, h, d, x, y, z, glow, turn) { list.push([color, w, h, d, x, y, z, glow ? 1 : 0, turn || 0]); },
    build(parent) {
      const by = new Map(), o = new THREE.Object3D();
      for (const f of list) { const k = f[0] + "/" + f[7]; if (!by.has(k)) by.set(k, []); by.get(k).push(f); }
      for (const items of by.values()) {
        const im = new THREE.InstancedMesh(unit, mat(items[0][0], items[0][7]), items.length);
        items.forEach((f, i) => { o.scale.set(f[1], f[2], f[3]); o.position.set(f[4], f[5], f[6]); o.rotation.y = f[8]; o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
        im.frustumCulled = false;
        parent.add(im);
      }
    },
  };
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
  scene.fog = new THREE.Fog(BG, 90, 260);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 500);
  scene.add(new THREE.HemisphereLight(0xd9c8ff, 0x24163f, 2.6));
  const sun = new THREE.DirectionalLight(0xffe6cf, 1.6);
  sun.position.set(6, 18, 14); scene.add(sun);

  const picks = [];
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), mat(0x0d0719));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.3; scene.add(ground);
  const grid = new THREE.GridHelper(300, 100, 0x2b1c48, 0x1a1030);
  grid.position.y = -0.29; scene.add(grid);
  const walkable = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshBasicMaterial({ visible: false }));
  walkable.rotation.x = -Math.PI / 2; walkable.userData.tap = { ground: true }; scene.add(walkable); picks.push(walkable);

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
    /* how big one floor tile is on screen where you are looking; small = zoomed out */
    const px = H / (2 * cur.dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    overlay.classList.toggle("tiny", px < 26);
    for (const L of labels) {
      v.copy(L.pos).project(camera);
      const ok = !L.hidden && v.z < 1 && Math.abs(v.x) < 1.15 && Math.abs(v.y) < 1.15;
      if (ok !== L.shown) { L.el.style.display = ok ? "" : "none"; L.shown = ok; }
      if (ok) L.el.style.transform = `translate(${((v.x * 0.5 + 0.5) * W).toFixed(1)}px,${((-v.y * 0.5 + 0.5) * H).toFixed(1)}px) translate(${L.anchor})`;
    }
    labelsDirty = false;
  }

  /* ---- camera: a point on the floor we look at, plus turn / tilt / distance ---- */
  const goal = { tx: 0, tz: 0, yaw: 0, pitch: 1, dist: 60 }, cur = { ...goal };
  let box = { x0: -20, x1: 20, z0: -20, z1: 20 }, pristine = true, lastInput = 0;
  function place(c) {
    const cp = Math.cos(c.pitch);
    camera.position.set(c.tx + c.dist * Math.sin(c.yaw) * cp, EYE + c.dist * Math.sin(c.pitch), c.tz + c.dist * Math.cos(c.yaw) * cp);
    camera.lookAt(c.tx, EYE, c.tz);
    camera.updateMatrixWorld();
  }
  function fits(c) {
    place(c);
    for (const x of [box.x0, box.x1]) for (const z of [box.z0, box.z1]) for (const y of [0, 2.6]) {
      v.set(x, y, z).project(camera);
      if (Math.abs(v.x) > 0.96 || v.y < -0.94 || v.y > (H < 520 ? 0.74 : 0.84)) return false;
    }
    return true;
  }
  /* Default view: the whole city, as close as the screen allows. */
  function home(snap) {
    const tall = W < H;
    Object.assign(goal, { tx: (box.x0 + box.x1) / 2, tz: (box.z0 + box.z1) / 2, yaw: tall ? 0 : 0.5, pitch: tall ? 1.02 : 0.82 });
    let lo = DMIN, hi = DMAX;
    for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (fits({ ...goal, dist: mid })) hi = mid; else lo = mid; }
    goal.dist = hi;
    if (snap) Object.assign(cur, goal);
    dirty = true;
  }
  function limit() {
    goal.tx = clamp(goal.tx, box.x0 - 3, box.x1 + 3); goal.tz = clamp(goal.tz, box.z0 - 3, box.z1 + 3);
    goal.pitch = clamp(goal.pitch, 0.42, 1.4); goal.dist = clamp(goal.dist, DMIN, DMAX);
  }
  function pan(dx, dy) {
    const s = 2 * cur.dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / H, cy = Math.cos(cur.yaw), sy = Math.sin(cur.yaw), f = dy * s / Math.sin(cur.pitch);
    goal.tx -= cy * dx * s + sy * f;
    goal.tz -= -sy * dx * s + cy * f;
  }
  function used() { lastInput = performance.now(); dirty = true; if (pristine) { pristine = false; root.classList.add("used"); } }

  /* ---- touch + mouse ---- */
  const pts = new Map(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
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
    if (hit) { used(); onTap(hit.object.userData.tap, hit.point); }
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
    const wasDirty = dirty;
    dirty = false;
    if (moving) { const k = 1 - Math.exp(-dt * 14); for (const key in goal) cur[key] += (goal[key] - cur[key]) * k; }
    else Object.assign(cur, goal);
    place(cur);
    for (const f of tickers) f(t / 1000, dt);                          // a ticker may ask for another frame
    renderer.render(scene, camera);
    if (moving || wasDirty || labelsDirty) layoutLabels();
  }

  return Object.assign(api, {
    THREE, scene, camera, picks, addLabel, removeLabel,
    start() { if (raf) return; resize(); dirty = true; lastDraw = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { cancelAnimationFrame(raf); raf = 0; },
    invalidate() { dirty = true; },
    relabel() { labelsDirty = true; dirty = true; },
    onTap(fn) { onTap = fn; },
    onTick(fn) { tickers.push(fn); },
    /* The city tells the camera how big it is, so "fit everything" and the edges stay right. */
    setBounds(b) { box = b; if (pristine) home(true); },
    command(k) { if (k === "home") home(false); lastInput = performance.now(); dirty = true; },
    lookAt(x, z, dist) { goal.tx = x; goal.tz = z; if (dist) goal.dist = Math.min(goal.dist, dist); limit(); dirty = true; },
    /* Keep a moving thing (your character) in the middle of the view. */
    follow(x, z) { goal.tx = x; goal.tz = z; dirty = true; },
  });
}

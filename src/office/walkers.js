/* AIOS 3D city: idle agents sometimes get up, stroll across the plaza or over to their business
   building, and come back. Working, waiting and offline agents stay put. At most three are out at once. */
import { walker, stride, flair } from "./city.js";

const SPEED = 2.3, MAX = 3;
export function createWalkers(office, city, placeOf) {
  const out = new Map();
  let next = 6;

  function finish(id) {
    const w = out.get(id);
    if (!w) return;
    office.scene.remove(w.fig.g);
    out.delete(id);
    if (city.items.get(id) === w.it) { w.it.body.visible = w.it.mode !== "offline"; w.it.label.pos.set(w.it.x, 0, w.it.z + 1.35); }
    office.relabel();
  }
  function start() {
    if (out.size >= MAX) return;
    const idle = [...city.items.values()].filter(it => it.mode === "idle" && !out.has(it.id));
    if (!idle.length) return;
    const it = idle[Math.floor(Math.random() * idle.length)], door = city.door, home = city.doorOf(placeOf(it.bot));
    const spot = () => ({ x: door.x + (Math.random() * 13 - 6.5), z: door.z + 1 + Math.random() * 7, wait: 1.5 + Math.random() * 2.5 });
    const path = home && Math.random() < 0.5 ? [spot(), { x: home.x, z: home.z, wait: 3 }, spot()] : [spot(), spot()];
    path.push({ x: door.x, z: door.z, wait: 0 });
    const fig = walker(it.color, it.skin, it.hair, it.bot.is_head);
    flair(fig.rig, fig.head, it.bot.platform);
    fig.g.position.set(door.x, 0, door.z);
    office.scene.add(fig.g);
    it.body.visible = false;
    out.set(it.id, { it, fig, path, wait: 0 });
  }

  office.onTick((t, dt) => {
    next -= dt;
    if (next <= 0) { next = 4 + Math.random() * 7; start(); }
    for (const [id, w] of out) {
      if (city.items.get(id) !== w.it || w.it.mode !== "idle") { finish(id); continue; }    // called back to work, or the city was rebuilt
      const g = w.fig.g, to = w.path[0];
      if (w.wait > 0) { w.wait -= dt; stride(w.fig, 0, 0); }
      else {
        const dx = to.x - g.position.x, dz = to.z - g.position.z, left = Math.hypot(dx, dz), step = SPEED * dt;
        if (left <= step) { g.position.x = to.x; g.position.z = to.z; w.wait = to.wait; w.path.shift(); if (!w.path.length) { finish(id); continue; } }
        else { g.position.x += dx / left * step; g.position.z += dz / left * step; g.rotation.y = Math.atan2(dx, dz); stride(w.fig, t + w.it.phase, 8); }
      }
      w.it.label.pos.set(g.position.x, 0, g.position.z + 0.5);
    }
    if (out.size) office.relabel();
  });
}

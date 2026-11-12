/* AIOS 3D city: your own character. Tap the ground and it walks there; the camera follows. */
import * as THREE from "./three.js";
import { block } from "./scene.js";
import { walker, stride } from "./city.js";

const SPEED = 6;
export function createPlayer(office, x, z) {
  const me = walker(0xb98cff, "#e9b98f", "#3a2412", true), g = me.g;
  block(me.rig, 0xff8a3d, 0.42, 0.5, 0.04, 0, 0.3, -0.15);                 // cape
  g.position.set(x, 0, z);
  office.scene.add(g);
  const marker = block(office.scene, 0xff8a3d, 0.5, 0.03, 0.5, 0, 0.08, 0, true);
  marker.visible = false; marker.rotation.y = Math.PI / 4;
  const tag = document.createElement("div");
  tag.className = "o3-name you"; tag.textContent = "You";
  const label = office.addLabel(tag, new THREE.Vector3(x, 1.85, z));

  let target = null, face = null, done = null;
  office.onTick((t, dt) => {
    if (!target) return;
    const dx = target.x - g.position.x, dz = target.z - g.position.z, left = Math.hypot(dx, dz), step = SPEED * dt;
    if (left <= step) {
      g.position.x = target.x; g.position.z = target.z; target = null; marker.visible = false;
      if (face) g.rotation.y = Math.atan2(face.x - g.position.x, face.z - g.position.z);
      stride(me, 0, 0);
      if (done) { const f = done; done = null; f(); }
    } else {
      g.position.x += dx / left * step; g.position.z += dz / left * step; g.rotation.y = Math.atan2(dx, dz);
      stride(me, t, 11);
    }
    label.pos.set(g.position.x, 1.85, g.position.z);
    office.follow(g.position.x, g.position.z);
    office.relabel();                                    // keeps frames coming while walking
  });

  return {
    position: g.position,
    /* lookAt = something to turn towards on arrival. then = called on arrival. */
    walkTo(tx, tz, lookAt, then) {
      target = { x: tx, z: tz }; face = lookAt || null; done = then || null;
      marker.position.set(tx, 0.08, tz); marker.visible = !lookAt;
      office.invalidate();
    },
  };
}

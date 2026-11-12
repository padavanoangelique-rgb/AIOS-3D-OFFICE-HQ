/* AIOS 3D city: your own character. Tap the ground and it walks there; the camera follows. */
import * as THREE from "./three.js";
import { block } from "./scene.js";
import { person } from "./city.js";

const SPEED = 5.5;
export function createPlayer(office) {
  const g = new THREE.Group();
  g.position.set(8.5, 0, 1.5);
  const legs = [-1, 1].map(s => { const l = new THREE.Group(); l.position.set(s * 0.1, 0.6, 0); block(l, 0x221636, 0.15, 0.6, 0.17, 0, -0.3, 0); g.add(l); return l; });
  const top = new THREE.Group();
  top.position.y = 0.58; g.add(top);
  const p = person(top, 0xb98cff, "#e9b98f", "#3a2412", true);
  block(p.rig, 0xff8a3d, 0.42, 0.5, 0.04, 0, 0.3, -0.15);                 // cape
  office.scene.add(g);
  const marker = block(office.scene, 0xff8a3d, 0.5, 0.03, 0.5, 0, 0.08, 0, true);
  marker.visible = false; marker.rotation.y = Math.PI / 4;

  const tag = document.createElement("div");
  tag.className = "o3-name you"; tag.textContent = "You";
  const label = office.addLabel(tag, new THREE.Vector3(8.5, 1.85, 1.5));

  let target = null, face = null, done = null;
  office.onTick((t, dt) => {
    if (!target) return;
    const dx = target.x - g.position.x, dz = target.z - g.position.z, left = Math.hypot(dx, dz), step = SPEED * dt;
    if (left <= step) {
      g.position.x = target.x; g.position.z = target.z; target = null; marker.visible = false;
      if (face) g.rotation.y = Math.atan2(face.x - g.position.x, face.z - g.position.z);
      legs[0].rotation.x = legs[1].rotation.x = p.arms[0].rotation.x = p.arms[1].rotation.x = 0; top.position.y = 0.58;
      if (done) { const f = done; done = null; f(); }
    } else {
      g.position.x += dx / left * step; g.position.z += dz / left * step; g.rotation.y = Math.atan2(dx, dz);
      const swing = Math.sin(t * 11) * 0.7;
      legs[0].rotation.x = swing; legs[1].rotation.x = -swing; p.arms[0].rotation.x = -swing * 0.8; p.arms[1].rotation.x = swing * 0.8;
      top.position.y = 0.58 + Math.abs(Math.sin(t * 11)) * 0.04;
    }
    label.pos.set(g.position.x, 1.85, g.position.z);
    office.follow(g.position.x, g.position.z);
    office.relabel();                                    // keeps frames coming while walking
  });

  return {
    position: g.position,
    /* lookAt = something to turn towards on arrival (an agent's desk). then = called on arrival. */
    walkTo(x, z, lookAt, then) {
      target = { x, z }; face = lookAt || null; done = then || null;
      marker.position.set(x, 0.08, z); marker.visible = !lookAt;
      office.invalidate();
    },
  };
}

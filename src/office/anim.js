/* AIOS 3D office: each character acts out its live status from the bot's "hello" check-in.
   working = typing with a lit screen, idle = leaning back, waiting = hand up, offline = empty chair, lights off.
   The status_line shows as a speech bubble. */
import * as THREE from "./three.js";
import { mat } from "./scene.js";

const OFFLINE_AFTER_HOURS = 72;
/* The roster has working / waiting / idle. "Offline" = an idle bot that has never checked in, or not for 3 days. */
export function modeOf(b) {
  if (b.status === "working" || b.status === "waiting") return b.status;
  const seen = b.last_seen_at ? Date.parse(b.last_seen_at) : 0;
  return !seen || Date.now() - seen > OFFLINE_AFTER_HOURS * 36e5 ? "offline" : "idle";
}

export function createAnim(office, bots) {
  const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function bubble(it, mode) {
    let text = String(it.bot.status_line || "").trim();
    if (!text && mode === "waiting") text = "Needs you";
    if (!text) { if (it.bubble) { office.removeLabel(it.bubble); it.bubble = null; } return; }
    if (text.length > 90) text = text.slice(0, 88) + "…";
    if (!it.bubble) {
      const el = document.createElement("div");
      it.bubble = office.addLabel(el, new THREE.Vector3(it.x, 1.75, it.z));
    }
    it.bubble.pos.y = mode === "offline" ? 1.25 : 1.75;
    it.bubble.el.className = "o3-bub" + (mode === "waiting" ? " waiting" : mode === "working" ? "" : " dim");
    it.bubble.el.textContent = text;          // bot-written text: always inserted as plain text
  }

  /* Call after every roster read. */
  function apply() {
    let live = 0;
    for (const it of bots.items.values()) {
      const mode = modeOf(it.bot);
      if (mode !== "offline") live++;
      if (!it.pose) it.pose = { lean: 0, l: -1.1, r: -1.1 };
      if (mode !== it.mode) {
        it.mode = mode;
        it.body.visible = mode !== "offline";
        it.lid.material = mode === "working" ? mat(it.color, true) : mode === "waiting" ? mat(0xff5f6e, true) : mode === "idle" ? mat(0x2b2350, true) : mat(it.DARK);
        it.lamp.material = mat(mode === "offline" ? it.LAMP_OFF : it.LAMP_ON, true);
      }
      it.nameEl.className = "o3-name " + (mode === "offline" ? "off" : mode);
      bubble(it, mode);
    }
    office.animated = live > 0 && !calm;
    if (calm) pose(0, 1);
    office.relabel();
  }

  function pose(t, dt) {
    const k = Math.min(1, dt * 6);
    for (const it of bots.items.values()) {
      const m = it.mode, p = it.pose, ph = it.phase;
      if (!p || m === "offline") continue;
      let lean, l, r, typeL = 0, typeR = 0, wave = 0, look = 0, bob = 0;
      if (m === "working") { lean = 0.16; l = r = -1.2; typeL = Math.sin(t * 13 + ph) * 0.13; typeR = Math.sin(t * 13 + ph + 2.1) * 0.13; look = Math.sin(t * 0.9 + ph) * 0.07; bob = Math.sin(t * 6.5 + ph) * 0.006; }
      else if (m === "waiting") { lean = 0; l = -1; r = -2.9; wave = Math.sin(t * 6 + ph) * 0.35; bob = Math.abs(Math.sin(t * 3 + ph)) * 0.03; }
      else { lean = -0.34; l = r = -0.45; look = Math.sin(t * 0.45 + ph) * 0.4; bob = Math.sin(t * 1.4 + ph) * 0.008; }
      p.lean += (lean - p.lean) * k; p.l += (l - p.l) * k; p.r += (r - p.r) * k;
      it.rig.rotation.x = p.lean; it.rig.position.y = bob;
      it.arms[0].rotation.x = p.l + typeL; it.arms[1].rotation.x = p.r + typeR; it.arms[1].rotation.z = wave;
      it.head.rotation.y = look;
    }
  }
  office.onTick(pose);
  return { apply };
}

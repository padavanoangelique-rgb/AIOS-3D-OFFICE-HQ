/* AIOS 3D office: entry point. Loaded only when the office is opened. */
import * as THREE from "./three.js";
import { ROOMS } from "./data.js";
import { createScene } from "./scene.js";
import { createBots } from "./bots.js";
import { createAnim } from "./anim.js";
import { createBoard } from "./board.js";

export function mount(root, app) {
  const office = createScene(root), bots = createBots(office), anim = createAnim(office, bots), board = createBoard(office, root);

  /* Invisible floor tiles so tapping a room flies the camera to it. */
  const unseen = new THREE.MeshBasicMaterial({ visible: false });
  for (const [, ox, oz, w, d] of ROOMS) {
    const tile = new THREE.Mesh(new THREE.PlaneGeometry(w, d), unseen);
    tile.rotation.x = -Math.PI / 2; tile.position.set(ox + w / 2, 0.03, oz + d / 2);
    tile.userData.tap = { room: [ox + w / 2, oz + d / 2 + 0.4, Math.max(w, d) * 2.6] };
    office.scene.add(tile); office.picks.push(tile);
  }
  office.onTap(hit => {
    if (!hit) return board.close();
    if (hit.bot) app.act("bot", hit.bot);               // opens the dashboard's own bot drawer (with Open chat)
    else if (hit.board) board.open();
    else if (hit.room) office.lookAt(hit.room[0], hit.room[1], hit.room[2]);
  });

  /* Same data the dashboard just read (see tap.js). Runs again every time the dashboard refreshes. */
  function refresh() {
    const data = window.AIOS_TAP || {};
    if (data.bots) { bots.sync(data.bots); anim.apply(); }
    board.sync(data.dec || [], data.bots || []);
    office.animated = office.animated || board.glowing;
  }
  window.addEventListener("aios-data", refresh);
  refresh();
  return { start: office.start, stop: office.stop, command(k) { if (k === "sheet-close") board.close(); else office.command(k); } };
}

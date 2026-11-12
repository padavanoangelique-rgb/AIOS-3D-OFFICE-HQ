/* AIOS 3D city: entry point. Loaded only when the city is opened. */
import * as THREE from "./three.js";
import { createScene, block } from "./scene.js";
import { createRooms } from "./rooms.js";
import { createCity } from "./city.js";
import { createAnim } from "./anim.js";
import { createBoard } from "./board.js";
import { createPlayer } from "./player.js";
import { createUI } from "./ui.js";

export function mount(root, app) {
  const office = createScene(root), rooms = createRooms(), city = createCity(office), anim = createAnim(office, city);
  const player = createPlayer(office), ui = createUI(root, rooms);

  /* The decision whiteboard stands behind the lobby. board.js draws it at a fixed spot, so it is
     placed through a holder that is shifted to where the city wants it. */
  const stand = new THREE.Group(), shift = new THREE.Vector3(-12.5, 0.05, -6.3);
  stand.position.copy(shift); office.scene.add(stand);
  const board = createBoard({ ...office, scene: stand, addLabel: (el, pos, anchor) => office.addLabel(el, pos.add(shift), anchor) }, root);
  for (const x of [-3.3, 3.3]) block(office.scene, 0x6d4bb0, 0.14, 1.4, 0.14, x, 0.7, -6.95);

  office.onTap((hit, point) => {
    if (hit.bot) {                                         // walk over to the agent and open its card
      const it = city.items.get(hit.bot);
      if (!it) return;
      board.close(); ui.closeList(); ui.showBot(hit.bot);
      player.walkTo(it.x + 1.05, it.z + 0.35, it);
    } else if (hit.board) { ui.hideBot(); ui.closeList(); board.open(); }
    else if (hit.ground) { ui.hideBot(); board.close(); ui.closeList(); player.walkTo(point.x, point.z); }
  });

  /* Same data the dashboard just read (see tap.js). Runs again every time the dashboard refreshes. */
  function refresh() {
    const data = window.AIOS_TAP || {};
    if (data.bots) { city.sync(data.bots, rooms.of); anim.apply(); ui.sync(data.bots, data.prog && data.prog[0]); }
    board.sync(data.dec || [], data.bots || []);
    office.animated = office.animated || board.glowing;
  }
  window.addEventListener("aios-data", refresh);
  rooms.onChange(refresh);
  refresh();

  return {
    start: office.start, stop: office.stop,
    command(k) {
      if (k === "sheet-close") board.close();
      else if (k === "rooms") { ui.hideBot(); board.close(); ui.openList(); }
      else if (k === "rooms-close") ui.closeList();
      else if (k === "card-close") ui.hideBot();
      else office.command(k);
    },
  };
}

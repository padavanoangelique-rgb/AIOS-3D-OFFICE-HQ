/* AIOS 3D city: entry point. Loaded only when the city is opened. */
import * as THREE from "./three.js";
import { createScene } from "./scene.js";
import { createStore } from "./store.js";
import { createCity } from "./city.js";
import { createAnim } from "./anim.js";
import { createBoard } from "./board.js";
import { createPlayer } from "./player.js";
import { createWalkers } from "./walkers.js";
import { createUI } from "./ui.js";

export function mount(root, app) {
  const office = createScene(root), store = createStore(app.say), city = createCity(office), anim = createAnim(office, city);
  const ui = createUI(root, store), player = createPlayer(office, 0, 13);
  createWalkers(office, city, store.of);
  const wide = () => root.clientWidth >= 1300;           // big screens keep the team list and "waiting on you" open at the sides

  /* The decision whiteboard hangs above the HQ back wall. board.js draws it at a fixed spot, so it is
     placed through a holder that is shifted to where the city wants it. */
  const stand = new THREE.Group(), shift = new THREE.Vector3(-12.5, 1.15, -5.3);
  stand.position.copy(shift); office.scene.add(stand);
  const board = createBoard({ ...office, scene: stand, addLabel: (el, pos, anchor) => office.addLabel(el, pos.add(shift), anchor) }, root);

  function visit(id) {                                    // walk over to an agent and open their card
    const it = city.items.get(id);
    if (!it) return;
    ui.closeFile(); if (!wide()) { board.close(); ui.closeTeam(); }
    ui.showBot(id);
    player.walkTo(it.x + 1.05, it.z + 0.35, it);
  }
  office.onTap((hit, point) => {
    if (hit.bot) visit(hit.bot);
    else if (hit.board) { ui.hideCard(); ui.closeFile(); if (!wide()) ui.closeTeam(); board.open(); }
    else if (hit.place) {                                 // walk to the building's door and open its file
      const door = city.doorOf(hit.place);
      ui.hideCard(); if (!wide()) { board.close(); ui.closeTeam(); }
      ui.openFile(hit.place); store.refresh();
      player.walkTo(door.x, door.z, { x: door.x, z: door.z - 2 });
    } else if (hit.quest) { ui.closeFile(); ui.showQuest(); player.walkTo(city.quest.x - 1.3, city.quest.z + 0.6, city.quest); }
    else if (hit.ground) { ui.hideCard(); ui.closeFile(); if (!wide()) { board.close(); ui.closeTeam(); } player.walkTo(point.x, point.z); }
  });

  /* Same data the dashboard just read (see tap.js). Runs again every time the dashboard refreshes. */
  function refresh() {
    const data = window.AIOS_TAP || {};
    if (data.bots) { city.sync(data.bots, store.of, store.count); anim.apply(); ui.sync(data.bots, data.prog && data.prog[0]); }
    board.sync(data.dec || [], data.bots || []);
    office.animated = office.animated || board.glowing;
  }
  window.addEventListener("aios-data", () => { refresh(); store.refresh(); });
  store.onChange(refresh);
  refresh(); store.refresh(true);
  if (wide()) { ui.openTeam(); board.open(); }

  return {
    start: office.start, stop: office.stop,
    command(k, el) {
      if (k === "sheet-close") board.close();
      else if (k === "team") { ui.hideCard(); ui.closeFile(); if (!wide()) board.close(); ui.openTeam(); }
      else if (k === "team-close") ui.closeTeam();
      else if (k === "card-close") ui.hideCard();
      else if (k === "file-close") ui.closeFile();
      else if (k === "goto") visit(el.dataset.id);
      else if (k === "note-add") ui.addNote();
      else if (k === "note-del") store.removeNote(Number(el.dataset.id));
      else office.command(k);
    },
  };
}

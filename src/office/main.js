/* AIOS 3D office: entry point. Loaded only when the office is opened. */
import { createScene } from "./scene.js";
import { createBots } from "./bots.js";
import { createAnim } from "./anim.js";

export function mount(root, app) {
  const office = createScene(root), bots = createBots(office), anim = createAnim(office, bots);
  /* Same data the dashboard just read (see tap.js). Runs again every time the dashboard refreshes. */
  function refresh() {
    const data = window.AIOS_TAP || {};
    if (data.bots) { bots.sync(data.bots); anim.apply(); }
  }
  window.addEventListener("aios-data", refresh);
  refresh();
  return { start: office.start, stop: office.stop, command: office.command };
}

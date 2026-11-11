/* AIOS 3D office: entry point. Loaded only when the office is opened. */
import { createScene } from "./scene.js";

export function mount(root, app) {
  const office = createScene(root);
  return { start: office.start, stop: office.stop, command: office.command };
}

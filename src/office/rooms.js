/* Which building each agent sits in. You choose; the choice is remembered on this device.
   Nothing here writes to Supabase, so the roster, the 2D dashboard and the bots are unaffected. */
import { BUILDINGS, PLACES } from "./data.js";

const KEY = "aios2-rooms";
export function createRooms() {
  const ids = new Set(PLACES.map(p => p.id)), start = {}, subs = [];
  for (const b of BUILDINGS) for (const d of b.div || []) start[d] = b.id;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { saved = {}; }
  return {
    of(bot) { const s = saved[bot.id]; return ids.has(s) ? s : start[bot.division] || "lobby"; },
    set(botId, place) {
      if (!ids.has(place)) return;
      saved[botId] = place;
      try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* private mode: lasts until the page closes */ }
      subs.forEach(f => f());
    },
    onChange(f) { subs.push(f); },
  };
}

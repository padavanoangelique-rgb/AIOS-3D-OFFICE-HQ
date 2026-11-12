/* Which business each agent belongs to, and the goals / notes / ideas / materials kept in each building.
   Saved through the aios-city function so it follows you across devices. That function is separate from
   the ones the bots use. Reading placements is open; notes and every change need your owner key, which
   is the same key the dashboard already keeps on this device (it is never written into this code). */
import { BUILDINGS, PLACES } from "./data.js";

const URL = "https://qbgfrpikwlogorzyxuye.supabase.co/functions/v1/aios-city", CACHE = "aios2-rooms", TOKEN = "aios-owner-token";
export function createStore(say) {
  const ids = new Set(PLACES.map(p => p.id)), start = {}, subs = [];
  for (const b of BUILDINGS) for (const d of b.div || []) start[d] = b.id;
  let rooms = {}, notes = null, last = 0;
  try { rooms = JSON.parse(localStorage.getItem(CACHE)) || {}; } catch (e) { rooms = {}; }
  const key = () => { try { return localStorage.getItem(TOKEN) || ""; } catch (e) { return ""; } };
  const keep = () => { try { localStorage.setItem(CACHE, JSON.stringify(rooms)); } catch (e) { /* private mode */ } };
  const tell = () => subs.forEach(f => f());
  async function call(body, token) {
    try {
      const headers = { "content-type": "application/json" };
      if (token) headers["x-aios-token"] = token;
      const r = await fetch(URL, { method: "POST", headers, body: JSON.stringify(body) });
      return { status: r.status, data: await r.json().catch(() => ({})) };
    } catch (e) { return { status: 0, data: {} }; }
  }
  async function change(body) {
    const token = key();
    if (!token) { say("Enter your owner key first (tap Locked at the top)."); return null; }
    const r = await call(body, token);
    if (r.status === 200) return r.data;
    say(r.status === 0 ? "Offline. Not saved." : r.data.error || "Could not save.");
    return null;
  }
  return {
    of(bot) { const s = rooms[bot.id]; return ids.has(s) ? s : start[bot.division] || "none"; },
    /* null = locked (no key on this device); otherwise the list for one building */
    notes(place) { return notes ? notes.filter(n => n.place === place) : null; },
    count(place) { return notes ? notes.filter(n => n.place === place).length : 0; },
    onChange(f) { subs.push(f); },
    async refresh(force) {
      if (!force && Date.now() - last < 25000) return;
      last = Date.now();
      let r = await call({ action: "load" }, key());
      if (r.status === 401) r = await call({ action: "load" }, "");
      if (r.status !== 200) return;
      for (const row of r.data.rooms || []) rooms[row.bot_id] = row.place;
      notes = r.data.notes || null;
      keep(); tell();
    },
    async setRoom(botId, place) {
      if (!ids.has(place)) return;
      rooms[botId] = place; keep(); tell();
      if (!key()) return say("Saved on this device only. Enter your owner key to sync it everywhere.");
      await change({ action: "room_set", bot: botId, place });
    },
    async addNote(place, kind, body) {
      const r = await change({ action: "note_add", place, kind, body });
      if (!r) return false;
      notes = (notes || []).concat(r.data); tell();
      return true;
    },
    async removeNote(id) {
      if (!(await change({ action: "note_delete", id }))) return;
      notes = (notes || []).filter(n => n.id !== id); tell();
    },
  };
}

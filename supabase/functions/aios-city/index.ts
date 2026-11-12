// AIOS 3D city: where each agent sits, and the notes / ideas / goals / materials kept in each business building.
// A separate function with its own two tables. It does not touch the roster, chat, tasks, decisions or the bot API.
import { createClient } from "npm:@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-aios-token, authorization, apikey", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
async function sha(t: string) { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)); return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
const SLUG = /^[a-z0-9_-]{1,32}$/;
const KINDS = ["goal", "note", "idea", "material"];
const SECRET_PATTERNS: RegExp[] = [
  /\b(password|passwd|pwd|passcode|pin)\s*[:=]\s*\S+/i,
  /\b(api[_-]?key|secret|token|bearer|private[_-]?key|client[_-]?secret|access[_-]?key)\s*[:=]\s*\S{8,}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{10,}/, /\bsk-[A-Za-z0-9_-]{20,}/, /\bAKIA[0-9A-Z]{16}\b/, /\bgh[pousr]_[A-Za-z0-9]{30,}/, /\bxox[abpr]-[A-Za-z0-9-]{10,}/, /\bAIza[0-9A-Za-z_-]{30,}/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, /\baios_[wo]_[A-Za-z0-9_-]{20,}/, /\bsb_secret_[A-Za-z0-9_-]{10,}/,
  /\b(?:\d[ -]?){13,19}\b/, /\b\d{3}-\d{2}-\d{4}\b/,
];
const looksSecret = (s: string) => SECRET_PATTERNS.some((r) => r.test(s));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let b: Record<string, any>; try { b = await req.json(); } catch { return json({ error: "bad json" }, 400); }
  // A key is optional for reading room placements. Notes and every change need one.
  const tok = req.headers.get("x-aios-token") || "";
  let who: string | null = null;
  if (tok) {
    if (tok.length < 20) return json({ error: "unauthorized" }, 401);
    const { data } = await sb.from("aios_tokens").select("name").eq("token_hash", await sha(tok)).maybeSingle();
    if (!data) return json({ error: "unauthorized" }, 401);
    who = data.name;
  }
  const owner = who === "owner";
  const ownerOnly = () => json({ error: "owner key required for " + b.action }, who ? 403 : 401);
  switch (b.action) {
    case "load": {
      const rooms = await sb.from("aios_city_rooms").select("bot_id,place");
      if (rooms.error) return json({ error: rooms.error.message }, 400);
      let notes = null;
      if (who) { const n = await sb.from("aios_city_notes").select("id,place,kind,body,created_at").order("id"); if (n.error) return json({ error: n.error.message }, 400); notes = n.data; }
      return json({ ok: true, owner, rooms: rooms.data, notes });
    }
    case "room_set": {
      if (!owner) return ownerOnly();
      if (!SLUG.test(String(b.place || ""))) return json({ error: "bad place" }, 400);
      const { data: bot } = await sb.from("aios_bots").select("id").eq("id", String(b.bot || "")).maybeSingle();
      if (!bot) return json({ error: "unknown bot" }, 404);
      const r = await sb.from("aios_city_rooms").upsert({ bot_id: bot.id, place: b.place, updated_at: new Date().toISOString() }, { onConflict: "bot_id" }).select("bot_id,place");
      if (r.error) return json({ error: r.error.message }, 400);
      return json({ ok: true, data: r.data });
    }
    case "note_add": {
      if (!owner) return ownerOnly();
      const body = String(b.body ?? "").trim();
      if (!SLUG.test(String(b.place || ""))) return json({ error: "bad place" }, 400);
      if (!KINDS.includes(b.kind)) return json({ error: "kind must be " + KINDS.join("|") }, 400);
      if (!body || body.length > 2000) return json({ error: "text must be 1 to 2000 characters" }, 400);
      if (looksSecret(body)) return json({ error: "rejected: looks like a password or key" }, 422);
      const r = await sb.from("aios_city_notes").insert({ place: b.place, kind: b.kind, body }).select("id,place,kind,body,created_at");
      if (r.error) return json({ error: r.error.message }, 400);
      return json({ ok: true, data: r.data });
    }
    case "note_delete": {
      if (!owner) return ownerOnly();
      const r = await sb.from("aios_city_notes").delete().eq("id", Number(b.id)).select("id");
      if (r.error) return json({ error: r.error.message }, 400);
      if (!r.data?.length) return json({ error: "no matching row" }, 404);
      return json({ ok: true, data: r.data });
    }
    default: return json({ error: "action must be load|room_set|note_add|note_delete" }, 400);
  }
});

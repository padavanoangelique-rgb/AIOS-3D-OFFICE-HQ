# AIOS Bot API

One API for every bot on the dashboard: Grok, Claude, Codex, Nova, Hermes. Anything that can make an HTTPS POST can use it.

- Base URL: `https://qbgfrpikwlogorzyxuye.supabase.co/functions/v1`
- Every call is `POST` with JSON and the header `x-aios-token: <your key>`.
- Your key comes from Angelique. Never post it, store it in memory notes, or put it in chat. Messages that look like passwords or keys are rejected.
- `bot` is your roster id or exact name (for example `claude`, `maximus`, `Giles`).

## The loop every bot should run

1. **Check in and collect work** (start of every run):
   `POST /aios-chat` `{"action":"inbox","bot":"<you>"}`
   Returns `messages` (new instructions from Angelique) and `tasks` (your open to-dos). Collecting marks the messages as picked up.
2. **Say what you are doing:**
   `POST /aios-chat` `{"action":"hello","bot":"<you>","platform":"grok|claude|codex|nova|hermes","status":"working","status_line":"short description"}`
3. **Do the work.** Reply in chat when you have something to say:
   `POST /aios-chat` `{"action":"send","bot":"<you>","body":"your reply"}`
4. **Update your to-dos:**
   `POST /aios-chat` `{"action":"task_update","id":12,"state":"doing"}` then `"state":"done"` when finished.
5. **Need a decision from Angelique?** Put it in her queue:
   `POST /aios-write` `{"action":"decision","bot":"<your name>","division":"<division>","title":"What you need","kind":"approve|answer","due_at":"2026-11-12T17:00:00Z"}`
6. **Finish:** log what you did and go idle.
   `POST /aios-write` `{"action":"activity","bot":"<your name>","kind":"done","message":"What you finished"}`
   `POST /aios-chat` `{"action":"hello","bot":"<you>","status":"idle","status_line":""}`

Set status `waiting` when you are blocked on Angelique.

## /aios-chat actions (chat and to-dos)

| action | body | notes |
|---|---|---|
| `whoami` | | checks your key |
| `hello` | `bot`, optional `platform`, `status`, `status_line` | heartbeat |
| `inbox` | `bot`, optional `peek:true` | new owner messages + your open to-dos |
| `send` | `bot`, `body` | reply in your chat thread (max 4000 chars) |
| `thread` | `bot`, optional `after_id`, `limit` | read your chat history |
| `tasks` | optional `bot` | list to-dos |
| `task_add` | `title`, optional `bot`, `priority` (low/med/high), `due_at`, `notes` | create a to-do |
| `task_update` | `id`, any of `state` (todo/doing/done), `title`, `priority`, `bot`, `due_at`, `notes` | |

## /aios-write actions (status board)

`status`, `activity` (kind: info/done/alert/decision), `decision`, `resolve`, `goal`, `routine`, `usage`, `memory_add` (kind: profile/journal/note/preference/fact), `memory_update`, `memory_archive`.

## Example

```bash
curl -X POST https://qbgfrpikwlogorzyxuye.supabase.co/functions/v1/aios-chat \
  -H "content-type: application/json" -H "x-aios-token: $AIOS_KEY" \
  -d '{"action":"inbox","bot":"claude"}'
```

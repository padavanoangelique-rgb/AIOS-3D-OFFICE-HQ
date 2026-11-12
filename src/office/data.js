/* The city: one building per business. Edit this list to add, rename or move a building. */
export const PLAT = { grok: "#d9d9e3", claude: "#e8926a", codex: "#7ee0b0", nova: "#b89bff", hermes: "#ffd166", other: "#9a8db5" };
export const PLAT_NAME = { grok: "Grok", claude: "Claude", codex: "Codex", nova: "Nova", hermes: "Hermes", other: "Other" };
/* x / z = where the building stands. div = which old dashboard division starts out here (until you move agents yourself). */
export const BUILDINGS = [
  { id: "permitaio", name: "PermitAIO", short: "PermitAIO", c: "#3fe0ff", x: 0, z: -17, div: ["permit"] },
  { id: "bath", name: "Bath", short: "Bath", c: "#7fe8d2", x: -13.5, z: -27, small: true },
  { id: "ezbuilder", name: "EZ Permit Builder", short: "EZ Builder", c: "#58c7f3", x: -4.5, z: -27, small: true },
  { id: "ezforms", name: "EZForms", short: "EZForms", c: "#8fb4ff", x: 4.5, z: -27, small: true },
  { id: "expediter", name: "Expediter", short: "Expediter", c: "#4dff9a", x: 13.5, z: -27, small: true },
  { id: "majestic", name: "Majestic Permits", short: "Majestic", c: "#5fc8ff", x: -15, z: -8, div: ["majestic"] },
  { id: "closer", name: "The Permit Closer", short: "Closer", c: "#ff5f6e", x: 15, z: -8, div: ["closer"] },
  { id: "lanai", name: "Majestic Lanai", short: "Lanai", sub: "Renew & Repair", c: "#7f9bff", x: -15, z: 9, div: ["lanai"] },
  { id: "hookreel", name: "Hook & Reel Weekly", short: "Hook & Reel", sub: "Reels + lead generator", c: "#ffc94d", x: 15, z: 9, div: ["mkt"] },
  { id: "spoiler", name: "Spoiler Therapy", short: "Spoiler", c: "#ff9a4d", x: 0, z: 18, div: ["side"] },
];
/* Agents with no building yet wait here, in the middle of the city. */
export const LOBBY = { id: "lobby", name: "Lobby", short: "Lobby", sub: "Not placed yet", c: "#b98cff", x: 0, z: -5.2 };
export const PLACES = BUILDINGS.concat(LOBBY);

/* Decisions still carry the dashboard's division codes, so the whiteboard needs their names and colours. */
export const DIV = {
  cos: { s: "CHIEF OF STAFF", c: "#e3c9ff" }, ceo: { s: "CEO OFFICE", c: "#c56bff" },
  permit: { s: "PERMITAIO", c: "#3fe0ff" }, sales: { s: "SALES", c: "#ff5fb7" },
  mkt: { s: "MARKETING", c: "#ffc94d" }, guard: { s: "GUARDIAN", c: "#4dff9a" },
  lanai: { s: "LANAI", c: "#7f9bff" }, side: { s: "SIDE QUESTS", c: "#ff9a4d" },
  majestic: { s: "MAJESTIC", c: "#5fc8ff" }, closer: { s: "CLOSER", c: "#ff5f6e" },
};
export const divColor = d => (DIV[d] || {}).c || "#b98cff";

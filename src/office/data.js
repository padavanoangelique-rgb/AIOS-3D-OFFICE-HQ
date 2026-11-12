/* The city. Agents work in the HQ office in the middle; around it stands one building per business,
   holding that business's goals, notes, ideas and materials. Edit BUILDINGS to add, rename or move one. */
export const PLAT = { grok: "#d9d9e3", claude: "#e8926a", codex: "#7ee0b0", nova: "#b89bff", hermes: "#ffd166", other: "#9a8db5" };
export const PLAT_NAME = { grok: "Grok", claude: "Claude", codex: "Codex", nova: "Nova", hermes: "Hermes", other: "Other" };
/* x / z = centre of the building, w / d = footprint, h = height.
   div = which old dashboard division starts out assigned here (until you choose yourself). */
export const BUILDINGS = [
  { id: "majestic", name: "Majestic Permits", short: "Majestic", c: "#5fc8ff", x: -10, z: -17, w: 6, d: 5, h: 7.5, div: ["majestic"] },
  { id: "closer", name: "The Permit Closer", short: "Closer", c: "#ff5f6e", x: 0, z: -17, w: 6, d: 5, h: 9, div: ["closer"] },
  { id: "hookreel", name: "Hook & Reel Weekly", short: "Hook & Reel", sub: "Marketing reels + lead generator", c: "#ffc94d", x: 10, z: -17, w: 6, d: 5, h: 7, div: ["mkt"] },
  { id: "lanai", name: "Majestic Lanai", short: "Lanai", sub: "Renew & Repair", c: "#7f9bff", x: -19, z: -5, w: 5, d: 6, h: 6, div: ["lanai"] },
  { id: "spoiler", name: "Spoiler Therapy", short: "Spoiler", c: "#ff9a4d", x: -19, z: 6, w: 5, d: 5, h: 5, div: ["side"] },
  { id: "permitaio", name: "PermitAIO", short: "PermitAIO", c: "#3fe0ff", x: 19.5, z: -6, w: 6, d: 5, h: 8.5, div: ["permit"] },
  { id: "bath", name: "Bath", short: "Bath", c: "#7fe8d2", x: 17.6, z: 1.6, w: 3.2, d: 3.2, h: 3.2, small: true },
  { id: "ezbuilder", name: "EZ Permit Builder", short: "EZ Builder", c: "#58c7f3", x: 21.8, z: 1.6, w: 3.2, d: 3.2, h: 3.6, small: true },
  { id: "ezforms", name: "EZForms", short: "EZForms", c: "#8fb4ff", x: 17.6, z: 6.6, w: 3.2, d: 3.2, h: 3.4, small: true },
  { id: "expediter", name: "Expediter", short: "Expediter", c: "#4dff9a", x: 21.8, z: 6.6, w: 3.2, d: 3.2, h: 3, small: true },
];
export const NONE = { id: "none", name: "No business yet", short: "Unassigned", c: "#8f7fb8" };
export const PLACES = BUILDINGS.concat(NONE);
export const placeOfId = id => PLACES.find(p => p.id === id) || NONE;
export const KINDS = [["goal", "Goals"], ["note", "Notes"], ["idea", "Ideas"], ["material", "Materials"]];

/* Decisions still carry the dashboard's division codes, so the whiteboard needs their names and colours. */
export const DIV = {
  cos: { s: "CHIEF OF STAFF", c: "#e3c9ff" }, ceo: { s: "CEO OFFICE", c: "#c56bff" },
  permit: { s: "PERMITAIO", c: "#3fe0ff" }, sales: { s: "SALES", c: "#ff5fb7" },
  mkt: { s: "MARKETING", c: "#ffc94d" }, guard: { s: "GUARDIAN", c: "#4dff9a" },
  lanai: { s: "LANAI", c: "#7f9bff" }, side: { s: "SIDE QUESTS", c: "#ff9a4d" },
  majestic: { s: "MAJESTIC", c: "#5fc8ff" }, closer: { s: "CLOSER", c: "#ff5f6e" },
};
export const divColor = d => (DIV[d] || {}).c || "#b98cff";

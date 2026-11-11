/* Division and platform colours, and the room grid. Mirrors the 2D dashboard so both views agree. */
export const DIV = {
  cos: { s: "CHIEF OF STAFF", c: "#e3c9ff" }, ceo: { s: "CEO OFFICE", c: "#c56bff" },
  permit: { s: "PERMITAIO", c: "#3fe0ff" }, sales: { s: "SALES", c: "#ff5fb7" },
  mkt: { s: "MARKETING", c: "#ffc94d" }, guard: { s: "GUARDIAN", c: "#4dff9a" },
  lanai: { s: "LANAI", c: "#7f9bff" }, side: { s: "SIDE QUESTS", c: "#ff9a4d" },
  majestic: { s: "MAJESTIC", c: "#5fc8ff" }, closer: { s: "CLOSER", c: "#ff5f6e" },
};
export const PLAT = { grok: "#d9d9e3", claude: "#e8926a", codex: "#7ee0b0", nova: "#b89bff", hermes: "#ffd166", other: "#9a8db5" };
/* [division, x, z, width, depth] in floor tiles */
export const ROOMS = [["cos", 0, 0, 5, 6], ["ceo", 6, 0, 13, 6], ["permit", 0, 7, 4, 6], ["sales", 5, 7, 4, 6], ["mkt", 10, 7, 4, 6],
  ["guard", 15, 7, 4, 6], ["lanai", 0, 14, 4, 6], ["side", 5, 14, 4, 6], ["majestic", 10, 14, 4, 6], ["closer", 15, 14, 4, 6]];
export const divColor = d => (DIV[d] || {}).c || "#b98cff";

import type { Block } from "../types";

export const blocks: Block[] = [
  { id: 0, name: "Capacitive touch", days: [1, 3], accent: "#b06a3c" },
  { id: 1, name: "Passives & filters", days: [4, 10], accent: "#6a8760" },
  { id: 2, name: "Devices", days: [11, 18], accent: "#5680a3" },
  { id: 3, name: "Op-amps & PLLs", days: [19, 24], accent: "#8a6aa0" },
  { id: 4, name: "Power electronics", days: [25, 33], accent: "#b24d45" },
  { id: 5, name: "RF", days: [34, 41], accent: "#46918b" },
  { id: 6, name: "Digital design", days: [42, 47], accent: "#a8823a" },
  { id: 7, name: "Firmware", days: [48, 50], accent: "#6b7580" },
];

export const blockById = (id: number): Block => blocks[id];

/** Challenge starts Fri Aug 7, 2026 — day 1. */
export const CHALLENGE_START = new Date(2026, 7, 7);

export const dateForDay = (day: number): Date => {
  const d = new Date(CHALLENGE_START);
  d.setDate(d.getDate() + (day - 1));
  return d;
};

export const formatDate = (d: Date): string =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const formatDateLong = (d: Date): string =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

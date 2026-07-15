import type { Block } from "../types";

export const blocks: Block[] = [
  { id: 0, name: "Capacitive touch", days: [1, 3], accent: "#a4633a", tint: "#f6eae1" },
  { id: 1, name: "Passives & filters", days: [4, 10], accent: "#5f7a56", tint: "#eaf0e5" },
  { id: 2, name: "Devices", days: [11, 18], accent: "#4e6e8e", tint: "#e5edf3" },
  { id: 3, name: "Op-amps & PLLs", days: [19, 24], accent: "#7a5e8f", tint: "#efe9f4" },
  { id: 4, name: "Power electronics", days: [25, 33], accent: "#a0453e", tint: "#f7e7e4" },
  { id: 5, name: "RF", days: [34, 41], accent: "#3e7f7a", tint: "#e2f0ee" },
  { id: 6, name: "Digital design", days: [42, 47], accent: "#96742b", tint: "#f5edda" },
  { id: 7, name: "Firmware", days: [48, 50], accent: "#5a6670", tint: "#e9edef" },
];

export const blockById = (id: number): Block => blocks[id];

/** Challenge starts Mon Jul 20, 2026 — day 1. */
export const CHALLENGE_START = new Date(2026, 6, 20);

export const dateForDay = (day: number): Date => {
  const d = new Date(CHALLENGE_START);
  d.setDate(d.getDate() + (day - 1));
  return d;
};

export const formatDate = (d: Date): string =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const formatDateLong = (d: Date): string =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

import type { Day } from "../types";

/**
 * The 50 days. Dates are computed from the day number (day 1 = Mon Jul 20, 2026),
 * so only the day number, block, and topic live here.
 *
 * To fill in a day's content, add any of these keys with a markdown string:
 *   intro      — introduction and background you need
 *   activity   — activity to do
 *   question   — question to answer
 *   xPost      — X post
 *   resources  — additional resources
 *
 * Example:
 *   {
 *     day: 4,
 *     blockId: 1,
 *     topic: "Capacitor step response",
 *     intro: `A capacitor resists *changes* in voltage...`,
 *     activity: `Sketch Vc(t) and I(t) for a 5 V step through 10 kΩ into 1 µF...`,
 *   },
 */
export const days: Day[] = [
  // Block 0 — Capacitive touch kickstart
  { day: 1, blockId: 0, topic: "Touch pad relaxation oscillator" },
  { day: 2, blockId: 0, topic: "Charge-transfer sensing" },
  { day: 3, blockId: 0, topic: "Foil matrix & ghost touches" },

  // Block 1 — Passives & filters
  { day: 4, blockId: 1, topic: "Capacitor step response" },
  { day: 5, blockId: 1, topic: "Your capacitor is lying" },
  { day: 6, blockId: 1, topic: "Inductor kickback" },
  { day: 7, blockId: 1, topic: "Skin effect" },
  { day: 8, blockId: 1, topic: "LPF or HPF in 30 seconds" },
  { day: 9, blockId: 1, topic: "Band-pass & Bode by hand" },
  { day: 10, blockId: 1, topic: "Puzzle day #1", puzzle: true },

  // Block 2 — Devices
  { day: 11, blockId: 2, topic: "Diode speed-review" },
  { day: 12, blockId: 2, topic: "BJT: measure β, then distrust it" },
  { day: 13, blockId: 2, topic: "Taming the BJT + the current mirror" },
  { day: 14, blockId: 2, topic: "MOSFET: find your Vth" },
  { day: 15, blockId: 2, topic: "The gate is not free" },
  { day: 16, blockId: 2, topic: "The three topologies" },
  { day: 17, blockId: 2, topic: "CMOS from zero" },
  { day: 18, blockId: 2, topic: "Puzzle day #2: name that circuit", puzzle: true },

  // Block 3 — Op-amps & PLLs
  { day: 19, blockId: 3, topic: "Derive, then build" },
  { day: 20, blockId: 3, topic: "Measure the datasheet" },
  { day: 21, blockId: 3, topic: "One method, four circuits" },
  { day: 22, blockId: 3, topic: "Make it sing, then make it decide" },
  { day: 23, blockId: 3, topic: "Lock a PLL" },
  { day: 24, blockId: 3, topic: "Puzzle day #3: the Fronczak gauntlet", puzzle: true },

  // Block 4 — Power electronics
  { day: 25, blockId: 4, topic: "LDO or buck, rail by rail" },
  { day: 26, blockId: 4, topic: "Build the LDO you named on Day 18" },
  { day: 27, blockId: 4, topic: "Buck converter on paper, then in SPICE" },
  { day: 28, blockId: 4, topic: "Interrogate a real buck" },
  { day: 29, blockId: 4, topic: "Two ways to get MORE volts" },
  { day: 30, blockId: 4, topic: "H-bridge" },
  { day: 31, blockId: 4, topic: "Current sensing" },
  { day: 32, blockId: 4, topic: "Batteries & BMS" },
  { day: 33, blockId: 4, topic: "Puzzle day #4: power gauntlet", puzzle: true },

  // Block 5 — RF
  { day: 34, blockId: 5, topic: "Reflections" },
  { day: 35, blockId: 5, topic: "Learn to speak S11" },
  { day: 36, blockId: 5, topic: "Why the Smith chart is round" },
  { day: 37, blockId: 5, topic: "The two-move match" },
  { day: 38, blockId: 5, topic: "Calibrate, then trust" },
  { day: 39, blockId: 5, topic: "Cut an antenna" },
  { day: 40, blockId: 5, topic: "Your hand is a component" },
  { day: 41, blockId: 5, topic: "Capstone: does the link close?", puzzle: true },

  // Block 6 — Digital design
  { day: 42, blockId: 6, topic: "Blocking vs non-blocking" },
  { day: 43, blockId: 6, topic: "FSM under interview conditions" },
  { day: 44, blockId: 6, topic: "Timing math, out loud" },
  { day: 45, blockId: 6, topic: "Metastability & CDC" },
  { day: 46, blockId: 6, topic: "Pipeline something" },
  { day: 47, blockId: 6, topic: "Boss puzzle: the FIFO", puzzle: true },

  // Block 7 — Firmware
  { day: 48, blockId: 7, topic: "Catch a race with your own hands" },
  { day: 49, blockId: 7, topic: "DMA end to end" },
  { day: 50, blockId: 7, topic: "Ring buffer + the exit interview" },
];

export const dayByNumber = (n: number): Day | undefined => days.find((d) => d.day === n);

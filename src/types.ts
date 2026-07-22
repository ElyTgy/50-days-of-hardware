export interface Block {
  id: number;
  name: string;
  days: [number, number];
  /** strong accent — text, borders, chips. Soft tints are derived from this
   *  in CSS via color-mix, so they adapt to light/dark automatically. */
  accent: string;
}

/** The markdown content sections a day can have. The first six are the
 *  structured "self-contained page" parts; the last three are the classic
 *  Start / Answer this / Check trio every day has had from the start. */
export const DAY_SECTIONS = [
  ["equipment", "Equipment needed"],
  ["prerequisites", "Prerequisites"],
  ["intro", "Introduction & background"],
  ["equations", "Core equations"],
  ["diagram", "Diagram"],
  ["assembled", "What you're building"],
  ["activity", "Activity"],
  ["question", "Question to answer"],
  ["resources", "Additional resources"],
] as const;

export type DaySectionField = (typeof DAY_SECTIONS)[number][0];

/** Sections that always show on a day page (empty or not); the rest appear
 *  only when they have content or the owner is in edit mode. */
export const CORE_SECTIONS: DaySectionField[] = [
  "intro",
  "activity",
  "question",
  "resources",
];

/** A day as stored in Supabase (and mirrored in app state).
 *  `position` orders the calendar; fractional values allow inserting between
 *  neighbours without renumbering. `null` position = docked in the staging
 *  area (no day number, no date). Day numbers are computed from order. */
export interface Day extends Partial<Record<DaySectionField, string>> {
  id: string;
  position: number | null;
  blockId: number;
  topic: string;
  puzzle: boolean;
  created_at?: string;
}

/** A scheduled day with its computed 1-based calendar number. */
export type ScheduledDay = Day & { number: number };

/** Shape of the hardcoded seed in src/data/days.ts — `day` doubles as the
 *  seed position. Kept only as the no-backend fallback and the source the
 *  schema.sql seed was generated from. */
export interface SeedDay {
  day: number;
  blockId: number;
  topic: string;
  puzzle?: boolean;
  intro?: string;
  activity?: string;
  question?: string;
  resources?: string;
}

export type ShoppingStatus =
  | "not ordered"
  | "waiting for pick up"
  | "in delivery"
  | "owned";

export const SHOPPING_STATUSES: ShoppingStatus[] = [
  "not ordered",
  "waiting for pick up",
  "in delivery",
  "owned",
];

export interface ShoppingItem {
  id: string;
  part_name: string;
  what_it_does: string;
  days_required_for: string;
  related_concepts: string;
  link: string;
  status: ShoppingStatus;
  purchased: boolean;
  created_at?: string;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  created_at?: string;
}

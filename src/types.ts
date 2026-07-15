export interface Block {
  id: number;
  name: string;
  days: [number, number];
  /** strong accent — text, borders, chips */
  accent: string;
  /** soft tint — calendar cell background */
  tint: string;
}

export interface Day {
  day: number;
  blockId: number;
  topic: string;
  puzzle?: boolean;
  /** markdown — fill these in days.ts as you go */
  intro?: string;
  activity?: string;
  question?: string;
  xPost?: string;
  resources?: string;
}

export interface ShoppingItem {
  id: string;
  part_name: string;
  what_it_does: string;
  days_required_for: string;
  related_concepts: string;
  link: string;
  purchased: boolean;
  created_at?: string;
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  created_at?: string;
}

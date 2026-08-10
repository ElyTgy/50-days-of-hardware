import { supabase } from "./supabase";

/** One freeform note per day, keyed under this fixed section — replaces the
 *  old per-section notes so all of a day's writing lives in one place. */
export const NOTES_SECTION = "notes";

export interface DayNote {
  content: string;
  /** ISO timestamp of the last save, or null if the day has no note yet. */
  writtenAt: string | null;
}

/** Fetch a day's note (empty if none, or if there's no backend). */
export async function fetchDayNote(dayId: string): Promise<DayNote> {
  if (!supabase) return { content: "", writtenAt: null };
  const { data } = await supabase
    .from("day_notes")
    .select("content, updated_at")
    .eq("day_id", dayId)
    .eq("section", NOTES_SECTION)
    .maybeSingle();
  return {
    content: data?.content ?? "",
    writtenAt: data?.content ? (data.updated_at ?? null) : null,
  };
}

/** day_id → ISO written-at timestamp for every day with a non-empty note,
 *  so the calendar can tell written days from unwritten ones in one query.
 *  Null (rather than an empty map) when there's no backend to ask. */
export async function fetchWrittenDays(): Promise<Map<string, string> | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("day_notes")
    .select("day_id, updated_at")
    .eq("section", NOTES_SECTION)
    .neq("content", "");
  return new Map((data ?? []).map((r) => [r.day_id, r.updated_at]));
}

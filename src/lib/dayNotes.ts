import { supabase } from "./supabase";

/** One freeform note per day, keyed under this fixed section — replaces the
 *  old per-section notes so all of a day's writing lives in one place. */
export const NOTES_SECTION = "notes";

/** Fetch a day's note content (empty string if none, or if there's no backend). */
export async function fetchDayNoteContent(dayId: string): Promise<string> {
  if (!supabase) return "";
  const { data } = await supabase
    .from("day_notes")
    .select("content")
    .eq("day_id", dayId)
    .eq("section", NOTES_SECTION)
    .maybeSingle();
  return data?.content ?? "";
}

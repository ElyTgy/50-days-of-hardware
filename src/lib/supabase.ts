import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Accept either name — Supabase's newer dashboards call it the "publishable" key.
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;

/** Null until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set — the app
 *  renders fine without it, it just can't persist anything. */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = supabase !== null;

const IMAGE_BUCKET = "images";

/** Upload a pasted/dropped image and return a public URL for markdown embedding. */
export async function uploadImage(file: File, prefix: string): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured");
  const ext = file.name.split(".").pop() || file.type.split("/")[1] || "png";
  const path = `${prefix}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file);
  if (error) throw error;
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

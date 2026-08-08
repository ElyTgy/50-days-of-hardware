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

// Videos share the bucket; it kept its original name to avoid a migration.
const MEDIA_BUCKET = "images";

/** iPhone photos arrive as HEIC, which Chrome/Firefox can't decode — an
 *  <img> pointing at one collapses to nothing. Detect by type or extension
 *  (the type is sometimes empty on drag-and-drop). */
export function isHeic(file: File): boolean {
  return /^image\/hei[cf]$/.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/** Convert anything non-web-displayable to JPEG; pass web formats through.
 *  The wasm decoder is heavy, so it's only loaded when a HEIC shows up. */
async function toWebImage(file: File): Promise<{ blob: Blob; ext: string; contentType: string }> {
  if (isHeic(file)) {
    const { heicTo } = await import("heic-to");
    const blob = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
    return { blob, ext: "jpg", contentType: "image/jpeg" };
  }
  const ext = file.name.split(".").pop() || file.type.split("/")[1] || "png";
  return { blob: file, ext, contentType: file.type || "image/png" };
}

/** Video formats browsers can play natively; detected by type or extension
 *  (the type is sometimes empty on drag-and-drop). */
export function isVideo(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name);
}

/** Upload a pasted/dropped image or video and return a public URL for
 *  markdown embedding. Videos upload as-is; images convert if needed. */
export async function uploadMedia(file: File, prefix: string): Promise<string> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { blob, ext, contentType } = isVideo(file)
    ? {
        blob: file as Blob,
        ext: file.name.split(".").pop()?.toLowerCase() || "mp4",
        contentType: file.type || "video/mp4",
      }
    : await toWebImage(file);
  const path = `${prefix}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, { contentType });
  if (error) {
    // The project's storage cap (50 MB by default) is the usual reason a
    // video fails while images sail through — say so instead of a shrug.
    throw new Error(
      /exceeded the maximum allowed size/i.test(error.message)
        ? `file is over the storage upload limit (${Math.round(blob.size / 1e6)} MB > 50 MB)`
        : error.message,
    );
  }
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, uploadImage } from "../lib/supabase";
import Markdown from "./Markdown";

type Status = "loading" | "saved" | "saving" | "unsaved" | "error" | "offline";

const STATUS_LABEL: Record<Status, string> = {
  loading: "loading…",
  saved: "saved",
  saving: "saving…",
  unsaved: "unsaved",
  error: "save failed — retrying on next edit",
  offline: "not saved (Supabase not connected)",
};

/** Per-day markdown notes: edit/preview tabs, debounced autosave to the
 *  day_notes table, and paste/drag-drop image upload to Supabase Storage. */
export default function NotesEditor({ day }: { day: number }) {
  const [text, setText] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [status, setStatus] = useState<Status>(supabase ? "loading" : "offline");
  const [dragover, setDragover] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    setStatus("loading");
    supabase
      .from("day_notes")
      .select("content")
      .eq("day", day)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setText(data?.content ?? "");
        setStatus(error ? "error" : "saved");
      });
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [day]);

  const save = useCallback(
    async (content: string) => {
      if (!supabase) return;
      setStatus("saving");
      const { error } = await supabase
        .from("day_notes")
        .upsert({ day, content, updated_at: new Date().toISOString() });
      setStatus(error ? "error" : "saved");
    },
    [day],
  );

  const onChange = (value: string) => {
    setText(value);
    if (!supabase) return;
    setStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(value), 800);
  };

  const insertAtCursor = (snippet: string) => {
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? text.length;
    const next = text.slice(0, pos) + snippet + text.slice(pos);
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(pos + snippet.length, pos + snippet.length);
    });
  };

  const handleFiles = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    if (!supabase) {
      insertAtCursor(`\n*(connect Supabase to upload images)*\n`);
      return;
    }
    for (const file of images) {
      const placeholder = `\n![uploading…]()\n`;
      insertAtCursor(placeholder);
      try {
        const url = await uploadImage(file, `day-${day}`);
        setText((t) => {
          const next = t.replace(placeholder, `\n![](${url})\n`);
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveTimer.current = setTimeout(() => save(next), 400);
          return next;
        });
      } catch {
        setText((t) => t.replace(placeholder, `\n*(image upload failed)*\n`));
      }
    }
  };

  return (
    <section className="notes">
      <div className="notes-head">
        <h2 className="day-section-title" style={{ margin: 0 }}>
          Notes
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="notes-status">{STATUS_LABEL[status]}</span>
          <div className="notes-tabs">
            <button
              className={tab === "write" ? "active" : ""}
              onClick={() => setTab("write")}
            >
              Write
            </button>
            <button
              className={tab === "preview" ? "active" : ""}
              onClick={() => setTab("preview")}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      {tab === "write" ? (
        <>
          <textarea
            ref={textareaRef}
            className={`notes-textarea${dragover ? " dragover" : ""}`}
            value={text}
            placeholder="Measurements, sketches, links, what surprised you…"
            onChange={(e) => onChange(e.target.value)}
            onPaste={(e) => {
              const files = Array.from(e.clipboardData.files);
              if (files.some((f) => f.type.startsWith("image/"))) {
                e.preventDefault();
                handleFiles(files);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragover(true);
            }}
            onDragLeave={() => setDragover(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragover(false);
              handleFiles(Array.from(e.dataTransfer.files));
            }}
          />
          <p className="notes-hint">
            markdown · paste or drop images to upload · autosaves as you type
          </p>
        </>
      ) : (
        <div className="notes-preview">
          {text ? (
            <Markdown>{text}</Markdown>
          ) : (
            <p className="day-section-empty">Nothing here yet.</p>
          )}
        </div>
      )}
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, uploadImage } from "../lib/supabase";
import Markdown from "./Markdown";

type Status = "idle" | "saving" | "saved" | "error";

/**
 * Inline notes for one section of a day — Notion-style: click the text to
 * edit, click away to render. No visible box. Content is markdown + LaTeX +
 * images (paste or drop). Autosaves to day_notes, keyed by (day, section).
 */
export default function NoteBlock({
  day,
  section,
}: {
  day: number;
  section: string;
}) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [dragover, setDragover] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from("day_notes")
      .select("content")
      .eq("day", day)
      .eq("section", section)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setText(data?.content ?? "");
      });
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [day, section]);

  const grow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (editing) {
      grow();
      textareaRef.current?.focus();
    }
  }, [editing, grow]);

  const save = useCallback(
    async (content: string) => {
      if (!supabase) return;
      setStatus("saving");
      const { error } = await supabase
        .from("day_notes")
        .upsert(
          { day, section, content, updated_at: new Date().toISOString() },
          { onConflict: "day,section" },
        );
      setStatus(error ? "error" : "saved");
    },
    [day, section],
  );

  const scheduleSave = (content: string, delay = 700) => {
    if (!supabase) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(content), delay);
  };

  const onChange = (value: string) => {
    setText(value);
    grow();
    scheduleSave(value);
  };

  const insertAtCursor = (snippet: string) => {
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? text.length;
    const next = text.slice(0, pos) + snippet + text.slice(pos);
    setText(next);
    scheduleSave(next, 400);
    requestAnimationFrame(() => {
      grow();
      el?.focus();
      el?.setSelectionRange(pos + snippet.length, pos + snippet.length);
    });
  };

  const handleFiles = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    if (!supabase) {
      insertAtCursor("\n_(connect Supabase to upload images)_\n");
      return;
    }
    for (const file of images) {
      const placeholder = "\n![uploading…]()\n";
      insertAtCursor(placeholder);
      try {
        const url = await uploadImage(file, `day-${day}/${section}`);
        setText((t) => {
          const next = t.replace(placeholder, `\n![](${url})\n`);
          scheduleSave(next, 300);
          return next;
        });
      } catch {
        setText((t) => t.replace(placeholder, "\n_(image upload failed)_\n"));
      }
    }
  };

  const finishEditing = () => {
    setEditing(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    save(text);
  };

  if (editing) {
    return (
      <div className="note">
        <textarea
          ref={textareaRef}
          className={`note-input${dragover ? " dragover" : ""}`}
          value={text}
          placeholder="Write a note… markdown, $LaTeX$, paste or drop images"
          onChange={(e) => onChange(e.target.value)}
          onBlur={finishEditing}
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
        <span className="note-status">
          {status === "saving" ? "saving…" : status === "error" ? "save failed" : ""}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`note note-rendered${text ? "" : " empty"}`}
      role="textbox"
      tabIndex={0}
      onClick={() => setEditing(true)}
      onFocus={() => setEditing(true)}
    >
      {text ? <Markdown>{text}</Markdown> : <span className="note-placeholder">Add a note</span>}
    </div>
  );
}

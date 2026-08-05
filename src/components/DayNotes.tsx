import { useCallback, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { NOTES_SECTION } from "../lib/dayNotes";
import Markdown from "./Markdown";
import MarkdownEditor from "./MarkdownEditor";

type Status = "idle" | "saving" | "saved" | "error";

interface Props {
  dayId: string;
  /** content already fetched by the caller (DayPage decides whether this
   *  component mounts at all, so it always starts with a known value) */
  initialContent: string;
  autoFocus?: boolean;
}

/**
 * The "Writing" side of a day page — a single markdown scratchpad for the
 * whole day, edited live Obsidian-style (see MarkdownEditor). Autosaves to
 * day_notes under a fixed `section` so it survives calendar reordering.
 * Only ever mounted once there's something to show or the owner has chosen
 * to start writing — see DayPage.
 */
export default function DayNotes({ dayId, initialContent, autoFocus }: Props) {
  const { canEdit } = useAuth();
  const [text, setText] = useState(initialContent);
  const [status, setStatus] = useState<Status>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const save = useCallback(
    async (content: string) => {
      if (!supabase) return;
      setStatus("saving");
      const { error } = await supabase
        .from("day_notes")
        .upsert(
          {
            day_id: dayId,
            section: NOTES_SECTION,
            content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "day_id,section" },
        );
      setStatus(error ? "error" : "saved");
    },
    [dayId],
  );

  const onChange = (value: string) => {
    setText(value);
    if (!supabase) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(value), 700);
  };

  // Read-only viewers just see the rendered note.
  if (!canEdit) {
    return (
      <div className="day-notes">
        <h2 className="day-notes-title">Notes</h2>
        <div className="day-notes-render">
          <Markdown>{text}</Markdown>
        </div>
      </div>
    );
  }

  return (
    <div className="day-notes">
      <div className="day-notes-head">
        <h2 className="day-notes-title">Notes</h2>
        <span className="day-notes-status">
          {status === "saving"
            ? "saving…"
            : status === "error"
              ? "save failed"
              : ""}
        </span>
      </div>

      <MarkdownEditor
        key={dayId}
        value={text}
        onChange={onChange}
        placeholder="Write today's notes… markdown, $LaTeX$, paste or drop images"
        imagePrefix={`day-${dayId}/${NOTES_SECTION}`}
        className="day-notes-editor"
        autoFocus={autoFocus}
      />
    </div>
  );
}

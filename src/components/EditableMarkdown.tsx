import { useCallback, useEffect, useRef, useState } from "react";
import { isHeic, isVideo, supabase, uploadMedia } from "../lib/supabase";
import Markdown from "./Markdown";

interface Props {
  value: string;
  onSave: (next: string) => void;
  placeholder?: string;
  /** storage path prefix for pasted/dropped images */
  imagePrefix?: string;
}

/**
 * Click-to-edit markdown, Notion-style — shares the .note-* styles used
 * elsewhere for inline editing, but controlled by the caller: renders
 * `value`, saves on blur via `onSave`. Used for a day's fixed content in
 * edit mode. Supports pasting/dropping images like notes do.
 */
export default function EditableMarkdown({
  value,
  onSave,
  placeholder = "Write…",
  imagePrefix = "content",
}: Props) {
  const [text, setText] = useState(value);
  const [editing, setEditing] = useState(false);
  const [dragover, setDragover] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Follow external changes while not actively editing.
  useEffect(() => {
    if (!editing) setText(value);
  }, [value, editing]);

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

  const insertAtCursor = (snippet: string) => {
    const el = textareaRef.current;
    const pos = el?.selectionStart ?? text.length;
    setText((t) => t.slice(0, pos) + snippet + t.slice(pos));
    requestAnimationFrame(() => {
      grow();
      el?.focus();
      el?.setSelectionRange(pos + snippet.length, pos + snippet.length);
    });
  };

  const handleFiles = async (files: File[]) => {
    const media = files.filter((f) => f.type.startsWith("image/") || isHeic(f) || isVideo(f));
    if (media.length === 0) return;
    if (!supabase) {
      insertAtCursor("\n_(connect Supabase to upload media)_\n");
      return;
    }
    for (const file of media) {
      const uploadingMark = "\n![uploading…]()\n";
      insertAtCursor(uploadingMark);
      try {
        const url = await uploadMedia(file, imagePrefix);
        // "|60" = start at 60% width; resizable in the notes editor.
        setText((t) => t.replace(uploadingMark, `\n![|60](${url})\n`));
      } catch {
        setText((t) => t.replace(uploadingMark, "\n_(upload failed)_\n"));
      }
    }
  };

  const finishEditing = () => {
    setEditing(false);
    if (text !== value) onSave(text);
  };

  // Same editing shortcuts as the CodeMirror notes editor: Tab inserts four
  // spaces (Shift-Tab un-indents the line), Cmd/Ctrl+B, +I and +U toggle
  // bold/italic/underline. execCommand keeps the native undo stack working
  // and fires the input event React's onChange already listens to.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const { value: v, selectionStart: start, selectionEnd: end } = el;

    const exec = (from: number, to: number, insert: string, selFrom: number, selTo: number) => {
      e.preventDefault();
      el.setSelectionRange(from, to);
      document.execCommand(insert ? "insertText" : "delete", false, insert || undefined);
      el.setSelectionRange(selFrom, selTo);
      setText(el.value);
      grow();
    };

    if (e.key === "Tab" && !e.shiftKey) {
      exec(start, end, "    ", start + 4, start + 4);
    } else if (e.key === "Tab" && e.shiftKey) {
      const lineStart = v.lastIndexOf("\n", start - 1) + 1;
      const dedent = /^( {1,4}|\t)/.exec(v.slice(lineStart))?.[0].length ?? 0;
      if (dedent > 0) {
        exec(
          lineStart,
          lineStart + dedent,
          "",
          Math.max(lineStart, start - dedent),
          Math.max(lineStart, end - dedent),
        );
      } else {
        e.preventDefault();
      }
    } else if (
      (e.metaKey || e.ctrlKey) &&
      !e.altKey &&
      (e.key === "b" || e.key === "i" || e.key === "u")
    ) {
      // Underline has no markdown syntax, so Cmd/Ctrl+U wraps in literal
      // <u>…</u> tags (rendered by rehype-raw in the read-only view).
      const [open, close] =
        e.key === "b" ? ["**", "**"] : e.key === "i" ? ["*", "*"] : ["<u>", "</u>"];
      const oLen = open.length;
      const cLen = close.length;
      const sel = v.slice(start, end);
      if (sel.startsWith(open) && sel.endsWith(close) && sel.length >= oLen + cLen) {
        exec(start, end, sel.slice(oLen, -cLen), start, end - oLen - cLen);
      } else if (start >= oLen && v.slice(start - oLen, start) === open && v.slice(end, end + cLen) === close) {
        exec(start - oLen, end + cLen, sel, start - oLen, end - oLen);
      } else {
        // Cursor/selection inside an existing bold/italic/underline span ->
        // strip that span's markers instead of nesting a new pair.
        const spanRe =
          e.key === "b"
            ? /\*\*([^\n*][^\n]*?)\*\*/g
            : e.key === "i"
              ? /(?<!\*)\*([^\n*][^\n]*?)\*(?!\*)/g
              : /<u>([^\n]*?)<\/u>/g;
        let span: RegExpExecArray | null = null;
        for (let m = spanRe.exec(v); m; m = spanRe.exec(v)) {
          if (m.index > start) break;
          if (end <= m.index + m[0].length) {
            span = m;
            break;
          }
        }
        if (span) {
          const sFrom = span.index;
          const sTo = sFrom + span[0].length;
          const clamp = (p: number) => Math.min(Math.max(p - oLen, sFrom), sTo - oLen - cLen);
          exec(sFrom, sTo, span[1], clamp(start), clamp(end));
        } else {
          exec(start, end, open + sel + close, start + oLen, end + oLen);
        }
      }
    }
  };

  if (editing) {
    return (
      <div className="note">
        <textarea
          ref={textareaRef}
          className={`note-input${dragover ? " dragover" : ""}`}
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value);
            grow();
          }}
          onBlur={finishEditing}
          onKeyDown={handleKeyDown}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData.files);
            if (files.some((f) => f.type.startsWith("image/") || isHeic(f) || isVideo(f))) {
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
      {text ? (
        <Markdown>{text}</Markdown>
      ) : (
        <span className="note-placeholder">{placeholder}</span>
      )}
    </div>
  );
}

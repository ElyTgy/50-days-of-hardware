import { useCallback, useEffect, useRef, useState } from "react";
import { supabase, uploadImage } from "../lib/supabase";
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
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    if (!supabase) {
      insertAtCursor("\n_(connect Supabase to upload images)_\n");
      return;
    }
    for (const file of images) {
      const uploadingMark = "\n![uploading…]()\n";
      insertAtCursor(uploadingMark);
      try {
        const url = await uploadImage(file, imagePrefix);
        setText((t) => t.replace(uploadingMark, `\n![](${url})\n`));
      } catch {
        setText((t) => t.replace(uploadingMark, "\n_(image upload failed)_\n"));
      }
    }
  };

  const finishEditing = () => {
    setEditing(false);
    if (text !== value) onSave(text);
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

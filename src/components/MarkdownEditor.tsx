import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { dropCursor, EditorView, keymap, placeholder as placeholderExt } from "@codemirror/view";
import { liveMarkdown } from "../lib/liveMarkdown";
import { supabase, uploadImage } from "../lib/supabase";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** storage path prefix for pasted/dropped images */
  imagePrefix?: string;
  className?: string;
  /** focus the editor as soon as it mounts */
  autoFocus?: boolean;
}

/**
 * A single-pane markdown editor that renders formatting inline as you type:
 * headings grow, bold/italic/code/links render, images appear inline - all
 * while staying a plain text document underneath (Obsidian's "Live
 * Preview"). Marks only reveal their raw syntax while the cursor is inside
 * them. Built on CodeMirror, which is what Obsidian's editor is built on.
 */
export default function MarkdownEditor({
  value,
  onChange,
  placeholder: placeholderText,
  imagePrefix = "notes",
  className,
  autoFocus,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hostRef.current) return;

    const insertAtCursor = (snippet: string) => {
      const view = viewRef.current;
      if (!view) return { from: 0, to: 0 };
      const { from } = view.state.selection.main;
      view.dispatch({
        changes: { from, insert: snippet },
        selection: { anchor: from + snippet.length },
      });
      return { from, to: from + snippet.length };
    };

    const replaceIfUnchanged = (range: { from: number; to: number }, expect: string, next: string) => {
      const view = viewRef.current;
      if (!view) return;
      if (view.state.sliceDoc(range.from, range.to) === expect) {
        view.dispatch({ changes: { from: range.from, to: range.to, insert: next } });
      }
    };

    const handleFiles = async (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) return;
      if (!supabase) {
        insertAtCursor("\n_(connect Supabase to upload images)_\n");
        return;
      }
      for (const file of images) {
        const marker = "\n![uploading…]()\n";
        const range = insertAtCursor(marker);
        try {
          const url = await uploadImage(file, imagePrefix);
          replaceIfUnchanged(range, marker, `\n![](${url})\n`);
        } catch {
          replaceIfUnchanged(range, marker, "\n_(image upload failed)_\n");
        }
      }
    };

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          dropCursor(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          liveMarkdown(),
          ...(placeholderText ? [placeholderExt(placeholderText)] : []),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.domEventHandlers({
            paste(event) {
              const files = Array.from(event.clipboardData?.files ?? []);
              if (files.some((f) => f.type.startsWith("image/"))) {
                event.preventDefault();
                handleFiles(files);
                return true;
              }
              return false;
            },
            drop(event) {
              const files = Array.from(event.dataTransfer?.files ?? []);
              if (files.length) {
                event.preventDefault();
                handleFiles(files);
                return true;
              }
              return false;
            },
          }),
        ],
      }),
      parent: hostRef.current,
    });
    viewRef.current = view;
    if (autoFocus) view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Runs once per mount; day-to-day switches remount this component via a
    // `key` from the caller so a fresh editor (and image prefix) is used.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} className={className} />;
}

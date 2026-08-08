import { useEffect, useRef } from "react";
import { EditorSelection, EditorState } from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentLess,
  indentMore,
} from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { dropCursor, EditorView, keymap, placeholder as placeholderExt } from "@codemirror/view";
import { liveMarkdown } from "../lib/liveMarkdown";
import { isHeic, supabase, uploadImage } from "../lib/supabase";

const INDENT = "    ";

/** Tab inserts four spaces at the cursor; with a selection it indents the
 *  selected lines instead (Shift-Tab un-indents either way). */
const insertIndent = (view: EditorView) => {
  const { state } = view;
  if (state.selection.ranges.some((r) => !r.empty)) return indentMore(view);
  view.dispatch(state.replaceSelection(INDENT), {
    scrollIntoView: true,
    userEvent: "input",
  });
  return true;
};

/** Toggle a markdown wrapper (** or *) around each selection range. With no
 *  selection, inserts the pair and leaves the cursor between the markers. */
const toggleWrap = (marker: string) => (view: EditorView) => {
  const { state } = view;
  const len = marker.length;
  const tr = state.changeByRange((range) => {
    const { from, to } = range;
    const selected = state.sliceDoc(from, to);
    // Selection includes the markers -> strip them.
    if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length >= 2 * len) {
      return {
        changes: [
          { from, to: from + len },
          { from: to - len, to },
        ],
        range: EditorSelection.range(from, to - 2 * len),
      };
    }
    // Markers sit just outside the selection/cursor -> strip them.
    if (
      from >= len &&
      state.sliceDoc(from - len, from) === marker &&
      state.sliceDoc(to, to + len) === marker
    ) {
      return {
        changes: [
          { from: from - len, to: from },
          { from: to, to: to + len },
        ],
        range: EditorSelection.range(from - len, to - len),
      };
    }
    return {
      changes: [
        { from, insert: marker },
        { from: to, insert: marker },
      ],
      range: EditorSelection.range(from + len, to + len),
    };
  });
  view.dispatch(tr, { scrollIntoView: true, userEvent: "input" });
  return true;
};

const markdownKeymap = [
  { key: "Tab", run: insertIndent, shift: indentLess },
  { key: "Mod-b", run: toggleWrap("**") },
  { key: "Mod-i", run: toggleWrap("*") },
];

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
      const images = files.filter((f) => f.type.startsWith("image/") || isHeic(f));
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
          indentUnit.of(INDENT),
          keymap.of([...markdownKeymap, ...defaultKeymap, ...historyKeymap]),
          liveMarkdown(),
          ...(placeholderText ? [placeholderExt(placeholderText)] : []),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.domEventHandlers({
            paste(event) {
              const files = Array.from(event.clipboardData?.files ?? []);
              if (files.some((f) => f.type.startsWith("image/") || isHeic(f))) {
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

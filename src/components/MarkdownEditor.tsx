import { useEffect, useRef } from "react";
import { EditorSelection, EditorState } from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentLess,
  indentMore,
} from "@codemirror/commands";
import { indentUnit, syntaxTree } from "@codemirror/language";
import type { SyntaxNode } from "@lezer/common";
import { dropCursor, EditorView, keymap, placeholder as placeholderExt } from "@codemirror/view";
import { liveMarkdown, UNDERLINE_RE } from "../lib/liveMarkdown";
import { isHeic, isVideo, supabase, uploadMedia } from "../lib/supabase";

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

/** The syntax-tree node produced by each wrapper marker. */
const WRAP_NODE: Record<string, string> = { "**": "StrongEmphasis", "*": "Emphasis" };

/** Find a bold/italic node enclosing `pos`, trying both resolution sides so
 *  cursors sitting right at a span's edge still count as inside it. */
const enclosingSpan = (state: EditorState, pos: number, name: string): SyntaxNode | null => {
  for (const side of [-1, 1] as const) {
    for (
      let node: SyntaxNode | null = syntaxTree(state).resolveInner(pos, side);
      node;
      node = node.parent
    ) {
      if (node.name === name) return node;
    }
  }
  return null;
};

/** Toggle a markdown wrapper (** or *) around each selection range. With no
 *  selection, inserts the pair and leaves the cursor between the markers;
 *  inside an existing bold/italic span, removes the span's markers instead. */
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
    // Cursor or selection sits inside an existing span -> strip its markers
    // (the actual mark nodes, so _underscore_ emphasis unwraps too).
    const span = enclosingSpan(state, from, WRAP_NODE[marker]);
    if (span && span.to >= to) {
      const marks = span.getChildren("EmphasisMark");
      const open = marks[0];
      const close = marks[marks.length - 1];
      if (open && close && open !== close) {
        const specs = [
          { from: open.from, to: open.to },
          { from: close.from, to: close.to },
        ];
        const map = state.changes(specs);
        return {
          changes: specs,
          range: EditorSelection.range(map.mapPos(range.anchor), map.mapPos(range.head)),
        };
      }
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

/** Toggle <u>…</u> around each selection range. Markdown has no underline
 *  syntax, so unlike toggleWrap this deals in asymmetric HTML tags and finds
 *  enclosing spans by regex (the parser only sees the tags as inline HTML). */
const toggleUnderline = (view: EditorView) => {
  const open = "<u>";
  const close = "</u>";
  const { state } = view;
  const tr = state.changeByRange((range) => {
    const { from, to } = range;
    const selected = state.sliceDoc(from, to);
    // Selection includes the tags -> strip them.
    if (
      selected.startsWith(open) &&
      selected.endsWith(close) &&
      selected.length >= open.length + close.length
    ) {
      return {
        changes: [
          { from, to: from + open.length },
          { from: to - close.length, to },
        ],
        range: EditorSelection.range(from, to - open.length - close.length),
      };
    }
    // Tags sit just outside the selection/cursor -> strip them.
    if (
      from >= open.length &&
      state.sliceDoc(from - open.length, from) === open &&
      state.sliceDoc(to, to + close.length) === close
    ) {
      return {
        changes: [
          { from: from - open.length, to: from },
          { from: to, to: to + close.length },
        ],
        range: EditorSelection.range(from - open.length, to - open.length),
      };
    }
    // Cursor or selection sits inside an existing span -> strip its tags.
    let span: RegExpMatchArray | null = null;
    for (const m of state.doc.toString().matchAll(UNDERLINE_RE)) {
      if (m.index > from) break;
      if (to <= m.index + m[0].length) {
        span = m;
        break;
      }
    }
    if (span) {
      const sFrom = span.index;
      const sTo = sFrom + span[0].length;
      const specs = [
        { from: sFrom, to: sFrom + open.length },
        { from: sTo - close.length, to: sTo },
      ];
      const map = state.changes(specs);
      return {
        changes: specs,
        range: EditorSelection.range(map.mapPos(range.anchor), map.mapPos(range.head)),
      };
    }
    return {
      changes: [
        { from, insert: open },
        { from: to, insert: close },
      ],
      range: EditorSelection.range(from + open.length, to + open.length),
    };
  });
  view.dispatch(tr, { scrollIntoView: true, userEvent: "input" });
  return true;
};

const markdownKeymap = [
  { key: "Tab", run: insertIndent, shift: indentLess },
  { key: "Mod-b", run: toggleWrap("**") },
  { key: "Mod-i", run: toggleWrap("*") },
  { key: "Mod-u", run: toggleUnderline },
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
      const media = files.filter((f) => f.type.startsWith("image/") || isHeic(f) || isVideo(f));
      if (media.length === 0) return;
      if (!supabase) {
        insertAtCursor("\n_(connect Supabase to upload media)_\n");
        return;
      }
      for (const file of media) {
        const marker = "\n![uploading…]()\n";
        const range = insertAtCursor(marker);
        try {
          const url = await uploadMedia(file, imagePrefix);
          // "|60" = start at 60% width; drag the corner handle to adjust.
          replaceIfUnchanged(range, marker, `\n![|60](${url})\n`);
        } catch {
          replaceIfUnchanged(range, marker, "\n_(upload failed)_\n");
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
              if (files.some((f) => f.type.startsWith("image/") || isHeic(f) || isVideo(f))) {
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

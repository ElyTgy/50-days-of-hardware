import { syntaxTree } from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";
import type { SyntaxNode } from "@lezer/common";
import { GFM } from "@lezer/markdown";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";

/**
 * Obsidian-style "live preview" for CodeMirror: the document IS plain
 * markdown text the whole time (nothing else is stored), but syntax marks
 * (#, **, _, `, [...](...)  render as their formatted result — bold shows
 * bold, a heading shows heading-sized — and only reveal their raw markdown
 * while your cursor is actually inside that span. Images render inline.
 */

/** Trailing "|60" in an image's alt text sets its rendered width as a % of
 *  the editor — `![|60](url)`. Written by the drag handle below, honored by
 *  the read-only renderer too (see Markdown.tsx). */
export const IMAGE_SIZE_RE = /\|(\d{1,3})$/;

const clampPct = (n: number) => Math.min(100, Math.max(10, n));

class ImageWidget extends WidgetType {
  private readonly url: string;
  private readonly alt: string;

  constructor(url: string, alt: string) {
    super();
    this.url = url;
    this.alt = alt;
  }
  eq(other: ImageWidget) {
    return other.url === this.url && other.alt === this.alt;
  }
  toDOM(view: EditorView) {
    const sized = IMAGE_SIZE_RE.exec(this.alt);
    const pct = sized ? clampPct(Number(sized[1])) : null;

    const frame = document.createElement("div");
    frame.className = "cm-live-image-frame";
    if (pct !== null) {
      frame.style.width = `${pct}%`;
      frame.dataset.sized = "";
    }

    const img = document.createElement("img");
    img.src = this.url;
    img.alt = this.alt.replace(IMAGE_SIZE_RE, "");
    img.className = "cm-live-image";
    frame.appendChild(img);

    const handle = document.createElement("div");
    handle.className = "cm-live-image-handle";
    handle.title = "Drag to resize";
    frame.appendChild(handle);

    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handle.setPointerCapture(e.pointerId);
      const editorWidth = view.contentDOM.clientWidth;
      const startWidth = frame.getBoundingClientRect().width;
      const startX = e.clientX;
      let livePct = clampPct((startWidth / editorWidth) * 100);

      const move = (ev: PointerEvent) => {
        // The frame stays centered, so its width grows twice as fast as the
        // corner being dragged moves.
        const w = startWidth + (ev.clientX - startX) * 2;
        livePct = clampPct((w / editorWidth) * 100);
        frame.style.width = `${livePct}%`;
        frame.dataset.sized = "";
      };
      const up = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        commitImageSize(view, frame, Math.round(livePct));
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
    });

    return frame;
  }
  ignoreEvent(event: Event) {
    // The resize handle owns its pointer events; clicks elsewhere still
    // place the cursor as before.
    return event.target instanceof Element && !!event.target.closest(".cm-live-image-handle");
  }
}

/** Rewrite the image's markdown so the chosen width persists in the text. */
function commitImageSize(view: EditorView, dom: HTMLElement, pct: number) {
  const pos = view.posAtDOM(dom);
  let node: SyntaxNode | null = syntaxTree(view.state).resolveInner(pos, 1);
  while (node && node.name !== "Image") node = node.parent;
  if (!node) return;
  const m = /^!\[([^\]]*)\]\((.*)\)$/.exec(view.state.sliceDoc(node.from, node.to));
  if (!m) return;
  const alt = m[1].replace(IMAGE_SIZE_RE, "");
  view.dispatch({
    changes: { from: node.from, to: node.to, insert: `![${alt}|${pct}](${m[2]})` },
  });
}

class HrWidget extends WidgetType {
  eq() {
    return true;
  }
  toDOM() {
    const hr = document.createElement("hr");
    hr.className = "cm-live-hr";
    return hr;
  }
}

interface Pending {
  from: number;
  to: number;
  deco: Decoration;
}

function selectionTouches(state: import("@codemirror/state").EditorState, from: number, to: number) {
  return state.selection.ranges.some((r) => r.from <= to && r.to >= from);
}

const LINK_RE = /^\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/;
const IMAGE_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/;
const HEADING_RE = /^(#{1,6})(\s+)/;
const CODE_MARK_RE = /^`+/;

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  const pending: Pending[] = [];
  const tree = syntaxTree(state);

  for (const { from, to } of view.visibleRanges) {
    tree.iterate({
      from,
      to,
      enter: (node) => {
        const name = node.name;

        if (/^ATXHeading[1-6]$/.test(name)) {
          const level = Number(name.slice(10));
          const line = state.doc.lineAt(node.from);
          pending.push({
            from: line.from,
            to: line.from,
            deco: Decoration.line({ class: `cm-live-h cm-live-h${level}` }),
          });
          const text = state.sliceDoc(node.from, node.to);
          const m = HEADING_RE.exec(text);
          if (m && !selectionTouches(state, node.from, node.to)) {
            pending.push({
              from: node.from,
              to: node.from + m[0].length,
              deco: Decoration.replace({}),
            });
          }
          return;
        }

        if (name === "StrongEmphasis" || name === "Emphasis" || name === "Strikethrough") {
          const markLen = name === "Emphasis" ? 1 : 2;
          const cls =
            name === "StrongEmphasis"
              ? "cm-live-strong"
              : name === "Strikethrough"
                ? "cm-live-strike"
                : "cm-live-em";
          if (node.to - node.from > markLen * 2) {
            pending.push({
              from: node.from + markLen,
              to: node.to - markLen,
              deco: Decoration.mark({ class: cls }),
            });
          }
          if (!selectionTouches(state, node.from, node.to)) {
            pending.push({ from: node.from, to: node.from + markLen, deco: Decoration.replace({}) });
            pending.push({ from: node.to - markLen, to: node.to, deco: Decoration.replace({}) });
          }
          return;
        }

        if (name === "InlineCode") {
          const text = state.sliceDoc(node.from, node.to);
          const m = CODE_MARK_RE.exec(text);
          const markLen = m ? m[0].length : 1;
          if (node.to - node.from > markLen * 2) {
            pending.push({
              from: node.from + markLen,
              to: node.to - markLen,
              deco: Decoration.mark({ class: "cm-live-code" }),
            });
          }
          if (!selectionTouches(state, node.from, node.to)) {
            pending.push({ from: node.from, to: node.from + markLen, deco: Decoration.replace({}) });
            pending.push({ from: node.to - markLen, to: node.to, deco: Decoration.replace({}) });
          }
          return;
        }

        if (name === "Image") {
          const text = state.sliceDoc(node.from, node.to);
          const m = IMAGE_RE.exec(text);
          if (m && !selectionTouches(state, node.from, node.to)) {
            pending.push({
              from: node.from,
              to: node.to,
              deco: Decoration.replace({ widget: new ImageWidget(m[2], m[1]) }),
            });
            return false;
          }
          return;
        }

        if (name === "Link") {
          const text = state.sliceDoc(node.from, node.to);
          const m = LINK_RE.exec(text);
          if (m) {
            const labelStart = node.from + 1;
            const labelEnd = labelStart + m[1].length;
            if (labelEnd > labelStart) {
              pending.push({ from: labelStart, to: labelEnd, deco: Decoration.mark({ class: "cm-live-link" }) });
            }
            if (!selectionTouches(state, node.from, node.to)) {
              pending.push({ from: node.from, to: labelStart, deco: Decoration.replace({}) });
              pending.push({ from: labelEnd, to: node.to, deco: Decoration.replace({}) });
            }
          }
          return;
        }

        if (name === "HorizontalRule") {
          if (!selectionTouches(state, node.from, node.to)) {
            pending.push({ from: node.from, to: node.to, deco: Decoration.replace({ widget: new HrWidget() }) });
          }
          return;
        }

        if (name === "Blockquote") {
          const endLine = state.doc.lineAt(Math.min(node.to, state.doc.length)).number;
          for (let n = state.doc.lineAt(node.from).number; n <= endLine; n++) {
            const l = state.doc.line(n);
            pending.push({ from: l.from, to: l.from, deco: Decoration.line({ class: "cm-live-quote" }) });
          }
          return;
        }

        if (name === "FencedCode" || name === "CodeBlock") {
          const endLine = state.doc.lineAt(Math.min(node.to, state.doc.length)).number;
          for (let n = state.doc.lineAt(node.from).number; n <= endLine; n++) {
            const l = state.doc.line(n);
            pending.push({ from: l.from, to: l.from, deco: Decoration.line({ class: "cm-live-code-line" }) });
          }
          return;
        }
      },
    });
  }

  pending.sort((a, b) => a.from - b.from || a.to - b.to);
  const builder = new RangeSetBuilder<Decoration>();
  for (const p of pending) builder.add(p.from, p.to, p.deco);
  return builder.finish();
}

const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

export function liveMarkdown() {
  return [markdown({ extensions: [GFM] }), EditorView.lineWrapping, livePreviewPlugin];
}

import { syntaxTree } from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";
import katex from "katex";
import type { SyntaxNode } from "@lezer/common";
import { GFM } from "@lezer/markdown";
import { buildEmbedDoc, connectEmbedFrame, EMBED_SANDBOX, embedTitle } from "./embedFrame";
import {
  type EditorState,
  RangeSetBuilder,
  StateEffect,
  StateField,
  type Transaction,
} from "@codemirror/state";
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

/** Markdown has no video syntax, so `![…](url)` pointing at a video file
 *  renders as a <video> player instead of an <img> — matched by extension
 *  here and in the read-only renderer (Markdown.tsx). */
export const VIDEO_URL_RE = /\.(mp4|webm|mov|m4v|ogv)([?#].*)?$/i;

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
      // Width goes through a CSS variable rather than an inline width so the
      // stylesheet can ignore it on narrow screens (sized media goes full
      // width once the layout collapses to the read/write toggle).
      frame.style.setProperty("--media-w", `${pct}%`);
      frame.dataset.sized = "";
    }

    let media: HTMLImageElement | HTMLVideoElement;
    if (VIDEO_URL_RE.test(this.url)) {
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      media = video;
    } else {
      const img = document.createElement("img");
      img.alt = this.alt.replace(IMAGE_SIZE_RE, "");
      media = img;
    }
    media.src = this.url;
    media.className = "cm-live-image";
    frame.appendChild(media);

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
        frame.style.setProperty("--media-w", `${livePct}%`);
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
    // The resize handle owns its pointer events, and clicks on a video must
    // reach its playback controls; clicks elsewhere still place the cursor.
    return (
      event.target instanceof Element &&
      !!event.target.closest(".cm-live-image-handle, video.cm-live-image")
    );
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

/** KaTeX-rendered math, mirroring the read-only renderer's $…$ / $$…$$
 *  support (remark-math). Falls back to raw text on bad TeX. */
class MathWidget extends WidgetType {
  private readonly tex: string;
  private readonly display: boolean;

  constructor(tex: string, display: boolean) {
    super();
    this.tex = tex;
    this.display = display;
  }
  eq(other: MathWidget) {
    return other.tex === this.tex && other.display === this.display;
  }
  toDOM() {
    const el = document.createElement(this.display ? "div" : "span");
    el.className = this.display ? "cm-live-math cm-live-math-display" : "cm-live-math";
    katex.render(this.tex, el, { displayMode: this.display, throwOnError: false });
    return el;
  }
  ignoreEvent() {
    return false;
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
// $$…$$ may span lines; $…$ must not, and its contents can't start or end
// with whitespace (so "$5 and $10" stays plain text) — remark-math's rules.
const BLOCK_MATH_RE = /\$\$([^$]+?)\$\$/g;
const INLINE_MATH_RE = /\$([^$\n]+?)\$/g;
// Markdown has no underline syntax, so Cmd/Ctrl+U writes literal <u>…</u>
// tags — the read-only renderer passes them through via rehype-raw.
export const UNDERLINE_RE = /<u>([^\n]*?)<\/u>/g;
const U_OPEN = "<u>".length;
const U_CLOSE = "</u>".length;

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  const pending: Pending[] = [];
  const codeRanges: { from: number; to: number }[] = [];
  const tree = syntaxTree(state);
  const overlapsCode = (from: number, to: number) =>
    codeRanges.some((r) => from < r.to && to > r.from);

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
          codeRanges.push({ from: node.from, to: node.to });
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
          codeRanges.push({ from: node.from, to: node.to });
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

  // Math is invisible to the markdown parser, so scan the visible text
  // directly. Blocks first ($$…$$ may span lines), then inline $…$ in
  // whatever text the blocks didn't claim.
  const mathRanges: { from: number; to: number }[] = [];
  for (const { from, to } of view.visibleRanges) {
    const text = state.sliceDoc(from, to);

    for (const m of text.matchAll(BLOCK_MATH_RE)) {
      const mFrom = from + m.index;
      const mTo = mFrom + m[0].length;
      if (overlapsCode(mFrom, mTo)) continue;
      mathRanges.push({ from: mFrom, to: mTo });
      if (selectionTouches(state, mFrom, mTo)) continue;
      // Multi-line $$ blocks need a block widget, which CodeMirror only
      // accepts from a StateField — see blockMathField below.
      if (m[0].includes("\n")) continue;
      pending.push({
        from: mFrom,
        to: mTo,
        deco: Decoration.replace({ widget: new MathWidget(m[1], true) }),
      });
    }

    for (const m of text.matchAll(INLINE_MATH_RE)) {
      const tex = m[1];
      if (/^\s|\s$/.test(tex)) continue;
      const mFrom = from + m.index;
      const mTo = mFrom + m[0].length;
      if (overlapsCode(mFrom, mTo)) continue;
      if (mathRanges.some((r) => mFrom < r.to && mTo > r.from)) continue;
      mathRanges.push({ from: mFrom, to: mTo });
      if (selectionTouches(state, mFrom, mTo)) continue;
      pending.push({
        from: mFrom,
        to: mTo,
        deco: Decoration.replace({ widget: new MathWidget(tex, false) }),
      });
    }

    // <u>…</u> is invisible to the markdown parser too (it only sees the
    // tags as inline HTML), so scan for it the same way.
    for (const m of text.matchAll(UNDERLINE_RE)) {
      const mFrom = from + m.index;
      const mTo = mFrom + m[0].length;
      if (overlapsCode(mFrom, mTo)) continue;
      if (mathRanges.some((r) => mFrom < r.to && mTo > r.from)) continue;
      if (m[1].length > 0) {
        pending.push({
          from: mFrom + U_OPEN,
          to: mTo - U_CLOSE,
          deco: Decoration.mark({ class: "cm-live-underline" }),
        });
      }
      if (selectionTouches(state, mFrom, mTo)) continue;
      pending.push({ from: mFrom, to: mFrom + U_OPEN, deco: Decoration.replace({}) });
      pending.push({ from: mTo - U_CLOSE, to: mTo, deco: Decoration.replace({}) });
    }
  }

  pending.sort(
    (a, b) => a.from - b.from || a.deco.startSide - b.deco.startSide || a.to - b.to,
  );
  const builder = new RangeSetBuilder<Decoration>();
  for (const p of pending) builder.add(p.from, p.to, p.deco);
  return builder.finish();
}

/** Multi-line $$…$$ rendered as a centered block. Block-replace decorations
 *  must be provided by a StateField, not a ViewPlugin, so this lives apart
 *  from the inline pass above. Whole-doc scan — notes are small. */
function buildBlockMath(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const text = state.doc.toString();
  for (const m of text.matchAll(BLOCK_MATH_RE)) {
    if (!m[0].includes("\n")) continue;
    const from = m.index;
    const to = from + m[0].length;
    // A block widget must replace whole lines: the $$ fences have to sit
    // alone at the start/end of their lines.
    if (from !== state.doc.lineAt(from).from || to !== state.doc.lineAt(to).to) continue;
    if (selectionTouches(state, from, to)) continue;
    let inCode = false;
    syntaxTree(state).iterate({
      from,
      to,
      enter: (n) => {
        if (n.name === "FencedCode" || n.name === "CodeBlock" || n.name === "InlineCode") {
          inCode = true;
          return false;
        }
      },
    });
    if (inCode) continue;
    builder.add(
      from,
      to,
      Decoration.replace({ widget: new MathWidget(m[1], true), block: true }),
    );
  }
  return builder.finish();
}

const blockMathField = StateField.define<DecorationSet>({
  create: buildBlockMath,
  update(deco, tr) {
    return tr.docChanged || tr.selection ? buildBlockMath(tr.state) : deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

/* ---------- ```embed fences ---------- */

/** A fenced block tagged `embed` holds a whole HTML document (usually a
 *  pasted Claude artifact — thousands of lines). Showing that as text makes
 *  the note unusable, so the fence renders as the live embed itself, the
 *  same sandboxed iframe the read-only view uses. Unlike images, the cursor
 *  can't wander into it: the source only opens on the header's "Source"
 *  button, and closes again once the cursor leaves the fence. */
class EmbedWidget extends WidgetType {
  private readonly html: string;

  constructor(html: string) {
    super();
    this.html = html;
  }
  eq(other: EmbedWidget) {
    return other.html === this.html;
  }
  toDOM(view: EditorView) {
    const wrap = document.createElement("div");
    wrap.className = "cm-live-embed";

    const head = document.createElement("div");
    head.className = "cm-live-embed-head";
    const label = document.createElement("span");
    label.className = "cm-live-embed-label";
    const title = embedTitle(this.html);
    const kb = Math.max(1, Math.round(this.html.length / 1024));
    label.textContent = title ? `embed · ${title} · ${kb} KB` : `embed · ${kb} KB`;
    head.appendChild(label);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cm-live-embed-btn";
    btn.textContent = "Source";
    btn.title = "Show the HTML for this embed";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const pos = view.posAtDOM(wrap);
      // Land the cursor on the fence's opening line so the source shows.
      view.dispatch({
        effects: openEmbedSource.of(pos),
        selection: { anchor: view.state.doc.lineAt(pos).to },
      });
      view.focus();
    });
    head.appendChild(btn);
    wrap.appendChild(head);

    const frame = document.createElement("iframe");
    frame.className = "md-embed";
    frame.setAttribute("sandbox", EMBED_SANDBOX);
    frame.title = "Embedded interactive";
    frame.style.height = "320px";
    frame.srcdoc = buildEmbedDoc(this.html);
    wrap.appendChild(frame);

    const disconnect = connectEmbedFrame(frame, (px) => {
      frame.style.height = `${px}px`;
      view.requestMeasure();
    });
    (wrap as HTMLElement & { _cleanup?: () => void })._cleanup = disconnect;
    return wrap;
  }
  destroy(dom: HTMLElement) {
    (dom as HTMLElement & { _cleanup?: () => void })._cleanup?.();
  }
  ignoreEvent() {
    // The iframe and header own their events; clicks here never move the
    // editor's cursor into the hidden HTML.
    return true;
  }
  get estimatedHeight() {
    return 360;
  }
}

/** Position (opening-fence start) of the one embed whose source is open. */
const openEmbedSource = StateEffect.define<number>();
const EMBED_FENCE_RE = /^(`{3,}|~{3,})\s*embed\s*$/;
const CLOSE_FENCE_RE = /^\s*(`{3,}|~{3,})\s*$/;

interface EmbedFence {
  from: number;
  to: number;
  html: string;
}

function findEmbedFences(state: EditorState): EmbedFence[] {
  const out: EmbedFence[] = [];
  syntaxTree(state).iterate({
    enter: (n) => {
      if (n.name !== "FencedCode") return;
      const startLine = state.doc.lineAt(n.from);
      if (!EMBED_FENCE_RE.test(startLine.text)) return false;
      const endLine = state.doc.lineAt(Math.min(n.to, state.doc.length));
      let bodyTo = endLine.to;
      if (endLine.number > startLine.number && CLOSE_FENCE_RE.test(endLine.text)) {
        bodyTo = state.doc.line(endLine.number - 1).to;
      }
      const bodyFrom = Math.min(startLine.to + 1, bodyTo);
      out.push({ from: startLine.from, to: endLine.to, html: state.sliceDoc(bodyFrom, bodyTo) });
      return false;
    },
  });
  return out;
}

const embedSourceField = StateField.define<number | null>({
  create: () => null,
  update(open, tr) {
    for (const e of tr.effects) if (e.is(openEmbedSource)) return e.value;
    if (open === null) return null;
    const mapped = tr.changes.mapPos(open);
    // Close again once the cursor has left that fence.
    const fence = findEmbedFences(tr.state).find((f) => f.from === mapped);
    if (!fence || !selectionTouches(tr.state, fence.from, fence.to)) return null;
    return mapped;
  },
});

function buildEmbeds(state: EditorState): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const open = state.field(embedSourceField);
  for (const f of findEmbedFences(state)) {
    if (f.from === open) continue;
    builder.add(
      f.from,
      f.to,
      Decoration.replace({ widget: new EmbedWidget(f.html), block: true }),
    );
  }
  return builder.finish();
}

const embedField = StateField.define<DecorationSet>({
  create: buildEmbeds,
  update(deco, tr: Transaction) {
    return tr.docChanged || tr.effects.some((e) => e.is(openEmbedSource)) ||
      tr.startState.field(embedSourceField) !== tr.state.field(embedSourceField)
      ? buildEmbeds(tr.state)
      : deco;
  },
  provide: (f) => [
    EditorView.decorations.from(f),
    // Atomic: arrow keys and clicks step over the embed instead of into
    // its (hidden) HTML.
    EditorView.atomicRanges.of((view) => view.state.field(f)),
  ],
});

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
  // IndentedCode is removed so Tab-indented lines stay ordinary text; code
  // blocks are written with ``` fences instead.
  return [
    markdown({ extensions: [GFM, { remove: ["IndentedCode"] }] }),
    EditorView.lineWrapping,
    livePreviewPlugin,
    blockMathField,
    embedSourceField,
    embedField,
  ];
}

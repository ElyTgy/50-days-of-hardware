import type { Root } from "mdast";

/**
 * The notes editor (see liveMarkdown.ts) is a plain-text document the whole
 * time: every newline is a visible line break, leading indentation shows
 * exactly as typed, and `$$…$$` always renders as a centered equation.
 * CommonMark disagrees on all three — it folds single newlines into one
 * paragraph, swallows the indentation of continuation lines, and only treats
 * `$$` as display math when it owns a block. So notes written as a hand-made
 * outline read fine while writing and collapsed into a blob for visitors.
 *
 * These two steps bend the read-only render back to what the author saw:
 * `alignSource` rewrites the markdown before parsing, `remarkHardBreaks`
 * turns the surviving soft breaks into real ones.
 */

/** Non-breaking space: indentation the block parser won't eat. */
const NBSP = " ";

const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;
const INDENT_RE = /^[ \t]+/;
/** A list item markdown itself recognizes at the top level (indent < 4). */
const LIST_ITEM_RE = /^ {0,3}([-*+]|\d{1,9}[.)])(\s|$)/;
/** A line that is nothing but one `$$…$$` equation. */
const MATH_LINE_RE = /^\s*\$\$((?:[^$]|\$(?!\$))+)\$\$\s*$/;

/** The line that closes an open fence: the same character, at least as many
 *  of them, and nothing else on the line. */
function closesFence(line: string, fence: string): boolean {
  const mark = FENCE_RE.exec(line)?.[1];
  if (!mark || mark[0] !== fence[0] || mark.length < fence.length) return false;
  return !line.slice(line.indexOf(mark) + mark.length).trim();
}

/** Tabs advance to the next four-column stop, as in the editor. */
function indentWidth(ws: string): number {
  let n = 0;
  for (const ch of ws) n = ch === "\t" ? n + 4 - (n % 4) : n + 1;
  return n;
}

/**
 * Rewrite a note so markdown keeps the shape the editor displayed:
 *
 * - Indentation that markdown would discard (a continuation line, or a line
 *   deep enough to become an indented code block) becomes non-breaking
 *   spaces, so a hand-made outline stays an outline. Indentation that markdown
 *   reads as structure — a nested list under a real list — is left alone.
 * - A line holding only a `$$…$$` equation is given its own block, so it
 *   renders centered rather than shrunk into the sentence around it.
 *
 * Fenced blocks (including ```embed) pass through untouched.
 */
export function alignSource(src: string): string {
  const out: string[] = [];
  let fence: string | null = null;
  let inList = false;
  let afterBlank = true;

  for (const line of src.split("\n")) {
    if (fence !== null) {
      out.push(line);
      if (closesFence(line, fence)) fence = null;
      continue;
    }

    const opening = FENCE_RE.exec(line);
    if (opening) {
      fence = opening[1];
      out.push(line);
      afterBlank = false;
      continue;
    }

    if (!line.trim()) {
      out.push(line);
      afterBlank = true;
      continue;
    }

    const ws = INDENT_RE.exec(line)?.[0] ?? "";
    const indent = indentWidth(ws);
    const isListItem = LIST_ITEM_RE.test(line);
    // A blank line followed by unindented, non-list text ends the list.
    if (indent === 0 && afterBlank && !isListItem) inList = false;
    if (isListItem) inList = true;
    afterBlank = false;

    // remark-math only reads `$$` as display math when the fences own their
    // lines, so give a one-line equation that form — the editor renders every
    // `$$…$$` centered, whether or not it was written across three lines.
    const math = !inList && MATH_LINE_RE.exec(line);
    if (math) {
      if (out.length && out[out.length - 1].trim()) out.push("");
      out.push("$$", math[1].trim(), "$$", "");
      afterBlank = true;
      continue;
    }

    // Inside a list, indentation is structure markdown reads correctly.
    const keepAsIs = indent === 0 || inList || isListItem;
    out.push(keepAsIs ? line : NBSP.repeat(indent) + line.slice(ws.length));
  }

  return out.join("\n");
}

interface LooseNode {
  type: string;
  value?: string;
  children?: LooseNode[];
}

function hardenBreaks(node: LooseNode): void {
  if (!node.children) return;
  const out: LooseNode[] = [];
  for (const child of node.children) {
    if (child.type === "text" && child.value?.includes("\n")) {
      const parts = child.value.split("\n");
      parts.forEach((part, i) => {
        if (i > 0) out.push({ type: "break" });
        if (part) out.push({ type: "text", value: part });
      });
      continue;
    }
    hardenBreaks(child);
    out.push(child);
  }
  node.children = out;
}

/**
 * Every newline the author typed is a line break, the way the editor drew it
 * — the same thing remark-breaks does. Code and math nodes hold their text in
 * `value` rather than child text nodes, so they're untouched.
 */
export function remarkHardBreaks() {
  return (tree: Root) => hardenBreaks(tree as unknown as LooseNode);
}

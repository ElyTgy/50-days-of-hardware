/**
 * Shared plumbing for ```embed fences — a self-contained HTML document
 * (typically a Claude artifact) run inside a sandboxed iframe. Used by the
 * read-only renderer (HtmlEmbed.tsx) and the editor's live preview widget
 * (liveMarkdown.ts) so both show the exact same thing.
 *
 * A small bootstrap is injected ahead of the pasted content:
 *   - mirrors our `data-theme` onto the embed's <html>, so artifact dark-mode
 *     CSS (`:root[data-theme="dark"]`) follows the site toggle
 *   - reports its content height, so the iframe never needs a fixed height
 *   - makes the body transparent, so it sits on our paper instead of its own
 */

const HEIGHT_MSG = "hc-embed:height";
const THEME_MSG = "hc-embed:theme";

export const EMBED_SANDBOX = "allow-scripts allow-popups";

const BOOTSTRAP = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:auto!important;background:transparent!important}</style>
<script>(function(){
  var T=${JSON.stringify(THEME_MSG)},H=${JSON.stringify(HEIGHT_MSG)};
  function apply(t){document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t;}
  addEventListener("message",function(e){var d=e.data;if(d&&d.type===T)apply(d.theme);});
  function report(){var b=document.body;if(!b)return;var h=Math.ceil(b.getBoundingClientRect().height);parent.postMessage({type:H,height:h},"*");}
  addEventListener("load",function(){
    report();
    if(window.ResizeObserver){new ResizeObserver(report).observe(document.body);}
    else setInterval(report,500);
  });
  addEventListener("DOMContentLoaded",report);
})();</script>
</head><body>`;

export function currentTheme(): string {
  return document.documentElement.dataset.theme || "light";
}

/** Artifacts saved from claude.ai carry a viewer-runtime preamble that only
 *  makes sense inside claude.ai (and would post messages to our window).
 *  Drop it, plus any outer html/head/body scaffolding, so pasting the whole
 *  file works the same as pasting just the page content. */
export function cleanEmbedHtml(raw: string): string {
  let html = raw.replace(/<!--\s*frame-runtime\s*-->[\s\S]*?<!--\s*\/frame-runtime\s*-->/i, "");
  html = html.replace(/<!doctype[^>]*>/i, "");
  html = html.replace(/<\/?(html|head|body)[^>]*>/gi, "");
  return html.trim();
}

/** The document's <title>, if it has one — used to label the embed. */
export function embedTitle(raw: string): string | null {
  const m = /<title[^>]*>([^<]*)<\/title>/i.exec(raw);
  const t = m?.[1].trim();
  return t ? t : null;
}

/** Full srcdoc for the iframe. The theme is baked in for first paint only;
 *  later toggles arrive by postMessage so the frame never reloads (a reload
 *  would wipe whatever state the widget is in). */
export function buildEmbedDoc(raw: string, theme = currentTheme()): string {
  return (
    BOOTSTRAP.replace("<html>", `<html data-theme="${theme}" style="color-scheme:${theme}">`) +
    cleanEmbedHtml(raw) +
    "</body></html>"
  );
}

/** Wire an iframe to the bootstrap: push theme changes in, receive height
 *  reports out. Returns a cleanup function. */
export function connectEmbedFrame(
  frame: HTMLIFrameElement,
  onHeight: (px: number) => void,
): () => void {
  const sendTheme = () =>
    frame.contentWindow?.postMessage({ type: THEME_MSG, theme: currentTheme() }, "*");

  const onMessage = (e: MessageEvent) => {
    if (e.source !== frame.contentWindow) return;
    const d = e.data;
    if (d && d.type === HEIGHT_MSG && typeof d.height === "number" && d.height > 0) {
      onHeight(Math.ceil(d.height));
    }
  };
  window.addEventListener("message", onMessage);
  frame.addEventListener("load", sendTheme);

  const mo = new MutationObserver(sendTheme);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  sendTheme();

  return () => {
    window.removeEventListener("message", onMessage);
    frame.removeEventListener("load", sendTheme);
    mo.disconnect();
  };
}

import { useEffect, useRef, useState } from "react";

/**
 * Runs a self-contained HTML document (e.g. a Claude artifact pasted into an
 * ```embed fence) in a sandboxed iframe. The document keeps its own styles
 * and scripts, so nothing leaks into the page; a small bootstrap injected
 * ahead of the content keeps it in sync with the site:
 *   - mirrors our `data-theme` onto the embed's <html> so artifact dark-mode
 *     CSS (`:root[data-theme="dark"]`) follows the toggle
 *   - reports its content height so the iframe never needs a fixed height
 *   - makes the body transparent so it sits on our paper instead of its own
 */

const HEIGHT_MSG = "hc-embed:height";
const THEME_MSG = "hc-embed:theme";

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

function currentTheme(): string {
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

export default function HtmlEmbed({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(320);
  // Theme baked into srcDoc only once: changing srcDoc reloads the frame and
  // would wipe the widget's state, so later toggles go through postMessage.
  const [theme] = useState(currentTheme);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    const sendTheme = () =>
      frame.contentWindow?.postMessage({ type: THEME_MSG, theme: currentTheme() }, "*");

    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.contentWindow) return;
      const d = e.data;
      if (d && d.type === HEIGHT_MSG && typeof d.height === "number" && d.height > 0) {
        setHeight(Math.ceil(d.height));
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
  }, []);

  const doc = BOOTSTRAP.replace("<html>", `<html data-theme="${theme}" style="color-scheme:${theme}">`) +
    cleanEmbedHtml(html) +
    "</body></html>";

  return (
    <iframe
      ref={ref}
      className="md-embed"
      srcDoc={doc}
      sandbox="allow-scripts allow-popups"
      style={{ height }}
      title="Embedded interactive"
    />
  );
}

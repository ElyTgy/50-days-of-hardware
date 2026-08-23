import { useEffect, useRef, useState } from "react";
import { buildEmbedDoc, connectEmbedFrame, EMBED_SANDBOX } from "../lib/embedFrame";

/** Read-only rendering of an ```embed fence: a sandboxed, auto-sized iframe
 *  that follows the site theme. See lib/embedFrame.ts for the mechanics. */
export default function HtmlEmbed({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(320);
  // srcDoc is built once per html: rebuilding it reloads the frame and
  // would wipe the widget's state, so theme toggles go through postMessage.
  const [doc] = useState(() => buildEmbedDoc(html));

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    return connectEmbedFrame(frame, setHeight);
  }, []);

  return (
    <iframe
      ref={ref}
      className="md-embed"
      srcDoc={doc}
      sandbox={EMBED_SANDBOX}
      style={{ height }}
      title="Embedded interactive"
    />
  );
}

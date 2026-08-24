import { isValidElement, type ComponentProps, type CSSProperties, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { IMAGE_SIZE_RE, VIDEO_URL_RE } from "../lib/liveMarkdown";
import { alignSource, remarkHardBreaks } from "../lib/noteMarkdown";
import HtmlEmbed from "./HtmlEmbed";

/** A fenced block tagged `embed` holds a self-contained HTML document (a
 *  Claude artifact, a small widget…). Instead of showing it as code, run it
 *  in a sandboxed iframe. Any other fence renders as a normal <pre>. */
function Pre({ children, ...rest }: ComponentProps<"pre">) {
  const code = Array.isArray(children) ? children[0] : children;
  if (isValidElement<{ className?: string; children?: ReactNode }>(code)) {
    const lang = code.props.className ?? "";
    if (/\blanguage-embed\b/.test(lang)) {
      const src = code.props.children;
      if (typeof src === "string") return <HtmlEmbed html={src} />;
    }
  }
  return <pre {...rest}>{children}</pre>;
}

/** Honor the editor's `![alt|60](url)` size convention: a trailing "|60" in
 *  the alt text renders the media centered at 60% of the content width.
 *  The width goes through a CSS variable so the stylesheet can override it
 *  to 100% on narrow screens. URLs pointing at video files render as a
 *  <video> player. */
function Img({ alt = "", style, src, ...rest }: ComponentProps<"img">) {
  const sized = IMAGE_SIZE_RE.exec(alt);
  const pct = sized ? Math.min(100, Math.max(10, Number(sized[1]))) : null;
  const sizedStyle =
    pct !== null ? ({ ...style, "--media-w": `${pct}%` } as CSSProperties) : style;
  const sizedAttr = pct !== null ? "" : undefined;
  if (typeof src === "string" && VIDEO_URL_RE.test(src)) {
    return (
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        style={sizedStyle}
        data-sized={sizedAttr}
      />
    );
  }
  return (
    <img
      {...rest}
      src={src}
      alt={alt.replace(IMAGE_SIZE_RE, "")}
      style={sizedStyle}
      data-sized={sizedAttr}
    />
  );
}

/**
 * Renders markdown with GitHub extensions, LaTeX math ($…$ and $$…$$ via
 * KaTeX), and raw HTML — so content can include images, GIFs, embedded
 * animations/video, tables, and equations.
 *
 * Line breaks and indentation survive (see noteMarkdown.ts): what everyone
 * else reads has to match what the editor showed while it was written.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkHardBreaks]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{ img: Img, pre: Pre }}
      >
        {alignSource(children)}
      </ReactMarkdown>
    </div>
  );
}

import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { IMAGE_SIZE_RE, VIDEO_URL_RE } from "../lib/liveMarkdown";

/** Honor the editor's `![alt|60](url)` size convention: a trailing "|60" in
 *  the alt text renders the media centered at 60% of the content width.
 *  URLs pointing at video files render as a <video> player. */
function Img({ alt = "", style, src, ...rest }: ComponentProps<"img">) {
  const sized = IMAGE_SIZE_RE.exec(alt);
  const pct = sized ? Math.min(100, Math.max(10, Number(sized[1]))) : null;
  const sizedStyle = pct !== null ? { ...style, width: `${pct}%` } : style;
  if (typeof src === "string" && VIDEO_URL_RE.test(src)) {
    return <video src={src} controls playsInline preload="metadata" style={sizedStyle} />;
  }
  return <img {...rest} src={src} alt={alt.replace(IMAGE_SIZE_RE, "")} style={sizedStyle} />;
}

/**
 * Renders markdown with GitHub extensions, LaTeX math ($…$ and $$…$$ via
 * KaTeX), and raw HTML — so content can include images, GIFs, embedded
 * animations/video, tables, and equations.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{ img: Img }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

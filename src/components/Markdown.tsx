import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { IMAGE_SIZE_RE } from "../lib/liveMarkdown";

/** Honor the editor's `![alt|60](url)` size convention: a trailing "|60" in
 *  the alt text renders the image centered at 60% of the content width. */
function Img({ alt = "", style, ...rest }: ComponentProps<"img">) {
  const sized = IMAGE_SIZE_RE.exec(alt);
  const pct = sized ? Math.min(100, Math.max(10, Number(sized[1]))) : null;
  return (
    <img
      {...rest}
      alt={alt.replace(IMAGE_SIZE_RE, "")}
      style={pct !== null ? { ...style, width: `${pct}%` } : style}
    />
  );
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

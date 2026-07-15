import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

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
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

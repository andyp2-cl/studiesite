import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { cn } from "@/lib/utils";

/** Markdown with KaTeX ($...$ / $$...$$) and tables, for intros and deepenings. */
export function MathMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("prose-study", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

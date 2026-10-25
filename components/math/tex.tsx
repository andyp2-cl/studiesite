import katex from "katex";
import { cn } from "@/lib/utils";

/** Renders a single LaTeX formula. Safe on server and client. */
export function Tex({
  children,
  display = false,
  className,
}: {
  children: string;
  display?: boolean;
  className?: string;
}) {
  const html = katex.renderToString(children, {
    displayMode: display,
    throwOnError: false,
    output: "html",
  });
  return <span className={cn(display && "block", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}

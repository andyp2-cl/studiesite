import "katex/dist/katex.min.css";
import { strings } from "@/lib/strings";

export default function MockupLayout({ children }: LayoutProps<"/mockup">) {
  return (
    <>
      <div className="pointer-events-none fixed top-0 left-1/2 z-50 -translate-x-1/2 rounded-b-md bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-black">
        {strings.mockup.banner}
      </div>
      {children}
    </>
  );
}

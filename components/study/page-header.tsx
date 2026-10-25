import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Dot-grid page header with optional back link and kicker label. */
export function PageHeader({
  back,
  kicker,
  kickerColor,
  title,
  children,
  aside,
  width = "max-w-5xl",
}: {
  back?: { href: string; label: string };
  kicker?: React.ReactNode;
  kickerColor?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  /** Shown left of the title (e.g. an AreaMark or Avatar). */
  aside?: React.ReactNode;
  width?: string;
}) {
  return (
    <header className="bg-dots border-b border-border">
      <div className={cn("mx-auto px-4 pb-8 sm:px-8", width, back ? "pt-6" : "pt-10 sm:pt-14")}>
        {back && (
          <Link
            href={back.href}
            className="mb-8 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> {back.label}
          </Link>
        )}
        <div className="flex items-end gap-5">
          {aside}
          <div className="min-w-0">
            {kicker && (
              <p
                className={cn("mb-2 font-mono text-xs tracking-[0.2em] uppercase", !kickerColor && "text-primary")}
                style={kickerColor ? { color: kickerColor } : undefined}
              >
                {kicker}
              </p>
            )}
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{title}</h1>
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}

import { ExternalLink } from "lucide-react";
import { SectionLabel } from "@/components/study/visuals";
import { strings } from "@/lib/strings";

const t = strings.moment;

/** Search links to free study sites for this moment (UR Play, SO-rummet or Matteboken). */
export function LearnMore({ links }: { links: { label: string; url: string }[] }) {
  return (
    <section>
      <SectionLabel>{t.learnMore}</SectionLabel>
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">{t.learnMoreHelp}</p>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 border border-border px-4 font-mono text-xs hover:border-foreground"
          >
            {t.searchOn(l.label)} <ExternalLink className="size-3.5 text-muted-foreground" />
          </a>
        ))}
      </div>
    </section>
  );
}

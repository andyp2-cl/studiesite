import Link from "next/link";

export type Crumb = { href: string; label: string };

/** Breadcrumb trail + title for admin pages. */
export function AdminHeader({ crumbs = [], kicker, title, intro }: { crumbs?: Crumb[]; kicker: string; title: string; intro?: string }) {
  return (
    <header className="bg-dots border-b border-border">
      <div className="mx-auto max-w-4xl px-4 pt-6 pb-8 sm:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-1 font-mono text-xs text-muted-foreground">
          {crumbs.map((c) => (
            <span key={c.href} className="flex items-center gap-1">
              <Link href={c.href} className="hover:text-foreground">
                {c.label}
              </Link>
              <span>/</span>
            </span>
          ))}
        </nav>
        <p className="mb-2 font-mono text-xs tracking-[0.2em] text-primary uppercase">{kicker}</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{intro}</p>}
      </div>
    </header>
  );
}

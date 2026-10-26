"use client";

import { ArrowLeft, ChartColumn, LayoutGrid, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shell/app-shell";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.admin;

const ITEMS = [
  { href: "/admin/innehall", label: t.nav.content, icon: LayoutGrid, ready: true },
  { href: "/admin/anvandare", label: t.nav.users, icon: Users, ready: true },
  { href: "/admin/statistik", label: t.nav.stats, icon: ChartColumn, ready: true },
  { href: "/admin/installningar", label: t.nav.settings, icon: Settings, ready: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh w-full flex-col md:flex-row">
      <aside className="border-b border-border md:sticky md:top-0 md:h-dvh md:w-56 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <Link href="/admin">
            <Logo />
          </Link>
          <span className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">{t.link}</span>
        </div>
        <nav className="flex overflow-x-auto md:flex-col md:py-3">
          {ITEMS.map(({ href, label, icon: NavIcon, ready }) =>
            ready ? (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-3 border-b-2 border-transparent px-5 py-3 font-mono text-[13px] text-muted-foreground transition-colors hover:text-foreground md:border-b-0 md:border-l-2 md:py-2.5",
                  pathname.startsWith(href) && "border-primary text-primary",
                )}
              >
                <NavIcon className="size-4" />
                {label}
              </Link>
            ) : (
              <span
                key={href}
                title={t.comingSoon}
                className="flex shrink-0 cursor-not-allowed items-center gap-3 px-5 py-3 font-mono text-[13px] text-muted-foreground/40 md:py-2.5"
              >
                <NavIcon className="size-4" />
                {label}
              </span>
            ),
          )}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 px-5 py-3 font-mono text-[13px] text-muted-foreground hover:text-foreground md:mt-4 md:border-t md:border-border md:pt-4"
          >
            <ArrowLeft className="size-4" />
            {t.toStudentView}
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

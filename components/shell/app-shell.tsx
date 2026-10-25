"use client";

import { House, LayoutGrid, Trophy, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof House };

/**
 * Spotify-style shell: sidebar on desktop, fixed bottom navigation on mobile.
 * `basePath` lets the same shell serve the mockup and the real app.
 */
export function AppShell({ basePath = "", children }: { basePath?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const items: NavItem[] = [
    { href: `${basePath}/`, label: strings.nav.home, icon: House },
    { href: `${basePath}/amnen`, label: strings.nav.subjects, icon: LayoutGrid },
    { href: `${basePath}/topplista`, label: strings.nav.leaderboard, icon: Trophy },
    { href: `${basePath}/profil`, label: strings.nav.profile, icon: User },
  ];
  const isActive = (href: string) =>
    href === `${basePath}/` ? pathname === href || pathname === basePath : pathname.startsWith(href);

  return (
    <div className="flex min-h-dvh w-full md:gap-2 md:p-2">
      <aside className="sticky top-2 hidden h-[calc(100dvh-1rem)] w-60 shrink-0 flex-col gap-2 md:flex">
        <div className="rounded-xl bg-card p-5">
          <Link href={`${basePath}/`} className="flex items-center gap-2 text-lg font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">S</span>
            {strings.app.name}
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 rounded-xl bg-card p-3">
          {items.map(({ href, label, icon: NavIcon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-4 rounded-lg px-3 py-2.5 font-semibold text-muted-foreground transition-colors hover:text-foreground",
                isActive(href) && "bg-secondary text-foreground",
              )}
            >
              <NavIcon className="size-5" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 pb-24 md:rounded-xl md:bg-card/40 md:pb-0">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-4">
          {items.map(({ href, label, icon: NavIcon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground",
                  isActive(href) && "text-foreground",
                )}
              >
                <NavIcon className={cn("size-6", isActive(href) && "text-primary")} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

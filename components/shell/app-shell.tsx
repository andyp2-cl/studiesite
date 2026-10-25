"use client";

import { House, LayoutGrid, Trophy, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof House };

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-mono text-sm font-bold">
      <span className="text-primary">S_</span>
      <span className="lowercase">{strings.app.name}</span>
    </span>
  );
}

/**
 * Terminal-style shell: hairline sidebar on desktop, fixed bottom navigation on
 * mobile. `basePath` lets the same shell serve the mockup and the real app.
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
    <div className="flex min-h-dvh w-full">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border md:flex">
        <Link href={`${basePath}/`} className="flex h-14 items-center border-b border-border px-5">
          <Logo />
        </Link>
        <nav className="flex flex-col py-3">
          {items.map(({ href, label, icon: NavIcon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 border-l-2 border-transparent px-5 py-2.5 font-mono text-[13px] text-muted-foreground transition-colors hover:text-foreground",
                isActive(href) && "border-primary bg-foreground/[0.03] text-primary",
              )}
            >
              <NavIcon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 pb-20 md:pb-0">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-4">
          {items.map(({ href, label, icon: NavIcon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 border-t-2 border-transparent py-2.5 font-mono text-[10px] text-muted-foreground",
                  isActive(href) && "border-primary text-primary",
                )}
              >
                <NavIcon className="size-5" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

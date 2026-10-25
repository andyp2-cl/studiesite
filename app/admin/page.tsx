import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Logo } from "@/components/shell/app-shell";
import { requireAdmin } from "@/lib/auth/session";
import { strings } from "@/lib/strings";

// Placeholder until step 7.
export default async function AdminHome() {
  const admin = await requireAdmin();

  return (
    <main className="min-h-dvh">
      <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-8">
        <Logo />
        <Link href="/" className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {strings.admin.toStudentView}
        </Link>
      </header>
      <div className="bg-dots border-b border-border">
        <div className="mx-auto max-w-5xl px-4 pt-10 pb-8 sm:px-8">
          <p className="mb-3 font-mono text-xs tracking-[0.2em] text-primary uppercase">@{admin.username}</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{strings.admin.title}</h1>
          <p className="mt-4 text-muted-foreground">{strings.admin.comingSoon}</p>
        </div>
      </div>
      <div className="mx-auto max-w-sm px-4 py-10">
        <LogoutButton />
      </div>
    </main>
  );
}

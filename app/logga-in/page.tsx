import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/shell/app-shell";
import { safeNextPath } from "@/lib/auth/redirect";
import { strings } from "@/lib/strings";

export const metadata: Metadata = { title: `${strings.login.title} · ${strings.app.name}` };

export default async function LoginPage({ searchParams }: PageProps<"/logga-in">) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(typeof next === "string" ? next : null);

  return (
    <main className="bg-dots flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm border border-border bg-background">
        <div className="flex h-14 items-center border-b border-border px-6">
          <Logo />
        </div>
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight">{strings.login.title}</h1>
          <p className="mt-2 mb-8 text-sm text-muted-foreground">{strings.login.subtitle}</p>
          <LoginForm next={nextPath} />
        </div>
      </div>
    </main>
  );
}

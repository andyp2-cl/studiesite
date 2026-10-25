import { Shield } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar } from "@/components/study/visuals";
import { requireProfile } from "@/lib/auth/session";
import { strings } from "@/lib/strings";

// Minimal profile for step 3 (logout). The full profile comes in steps 4 and 6.
export default async function ProfilePage() {
  const profile = await requireProfile();

  return (
    <main>
      <header className="bg-dots border-b border-border">
        <div className="mx-auto flex max-w-3xl items-end gap-5 px-4 pt-10 pb-8 sm:px-8 sm:pt-14">
          <Avatar name={profile.display_name} color="#e8115b" size={88} />
          <div className="min-w-0">
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              {strings.profile.level} {profile.level} · @{profile.username}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{profile.display_name}</h1>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-10 sm:px-8">
        {profile.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 bg-primary py-3 font-mono text-sm font-semibold text-primary-foreground"
          >
            <Shield className="size-4" /> {strings.admin.title}
          </Link>
        )}
        <LogoutButton />
      </div>
    </main>
  );
}

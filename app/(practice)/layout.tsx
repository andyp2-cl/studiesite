import "katex/dist/katex.min.css";
import { Eye } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { getViewProfile, requireProfile } from "@/lib/auth/session";
import { strings } from "@/lib/strings";

const t = strings.viewAs;

// Full-screen practice flow: no navigation, so a tap cannot leave a round by accident.
// An admin viewing as a student cannot practise: the answers would be saved on the
// admin account (lib/practice/actions.ts refuses them too).
export default async function PracticeLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const viewed = await getViewProfile();
  if (!viewed || viewed.id === profile.id) return children;

  return (
    <div className="bg-dots flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-4 border border-amber-400/60 bg-background p-6">
        <p className="flex items-center gap-2 text-xl font-semibold">
          <Eye className="size-5 text-amber-300" /> {t.blockedTitle(viewed.display_name)}
        </p>
        <p className="text-sm text-muted-foreground">{t.blockedBody(viewed.display_name)}</p>
        <LogoutButton />
        <Link href="/" className="text-center font-mono text-xs text-muted-foreground hover:text-foreground">
          {t.backHome}
        </Link>
      </div>
    </div>
  );
}

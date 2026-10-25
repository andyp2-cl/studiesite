import "katex/dist/katex.min.css";
import { AppShell } from "@/components/shell/app-shell";
import { requireProfile } from "@/lib/auth/session";

// Everything a signed-in user (student or admin) sees, inside the navigation shell.
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return <AppShell showAdmin={profile.role === "admin"}>{children}</AppShell>;
}

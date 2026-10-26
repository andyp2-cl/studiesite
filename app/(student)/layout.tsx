import "katex/dist/katex.min.css";
import { AppShell } from "@/components/shell/app-shell";
import { ViewAsBar } from "@/components/shell/view-as-bar";
import { getViewProfile, requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// Everything a signed-in user (student or admin) sees, inside the navigation shell.
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (profile.role !== "admin") return <AppShell>{children}</AppShell>;

  const supabase = await createClient();
  const [{ data: students }, viewed] = await Promise.all([
    supabase.from("profiles").select("id, display_name").eq("role", "student").order("display_name"),
    getViewProfile(),
  ]);
  return (
    <AppShell showAdmin>
      <ViewAsBar
        students={(students ?? []).map((s) => ({ id: s.id, name: s.display_name }))}
        current={viewed && viewed.id !== profile.id ? viewed.id : null}
      />
      {children}
    </AppShell>
  );
}

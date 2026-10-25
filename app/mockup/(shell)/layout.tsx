import { BASE } from "@/app/mockup/_mock";
import { AppShell } from "@/components/shell/app-shell";

// Pages with navigation. The task flow lives outside this group so it runs full screen.
export default function MockupShellLayout({ children }: { children: React.ReactNode }) {
  return <AppShell basePath={BASE}>{children}</AppShell>;
}

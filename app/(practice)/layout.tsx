import "katex/dist/katex.min.css";
import { requireProfile } from "@/lib/auth/session";

// Full-screen practice flow: no navigation, so a tap cannot leave a round by accident.
export default async function PracticeLayout({ children }: { children: React.ReactNode }) {
  await requireProfile();
  return children;
}

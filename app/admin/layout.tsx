import { requireAdmin } from "@/lib/auth/session";

// Every page under /admin requires the admin role. Students are redirected home
// before anything renders. Server actions under /admin must call requireAdmin() too.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return children;
}

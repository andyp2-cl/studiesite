import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Read-side for the student shop (/butik) and the admin rewards page.

export async function getShop(userId: string) {
  const supabase = await createClient();
  const [{ data: rewards }, { data: purchases }] = await Promise.all([
    supabase.from("rewards").select("id, name, description, icon, price").eq("is_active", true).order("price"),
    supabase
      .from("reward_redemptions")
      .select("id, price, status, created_at, rewards(name, icon)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  return {
    rewards: rewards ?? [],
    purchases: (purchases ?? []).map((p) => ({ ...p, name: p.rewards?.name ?? "", icon: p.rewards?.icon ?? "gift" })),
  };
}

export async function getAdminRewards() {
  await requireAdmin();
  const db = createAdminClient();
  const [{ data: rewards }, { data: redemptions }] = await Promise.all([
    db.from("rewards").select("id, name, description, icon, price, is_active").order("is_active", { ascending: false }).order("price"),
    db
      .from("reward_redemptions")
      .select("id, price, status, created_at, decided_at, rewards(name, icon), profiles!reward_redemptions_user_id_fkey(display_name)")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);
  const rows = (redemptions ?? []).map((r) => ({
    id: r.id,
    price: r.price,
    status: r.status,
    createdAt: r.created_at,
    reward: r.rewards?.name ?? "",
    icon: r.rewards?.icon ?? "gift",
    student: r.profiles?.display_name ?? "",
  }));
  return { rewards: rewards ?? [], pending: rows.filter((r) => r.status === "pending"), decided: rows.filter((r) => r.status !== "pending").slice(0, 15) };
}


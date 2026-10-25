import "server-only";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// Read-side for admin pages. Runs as the admin, so RLS shows hidden content too.

export async function getAdminSubjects() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("id, name, slug, color, icon, is_hidden, areas(count)")
    .order("sort_order");
  return (data ?? []).map((s) => ({ ...s, areaCount: s.areas[0]?.count ?? 0 }));
}

export async function getAdminSubject(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("id, name, slug, description, color, icon, is_hidden, areas(id, name, slug, color, icon, is_hidden, sort_order, moments(count))")
    .eq("id", id)
    .order("sort_order", { referencedTable: "areas" })
    .maybeSingle();
  if (!data) return null;
  return {
    ...data,
    areas: data.areas.map((a) => ({ ...a, momentCount: a.moments[0]?.count ?? 0 })),
  };
}

export async function getAdminArea(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("areas")
    .select(
      "id, name, slug, description, color, icon, is_hidden, subjects(id, name), moments(id, name, slug, is_hidden, sort_order, source, generators(generator_key), tasks(count))",
    )
    .eq("id", id)
    .order("sort_order", { referencedTable: "moments" })
    .maybeSingle();
  if (!data?.subjects) return null;
  return {
    ...data,
    subject: data.subjects,
    moments: data.moments.map((m) => ({ ...m, taskCount: m.tasks[0]?.count ?? 0 })),
  };
}

export async function getAdminMoment(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("moments")
    .select(
      "id, name, slug, description, is_hidden, source, areas(id, name, subjects(id, name)), generators(generator_key), content_blocks(id, type, title, body_md, unlock_level, sort_order), tasks(id, level, type, prompt_md, status, created_at)",
    )
    .eq("id", id)
    .order("sort_order", { referencedTable: "content_blocks" })
    .order("level", { referencedTable: "tasks" })
    .order("created_at", { referencedTable: "tasks" })
    .maybeSingle();
  if (!data?.areas?.subjects) return null;
  return {
    ...data,
    area: data.areas,
    subject: data.areas.subjects,
    generatorKey: data.generators?.generator_key ?? null,
    intro: data.content_blocks.find((b) => b.type === "intro")?.body_md ?? "",
    deepenings: data.content_blocks
      .filter((b) => b.type === "deepening")
      .map((b) => ({ id: b.id, title: b.title ?? "", unlockLevel: b.unlock_level ?? 1, body: b.body_md })),
  };
}

export async function getAdminTask(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("tasks").select("*").eq("id", id).maybeSingle();
  return data;
}

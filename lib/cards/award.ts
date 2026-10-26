import "server-only";
import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTheme, pickCard, type Card, type Theme } from "./catalog";
import { areaMilestones } from "./milestones";

// Hands out cards for area milestones that have no card yet. Safe to call
// again: a milestone gives at most one card (unique per student in user_cards).

type Student = { id: string; collection_theme: string | null };

/** Checks the given areas (all areas when omitted) and returns the new cards, if any. */
export async function awardAreaCards(student: Student, areaIds?: string[]): Promise<Card[]> {
  const theme: Theme = isTheme(student.collection_theme) ? student.collection_theme : "football";
  const admin = createAdminClient();

  let query = admin
    .from("moments")
    .select("id, area_id, mode, is_hidden, areas!inner(is_hidden, subjects!inner(is_hidden))")
    .eq("is_hidden", false)
    .eq("areas.is_hidden", false)
    .eq("areas.subjects.is_hidden", false);
  if (areaIds) query = query.in("area_id", areaIds);
  const [{ data: moments }, { data: progress }, { data: cards }] = await Promise.all([
    query,
    admin.from("moment_progress").select("moment_id, stars, quiz_passed_at").eq("user_id", student.id),
    admin.from("user_cards").select("card_id, theme, milestone").eq("user_id", student.id),
  ]);
  if (!moments?.length) return [];

  const byMoment = new Map((progress ?? []).map((p) => [p.moment_id, p]));
  const byArea = new Map<string, typeof moments>();
  for (const m of moments) byArea.set(m.area_id, [...(byArea.get(m.area_id) ?? []), m]);

  const done = new Set((cards ?? []).map((c) => c.milestone));
  const owned = new Set((cards ?? []).filter((c) => c.theme === theme).map((c) => c.card_id));
  const won: Card[] = [];

  for (const [areaId, list] of byArea) {
    const reached = areaMilestones(
      areaId,
      list.map((m) => ({
        mode: m.mode,
        stars: byMoment.get(m.id)?.stars ?? 0,
        quizPassed: Boolean(byMoment.get(m.id)?.quiz_passed_at),
      })),
    );
    for (const milestone of reached.filter((r) => !done.has(r.key))) {
      const card = pickCard(theme, milestone.tier, owned, randomInt(0, 1_000_000) / 1_000_000);
      if (!card) return won; // the whole series is collected
      const { error } = await admin
        .from("user_cards")
        .insert({ user_id: student.id, theme, card_id: card.id, milestone: milestone.key });
      // A unique violation means another request handed out this milestone first.
      if (error) continue;
      owned.add(card.id);
      done.add(milestone.key);
      won.push(card);
    }
  }
  return won;
}


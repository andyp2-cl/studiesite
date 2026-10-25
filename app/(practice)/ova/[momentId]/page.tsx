import { notFound, redirect } from "next/navigation";
import { PracticeSession } from "@/components/practice/practice-session";
import { isLevel, type Level } from "@/lib/generators/types";
import { nextTask } from "@/lib/practice/actions";
import { createClient } from "@/lib/supabase/server";

export default async function PracticePage({ params, searchParams }: PageProps<"/ova/[momentId]">) {
  const { momentId } = await params;
  const { niva } = await searchParams;
  const level: Level = isLevel(Number(niva)) ? (Number(niva) as Level) : 1;

  const supabase = await createClient();
  const { data: moment } = await supabase
    .from("moments")
    .select("id, slug, name, areas(slug, name, color, subjects(slug))")
    .eq("id", momentId)
    .maybeSingle();
  if (!moment?.areas?.subjects) notFound();

  const momentHref = `/amnen/${moment.areas.subjects.slug}/${moment.areas.slug}/${moment.slug}`;
  // nextTask also enforces that the level is unlocked and the moment has a generator.
  const firstTask = await nextTask(moment.id, level);
  if (!firstTask) redirect(momentHref);

  return (
    <PracticeSession
      momentId={moment.id}
      momentName={moment.name}
      areaName={moment.areas.name}
      areaColor={moment.areas.color}
      momentHref={momentHref}
      firstTask={firstTask}
    />
  );
}

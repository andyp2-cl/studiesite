import { notFound, redirect } from "next/navigation";
import { PracticeSession } from "@/components/practice/practice-session";
import { ROUND_SIZES } from "@/lib/practice/ref";
import { isLevel, type Level } from "@/lib/generators/types";
import { nextTask } from "@/lib/practice/actions";
import { createClient } from "@/lib/supabase/server";

export default async function PracticePage({ params, searchParams }: PageProps<"/ova/[momentId]">) {
  const { momentId } = await params;
  const { niva, antal } = await searchParams;
  const level: Level = isLevel(Number(niva)) ? (Number(niva) as Level) : 1;
  const roundSize = ROUND_SIZES.find((n) => n === Number(antal)) ?? 10;

  const supabase = await createClient();
  const { data: moment } = await supabase
    .from("moments")
    .select("id, slug, name, mode, areas(slug, name, color, subjects(slug))")
    .eq("id", momentId)
    .maybeSingle();
  if (!moment?.areas?.subjects) notFound();

  const momentHref = `/amnen/${moment.areas.subjects.slug}/${moment.areas.slug}/${moment.slug}`;
  // nextTask returns null if the moment has no generator or no published tasks at this level.
  const read = moment.mode === "read";
  const firstTask = await nextTask(moment.id, read ? 1 : level);
  if (!firstTask) redirect(momentHref);

  // "Läs och svara": the reading text can be opened while answering.
  const { data: readings } = read
    ? await supabase
        .from("content_blocks")
        .select("title, body_md")
        .eq("moment_id", moment.id)
        .eq("type", "reading")
        .order("sort_order")
    : { data: null };

  return (
    <PracticeSession
      momentId={moment.id}
      momentName={moment.name}
      areaName={moment.areas.name}
      areaColor={moment.areas.color}
      momentHref={momentHref}
      firstTask={firstTask}
      roundSize={roundSize}
      readings={readings ? readings.map((r) => ({ title: r.title ?? "", body: r.body_md })) : null}
    />
  );
}

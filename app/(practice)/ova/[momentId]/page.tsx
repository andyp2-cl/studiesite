import { notFound, redirect } from "next/navigation";
import { PracticeSession } from "@/components/practice/practice-session";
import { isLevel, type Level } from "@/lib/generators/types";
import { nextTask, prepareRound, reviewRoundSize } from "@/lib/practice/actions";
import { searchLinks } from "@/lib/sources/wikipedia";
import { createClient } from "@/lib/supabase/server";

export default async function PracticePage({ params, searchParams }: PageProps<"/ova/[momentId]">) {
  const { momentId } = await params;
  const { niva, antal, repetera } = await searchParams;
  const level: Level = isLevel(Number(niva)) ? (Number(niva) as Level) : 1;
  const requested = Number(antal);

  const supabase = await createClient();
  const { data: moment } = await supabase
    .from("moments")
    .select("id, slug, name, mode, areas(slug, name, color, subjects(slug, name))")
    .eq("id", momentId)
    .maybeSingle();
  if (!moment?.areas?.subjects) notFound();

  const momentHref = `/amnen/${moment.areas.subjects.slug}/${moment.areas.slug}/${moment.slug}`;
  // A round is only as long as the new questions we can actually give.
  const read = moment.mode === "read";
  // "Repetera": questions already answered, the missed ones first ("Läs och svara" only).
  const review = read && repetera === "1";
  const size = Number.isInteger(requested) ? requested : 10;
  const roundSize = review ? await reviewRoundSize(moment.id, 1, size) : await prepareRound(moment.id, read ? 1 : level, size);
  if (!roundSize) redirect(momentHref);
  const firstTask = await nextTask(moment.id, read ? 1 : level, [], review);
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
      review={review}
      readings={readings ? readings.map((r) => ({ title: r.title ?? "", body: r.body_md })) : null}
      helpLinks={searchLinks(moment.name, /matem/i.test(moment.areas.subjects.name))}
    />
  );
}

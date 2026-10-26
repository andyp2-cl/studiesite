import { redirect } from "next/navigation";
import { PracticeSession } from "@/components/practice/practice-session";
import { requireProfile } from "@/lib/auth/session";
import { getDailyMix } from "@/lib/data/content";
import { nextTask } from "@/lib/practice/actions";

export default async function DailyMixPage() {
  const profile = await requireProfile();
  const mix = await getDailyMix(profile.id);
  const first = mix[0];
  // No practised level moments yet, or the first task is gone: back to the home page.
  const firstTask = first ? await nextTask(first.momentId, first.level) : null;
  if (!first || !firstTask) redirect("/");

  return (
    <PracticeSession
      momentId={first.momentId}
      momentName={first.momentName}
      areaName={first.areaName}
      areaColor={first.areaColor}
      momentHref={first.momentHref}
      firstTask={firstTask}
      roundSize={mix.length}
      readings={null}
      helpLinks={first.helpLinks}
      mix={mix}
    />
  );
}

import { Collection } from "@/components/monsters/collection";
import { PageHeader } from "@/components/study/page-header";
import { getCurrentProfile, requireViewProfile } from "@/lib/auth/session";
import { strings } from "@/lib/strings";
import { createClient } from "@/lib/supabase/server";

const t = strings.collection;

export default async function CollectionPage() {
  const profile = await requireViewProfile();
  const me = await getCurrentProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("user_monsters").select("monster_id, count").eq("user_id", profile.id);
  const owned = Object.fromEntries((data ?? []).map((r) => [r.monster_id, r.count]));

  return (
    <main>
      <PageHeader kicker={t.kicker} title={t.title} width="max-w-3xl">
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">{t.intro}</p>
      </PageHeader>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <Collection key={profile.id} owned={owned} coins={profile.coins} canOpen={me?.role === "student"} />
      </div>
    </main>
  );
}

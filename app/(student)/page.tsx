import { Chip } from "@/components/study/visuals";
import { greetingFor } from "@/lib/greeting";
import { requireProfile } from "@/lib/auth/session";
import { strings } from "@/lib/strings";

// Real home page arrives in step 4; for now it proves login and profile work.
export default async function Home() {
  const profile = await requireProfile();

  return (
    <main>
      <header className="bg-dots border-b border-border">
        <div className="mx-auto max-w-5xl px-4 pt-10 pb-8 sm:px-8 sm:pt-14">
          <div className="mb-6 flex flex-wrap gap-2">
            <Chip>
              {strings.profile.level} {profile.level}
            </Chip>
            <Chip>{profile.xp} XP</Chip>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            {greetingFor(new Date())},{" "}
            <span className="font-serif font-normal text-primary italic">{profile.display_name}</span>.
          </h1>
          <p className="mt-6 text-muted-foreground">{strings.home.comingSoon}</p>
        </div>
      </header>
    </main>
  );
}

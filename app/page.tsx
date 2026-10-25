import { greetingFor } from "@/lib/greeting";
import { strings } from "@/lib/strings";

// Placeholder start page for step 1; the real Spotify-style home comes in step 4.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-bold tracking-tight">{greetingFor(new Date())}</h1>
      <div className="rounded-xl bg-gradient-to-br from-primary/80 to-emerald-900 p-6 text-primary-foreground">
        <p className="text-lg font-semibold">{strings.app.name}</p>
        <p className="opacity-90">{strings.home.comingSoon}</p>
      </div>
    </main>
  );
}

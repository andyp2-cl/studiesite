import Link from "next/link";
import { Icon } from "@/components/icon";
import { areaGradient } from "@/components/study/visuals";
import { strings } from "@/lib/strings";
import { BASE, areas } from "@/app/mockup/_mock";

// Spotify "Browse" style grid of areas.
export default function MockSubjects() {
  return (
    <main className="px-4 pt-6 pb-8 sm:px-6 md:pt-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">{strings.home.areas}</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {areas.map((area) => (
          <Link
            key={area.slug}
            href={`${BASE}/omrade`}
            className="relative aspect-[16/10] overflow-hidden rounded-lg p-3 transition-transform hover:scale-[1.02] sm:p-4"
            style={{ background: areaGradient(area.color, 70) }}
          >
            <span className="block text-lg leading-tight font-extrabold text-white sm:text-xl">{area.name}</span>
            <span className="text-xs font-semibold text-white/80">{strings.home.moments(area.moments.length)}</span>
            <Icon
              name={area.icon}
              className="absolute -right-3 -bottom-3 size-20 rotate-[25deg] text-white/35 sm:size-24"
            />
          </Link>
        ))}
      </div>
    </main>
  );
}

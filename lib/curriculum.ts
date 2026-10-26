// Lgr22 central content ("centralt innehåll") from Skolverket's open Syllabus
// API. Free and keyless; responses are cached for a week by Next's fetch cache.
// It tells the admin and the AI what students in a school year should learn.

const API = "https://api.skolverket.se/syllabus/v1";
const WEEK = 60 * 60 * 24 * 7;

/** Our subject names that differ from Skolverket's. */
const ALIASES: Record<string, string> = { tyska: "Moderna språk", spanska: "Moderna språk", franska: "Moderna språk" };

export type Stage = "1-3" | "4-6" | "7-9";

export function stageForGrade(grade: number): Stage {
  return grade <= 3 ? "1-3" : grade <= 6 ? "4-6" : "7-9";
}

/** Stages to show for the students' grades; without any grade set, the middle and upper stages. */
export function stagesFor(grades: (number | null)[]): Stage[] {
  const set = new Set(grades.filter((g): g is number => g !== null).map(stageForGrade));
  if (set.size === 0) return ["4-6", "7-9"];
  return (["1-3", "4-6", "7-9"] as const).filter((s) => set.has(s));
}

const ENTITIES: Record<string, string> = { "&shy;": "", "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&lt;": "<", "&gt;": ">" };

/** Skolverket's HTML as plain text: headings on their own lines, list items as "- ". */
export function syllabusText(html: string): string {
  return html
    .replace(/­/g, "")
    .replace(/&[a-z]+;/g, (m) => ENTITIES[m] ?? m)
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g, "\n\n$1\n")
    .replace(/<li[^>]*>/g, "\n- ")
    .replace(/<\/(p|ul)>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type RawSubject = { centralContents?: { year?: string; text?: string }[] };

/** Central content per stage; entries spanning stages (e.g. "4-9") count for each stage they cover. */
export function centralContent(subject: RawSubject, stages: Stage[]): { stage: Stage; text: string }[] {
  const covers = (year: string, stage: Stage) => {
    const [from, to] = year.split("-").map(Number);
    const [sFrom, sTo] = stage.split("-").map(Number);
    return from <= sFrom && to >= sTo;
  };
  return stages
    .map((stage) => ({
      stage,
      text: (subject.centralContents ?? [])
        .filter((c) => c.year && c.text && covers(c.year, stage))
        .map((c) => syllabusText(c.text!))
        .join("\n\n"),
    }))
    .filter((c) => c.text);
}

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { next: { revalidate: WEEK }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`skolverket ${res.status}`);
  return res.json();
}

/** Central content for one of our subjects, or null if Skolverket has no matching subject or is down. */
export async function curriculumFor(subjectName: string, stages: Stage[]): Promise<{ stage: Stage; text: string }[] | null> {
  try {
    const name = (ALIASES[subjectName.toLowerCase()] ?? subjectName).toLowerCase();
    const list = (await getJson(`${API}/subjects?schooltype=GR&timespan=LATEST`)) as { subjects?: { code: string; name: string; typeOfSyllabus: string }[] };
    const match = list.subjects?.find((s) => s.typeOfSyllabus === "COURSE_SYLLABUS" && s.name.toLowerCase() === name);
    if (!match) return null;
    const detail = (await getJson(`${API}/subjects/${match.code}?timespan=LATEST`)) as { subject?: RawSubject };
    if (!detail.subject) return null;
    const out = centralContent(detail.subject, stages);
    return out.length ? out : null;
  } catch {
    return null;
  }
}

/** For prompts: the central content as one block, labelled by stage. */
export function curriculumForPrompt(parts: { stage: Stage; text: string }[] | null): string {
  if (!parts?.length) return "";
  return parts.map((p) => `<curriculum stage="åk ${p.stage}">\n${p.text}\n</curriculum>`).join("\n\n");
}

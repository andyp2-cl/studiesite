// Swedish Wikipedia as a free source: search and plain-text articles through
// the public MediaWiki API (no key, no AI). Parsing is pure so it is tested
// without the network; the fetch helpers are thin wrappers.

const API = "https://sv.wikipedia.org/w/api.php";
// Wikimedia asks API clients to identify themselves.
const USER_AGENT = "Studiesite/0.1 (private family study site; https://studiesite.vercel.app)";
const TIMEOUT_MS = 10_000;

export type WikiHit = { title: string; snippet: string; words: number };

const stripTags = (html: string) =>
  html
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

export function parseSearch(json: unknown): WikiHit[] {
  const hits = (json as { query?: { search?: unknown } })?.query?.search;
  if (!Array.isArray(hits)) return [];
  return hits
    .filter((h) => typeof h?.title === "string")
    .map((h) => ({ title: h.title as string, snippet: stripTags(String(h.snippet ?? "")), words: Number(h.wordcount) || 0 }));
}

/** Sections that are references or link lists, not reading material. */
const SKIP_SECTIONS = new Set([
  "se även",
  "referenser",
  "noter",
  "anmärkningar",
  "källor",
  "vidare läsning",
  "externa länkar",
  "litteratur",
  "anfäder",
  "fotnoter",
]);

/** The article as Markdown-ish text: headings kept as ##, reference sections dropped. */
export function cleanExtract(text: string): string {
  const out: string[] = [];
  let skipDepth = 0; // heading level that started a skipped section, 0 = not skipping
  for (const line of text.split("\n")) {
    const heading = line.match(/^(={2,6})\s*(.+?)\s*\1\s*$/);
    if (heading) {
      const depth = heading[1].length;
      if (skipDepth && depth > skipDepth) continue;
      skipDepth = SKIP_SECTIONS.has(heading[2].toLowerCase()) ? depth : 0;
      if (!skipDepth) out.push("", `${"#".repeat(Math.min(depth, 4))} ${heading[2]}`);
      continue;
    }
    if (!skipDepth) out.push(line);
  }
  return out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type WikiArticle = { title: string; url: string; text: string };

export function parseExtract(json: unknown): WikiArticle | null {
  const page = (json as { query?: { pages?: unknown[] } })?.query?.pages?.[0] as
    | { title?: string; extract?: string; missing?: boolean }
    | undefined;
  if (!page?.title || page.missing || !page.extract) return null;
  const text = cleanExtract(page.extract);
  if (!text) return null;
  return { title: page.title, url: articleUrl(page.title), text };
}

export const articleUrl = (title: string) => `https://sv.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

async function call(params: Record<string, string>): Promise<unknown> {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`wikipedia ${res.status}`);
  return res.json();
}

export async function searchWikipedia(query: string, limit = 6): Promise<WikiHit[]> {
  return parseSearch(await call({ action: "query", list: "search", srsearch: query, srlimit: String(limit), srprop: "snippet|wordcount" }));
}

export async function wikipediaArticle(title: string): Promise<WikiArticle | null> {
  return parseExtract(await call({ action: "query", prop: "extracts", explaintext: "1", redirects: "1", titles: title }));
}

/** Search pages on free Swedish study sites, opened in a new tab (nothing is fetched by us). */
export function searchLinks(query: string, math: boolean): { label: string; url: string }[] {
  const q = (site: string) => `https://www.google.com/search?q=${encodeURIComponent(`site:${site} ${query}`)}`;
  return [math ? { label: "Matteboken", url: q("matteboken.se") } : { label: "SO-rummet", url: q("so-rummet.se") }, { label: "UR Play", url: q("urplay.se") }];
}

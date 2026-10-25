import "server-only";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

// Fetches a web page and extracts its readable text (like Firefox reader view).
// Only admins add sources, but the server still refuses internal addresses.

export const MAX_SOURCE_CHARS = 100_000;
const MAX_BYTES = 3_000_000;
const TIMEOUT_MS = 15_000;

/** http(s) only, and never localhost, private networks or cloud metadata addresses. */
export function isSafeUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (/^\d+$/.test(host)) return false; // decimal IP tricks like http://2130706433
  const v4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224) {
      return false;
    }
  }
  if (host.includes(":")) {
    // IPv6 literal: refuse loopback, link-local and unique-local ranges.
    if (host === "::1" || host === "::" || host.startsWith("fe80") || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("::ffff:")) {
      return false;
    }
  }
  return true;
}

function tidy(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Readable title and text from an HTML document. Pure – exported for tests. */
export function extractReadable(html: string, fallbackTitle: string): { title: string; text: string } {
  const { document } = parseHTML(html);
  const pageTitle = document.querySelector("title")?.textContent?.trim() || fallbackTitle;
  try {
    // Readability mutates the document it is given.
    const article = new Readability(document as unknown as Document).parse();
    if (article?.textContent && article.textContent.trim().length > 200) {
      return { title: (article.title || pageTitle).trim(), text: tidy(article.textContent).slice(0, MAX_SOURCE_CHARS) };
    }
  } catch {
    // Fall through to the plain-text fallback.
  }
  const { document: fresh } = parseHTML(html);
  fresh.querySelectorAll("script, style, noscript, nav, header, footer, aside, form").forEach((el) => el.remove());
  const body = fresh.querySelector("main, article") ?? fresh.body;
  return { title: pageTitle, text: tidy(body?.textContent ?? "").slice(0, MAX_SOURCE_CHARS) };
}

export type FetchResult = { ok: true; title: string; text: string } | { ok: false; error: string };

/** Fetches a page and returns its readable text. Errors are Swedish, for the admin. */
export async function fetchReadable(url: string): Promise<FetchResult> {
  if (!isSafeUrl(url)) return { ok: false, error: "Adressen är inte tillåten. Använd en vanlig webbadress som börjar med https://." };
  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Studiesite/1.0; +https://studiesite.vercel.app)", Accept: "text/html,text/plain" },
    });
  } catch {
    return { ok: false, error: "Sidan svarade inte. Kontrollera adressen eller försök igen senare." };
  }
  if (!isSafeUrl(response.url)) return { ok: false, error: "Sidan skickade vidare till en adress som inte är tillåten." };
  if (!response.ok) return { ok: false, error: `Sidan kunde inte hämtas (fel ${response.status}).` };

  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("text/html") && !type.includes("text/plain")) {
    return { ok: false, error: "Det är inte en vanlig webbsida (t.ex. en PDF). Klistra in texten i stället." };
  }
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) return { ok: false, error: "Sidan är för stor att läsa in." };

  const raw = (await response.text()).slice(0, MAX_BYTES);
  const fallbackTitle = new URL(response.url).hostname;
  const { title, text } = type.includes("text/plain") ? { title: fallbackTitle, text: tidy(raw).slice(0, MAX_SOURCE_CHARS) } : extractReadable(raw, fallbackTitle);
  if (text.length < 200) {
    return { ok: false, error: "Sidan innehöll nästan ingen text att läsa (den kan kräva inloggning). Klistra in texten i stället." };
  }
  return { ok: true, title: title.slice(0, 200), text };
}

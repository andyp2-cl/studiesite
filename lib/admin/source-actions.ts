"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { fetchReadable, isSafeUrl, MAX_SOURCE_CHARS } from "@/lib/sources/extract";
import { articleUrl, searchWikipedia, wikipediaArticle, type WikiArticle, type WikiHit } from "@/lib/sources/wikipedia";
import { strings } from "@/lib/strings";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./content-actions";

// Sources on an area: links whose text is fetched now, or pasted text.

const e = strings.admin.sources.errors;
const fail = (error: string): ActionResult => ({ ok: false, error });

async function nextOrder(areaId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sources")
    .select("sort_order")
    .eq("area_id", areaId)
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

/** Adds a link and fetches its text right away. A failed fetch is kept so the admin sees why. */
export async function addSourceLink(areaId: string, rawUrl: string): Promise<ActionResult> {
  await requireAdmin();
  const url = String(rawUrl ?? "").trim();
  if (!isSafeUrl(url)) return fail(e.url);

  const supabase = await createClient();
  const result = await fetchReadable(url);
  const { data, error } = await supabase
    .from("sources")
    .insert({
      area_id: areaId,
      url,
      title: result.ok ? result.title : new URL(url).hostname,
      content: result.ok ? result.text : "",
      status: result.ok ? "ready" : "failed",
      error: result.ok ? null : result.error,
      fetched_at: new Date().toISOString(),
      sort_order: await nextOrder(areaId),
    })
    .select("id")
    .single();
  if (error) return fail(e.generic);
  refresh();
  return result.ok ? { ok: true, id: data.id } : fail(result.error);
}

/** For pages that need a login, PDFs or book excerpts: the admin pastes the text. */
export async function addSourceText(areaId: string, rawTitle: string, rawText: string): Promise<ActionResult> {
  await requireAdmin();
  const title = String(rawTitle ?? "").trim().slice(0, 200);
  const text = String(rawText ?? "").trim().slice(0, MAX_SOURCE_CHARS);
  if (!title) return fail(e.title);
  if (text.length < 100) return fail(e.tooShort);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .insert({ area_id: areaId, title, content: text, status: "ready", fetched_at: new Date().toISOString(), sort_order: await nextOrder(areaId) })
    .select("id")
    .single();
  if (error) return fail(e.generic);
  refresh();
  return { ok: true, id: data.id };
}

export async function refetchSource(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: source } = await supabase.from("sources").select("url").eq("id", id).maybeSingle();
  if (!source?.url) return fail(e.generic);
  const result = await fetchReadable(source.url);
  const { error } = await supabase
    .from("sources")
    .update(
      result.ok
        ? { title: result.title, content: result.text, status: "ready", error: null, fetched_at: new Date().toISOString() }
        : { status: "failed", error: result.error, fetched_at: new Date().toISOString() },
    )
    .eq("id", id);
  if (error) return fail(e.generic);
  refresh();
  return result.ok ? { ok: true } : fail(result.error);
}

export async function deleteSource(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("sources").delete().eq("id", id);
  if (error) return fail(e.generic);
  refresh();
  return { ok: true };
}

export type WikiSuggestion = WikiHit & { url: string; added: boolean };

/** Free: searches Swedish Wikipedia for an area's topic and marks articles already added. */
export async function findWikipedia(areaId: string, rawQuery: string): Promise<{ ok: true; hits: WikiSuggestion[] } | { ok: false; error: string }> {
  await requireAdmin();
  const query = String(rawQuery ?? "").trim().slice(0, 100);
  if (!query) return fail(e.query) as { ok: false; error: string };
  let hits: WikiHit[];
  try {
    hits = await searchWikipedia(query);
  } catch {
    return fail(e.wikipedia) as { ok: false; error: string };
  }
  const supabase = await createClient();
  const { data } = await supabase.from("sources").select("url").eq("area_id", areaId);
  const added = new Set((data ?? []).map((s) => s.url));
  return { ok: true, hits: hits.map((h) => ({ ...h, url: articleUrl(h.title), added: added.has(articleUrl(h.title)) })) };
}

/** Adds a Wikipedia article as a source, read through the API as clean text. */
export async function addWikipedia(areaId: string, title: string): Promise<ActionResult> {
  await requireAdmin();
  let article: WikiArticle | null;
  try {
    article = await wikipediaArticle(String(title ?? "").slice(0, 300));
  } catch {
    return fail(e.wikipedia);
  }
  if (!article) return fail(e.wikipedia);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .insert({
      area_id: areaId,
      url: article.url,
      title: `Wikipedia: ${article.title}`,
      content: article.text.slice(0, MAX_SOURCE_CHARS),
      status: "ready",
      fetched_at: new Date().toISOString(),
      sort_order: await nextOrder(areaId),
    })
    .select("id")
    .single();
  if (error) return fail(e.generic);
  refresh();
  return { ok: true, id: data.id };
}

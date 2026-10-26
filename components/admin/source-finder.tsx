"use client";

import { Check, ExternalLink, Plus, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { addWikipedia, findWikipedia, type WikiSuggestion } from "@/lib/admin/source-actions";
import { searchLinks } from "@/lib/sources/wikipedia";
import { strings } from "@/lib/strings";
import { Button, inputClass, Message } from "./ui";

const t = strings.admin.sources;

/** Free step before any AI: find Wikipedia articles for the area and add them as sources. */
export function SourceFinder({ areaId, initialQuery, math }: { areaId: string; initialQuery: string; math: boolean }) {
  const [query, setQuery] = useState(initialQuery);
  const [hits, setHits] = useState<WikiSuggestion[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [, startAdd] = useTransition();

  function search(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startSearch(async () => {
      const result = await findWikipedia(areaId, query);
      if (result.ok) setHits(result.hits);
      else setError(result.error);
    });
  }

  function add(hit: WikiSuggestion) {
    setAdding(hit.title);
    setError(null);
    startAdd(async () => {
      const result = await addWikipedia(areaId, hit.title);
      setAdding(null);
      if (result.ok) setHits((prev) => prev?.map((h) => (h.title === hit.title ? { ...h, added: true } : h)) ?? null);
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3 border border-border p-4">
      <div>
        <p className="font-semibold">{t.find}</p>
        <p className="text-sm text-muted-foreground">{t.findHelp}</p>
      </div>
      <form onSubmit={search} className="flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} maxLength={100} aria-label={t.searchWikipedia} className={inputClass} />
        <Button type="submit" disabled={searching || !query.trim()}>
          <Search className="size-4" /> {searching ? t.searching : t.searchWikipedia}
        </Button>
      </form>

      {hits &&
        (hits.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.noHits}</p>
        ) : (
          <ul className="border border-border">
            {hits.map((h) => (
              <li key={h.title} className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold hover:text-primary">
                    {h.title} <ExternalLink className="size-3 text-muted-foreground" />
                  </a>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{h.snippet}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{t.words(h.words)}</p>
                </div>
                {h.added ? (
                  <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-success">
                    <Check className="size-3.5" /> {t.alreadyAdded}
                  </span>
                ) : (
                  <Button size="sm" className="shrink-0" disabled={adding !== null} onClick={() => add(h)}>
                    <Plus className="size-3.5" /> {adding === h.title ? t.adding : t.add}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ))}
      {error && <Message kind="error">{error}</Message>}

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
        {t.alsoSearch}
        {searchLinks(query || initialQuery, math).map((l) => (
          <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground hover:text-primary">
            {l.label} <ExternalLink className="size-3" />
          </a>
        ))}
      </p>
    </div>
  );
}

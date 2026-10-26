import { describe, expect, it } from "vitest";
import { articleUrl, cleanExtract, parseExtract, parseSearch, searchLinks } from "./wikipedia";

describe("parseSearch", () => {
  it("strips highlight markup from snippets", () => {
    const hits = parseSearch({
      query: {
        search: [{ title: "Karl XII", wordcount: 19034, snippet: '<span class="searchmatch">Karl</span> XII &quot;Kungen&quot;' }],
      },
    });
    expect(hits).toEqual([{ title: "Karl XII", snippet: 'Karl XII "Kungen"', words: 19034 }]);
  });

  it("handles garbage", () => {
    expect(parseSearch(null)).toEqual([]);
    expect(parseSearch({ query: { search: "x" } })).toEqual([]);
  });
});

describe("cleanExtract", () => {
  it("keeps the article, turns headings into Markdown and drops reference sections", () => {
    const text = [
      "Karl XII var kung.",
      "",
      "== Uppväxt ==",
      "Han föddes 1682.",
      "=== Utbildning ===",
      "Han lärde sig latin.",
      "== Se även ==",
      "Lista",
      "== Referenser ==",
      "=== Noter ===",
      "1. Not",
      "== Externa länkar ==",
      "Länk",
    ].join("\n");
    expect(cleanExtract(text)).toBe("Karl XII var kung.\n\n## Uppväxt\nHan föddes 1682.\n\n### Utbildning\nHan lärde sig latin.");
  });
});

describe("parseExtract", () => {
  it("returns the article with its URL", () => {
    expect(parseExtract({ query: { pages: [{ title: "Karl XII", extract: "Text." }] } })).toEqual({
      title: "Karl XII",
      url: "https://sv.wikipedia.org/wiki/Karl_XII",
      text: "Text.",
    });
  });

  it("returns null for missing pages", () => {
    expect(parseExtract({ query: { pages: [{ title: "Finns inte", missing: true }] } })).toBeNull();
  });
});

describe("links", () => {
  it("encodes titles and picks sites by subject", () => {
    expect(articleUrl("Karl XII:s död")).toBe("https://sv.wikipedia.org/wiki/Karl_XII%3As_d%C3%B6d");
    expect(searchLinks("Bråk", true).map((l) => l.label)).toEqual(["Matteboken", "UR Play"]);
    expect(searchLinks("Karl XII", false)[0].url).toContain(encodeURIComponent("site:so-rummet.se Karl XII"));
  });
});

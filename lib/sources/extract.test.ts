import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { extractReadable, isSafeUrl } = await import("@/lib/sources/extract");

describe("isSafeUrl", () => {
  it("allows normal web addresses", () => {
    expect(isSafeUrl("https://sv.wikipedia.org/wiki/Karl_XII")).toBe(true);
    expect(isSafeUrl("http://example.com/page?x=1")).toBe(true);
  });

  it("refuses internal and odd addresses", () => {
    for (const url of [
      "ftp://example.com",
      "file:///etc/passwd",
      "http://localhost:3000",
      "http://127.0.0.1",
      "http://10.0.0.5",
      "http://192.168.1.1",
      "http://172.20.0.1",
      "http://169.254.169.254/latest/meta-data",
      "http://2130706433",
      "http://[::1]/",
      "http://user:pass@example.com",
      "inte en adress",
    ]) {
      expect(isSafeUrl(url), url).toBe(false);
    }
  });
});

describe("extractReadable", () => {
  it("keeps the article text and drops navigation and scripts", () => {
    const paragraph = "Karl XII var kung av Sverige från 1697 till 1718. ".repeat(10);
    const html = `<html><head><title>Karl XII – Wikipedia</title><script>track()</script></head>
      <body><nav>Meny Hem Om</nav><article><h1>Karl XII</h1><p>${paragraph}</p><p>${paragraph}</p></article>
      <footer>Kontakt</footer></body></html>`;
    const { title, text } = extractReadable(html, "fallback");
    expect(title).toContain("Karl XII");
    expect(text).toContain("kung av Sverige");
    expect(text).not.toContain("track()");
    expect(text).not.toContain("Kontakt");
  });
});

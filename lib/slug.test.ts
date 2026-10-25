import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "@/lib/slug";

describe("slugify", () => {
  it("handles Swedish letters and punctuation", () => {
    expect(slugify("Bråk & procent")).toBe("brak-procent");
    expect(slugify("Förlänga och förkorta")).toBe("forlanga-och-forkorta");
    expect(slugify("  Statistik/sannolikhet!  ")).toBe("statistik-sannolikhet");
    expect(slugify("Ålder, ärter, öar")).toBe("alder-arter-oar");
  });

  it("never returns an empty slug", () => {
    expect(slugify("!!!")).toBe("namnlos");
  });
});

describe("uniqueSlug", () => {
  it("adds a number when the slug is taken", () => {
    expect(uniqueSlug("Bråk", [])).toBe("brak");
    expect(uniqueSlug("Bråk", ["brak"])).toBe("brak-2");
    expect(uniqueSlug("Bråk", ["brak", "brak-2"])).toBe("brak-3");
  });
});

import { describe, expect, it } from "vitest";
import { normalizeUsername, usernameToEmail } from "@/lib/auth/username";

describe("normalizeUsername", () => {
  it("lower-cases and trims", () => {
    expect(normalizeUsername("  Elsa ")).toBe("elsa");
  });

  it("rejects characters that are not allowed", () => {
    expect(normalizeUsername("åsa")).toBeNull();
    expect(normalizeUsername("a b")).toBeNull();
    expect(normalizeUsername("x")).toBeNull();
    expect(normalizeUsername("anna@mail.se")).toBeNull();
  });
});

describe("usernameToEmail", () => {
  it("maps to the internal pseudo domain", () => {
    expect(usernameToEmail("elsa")).toBe("elsa@studiesite.local");
  });
});

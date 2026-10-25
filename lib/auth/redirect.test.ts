import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/redirect";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/topplista")).toBe("/topplista");
    expect(safeNextPath("/amnen/matematik?x=1")).toBe("/amnen/matematik?x=1");
  });

  it("falls back to / for missing or external targets", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("")).toBe("/");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
  });

  it("does not loop back to the login page", () => {
    expect(safeNextPath("/logga-in")).toBe("/");
  });
});

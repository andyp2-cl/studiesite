import { describe, expect, it } from "vitest";
import { EXTENSIONS_PER_DAY, extensionAllowed, MAX_READING_SECTIONS, type ExtensionState } from "./extension-rules";

const ready: ExtensionState = { unseen: 0, readingSections: 3, usedToday: 0, aiAvailable: true };

describe("extensionAllowed", () => {
  it("allows more when the student has finished everything", () => {
    expect(extensionAllowed(ready)).toBe(true);
  });

  it("waits until every question is used, passed or not", () => {
    expect(extensionAllowed({ ...ready, unseen: 2 })).toBe(false);
  });

  it("stops at the caps and without AI", () => {
    expect(extensionAllowed({ ...ready, readingSections: MAX_READING_SECTIONS })).toBe(false);
    expect(extensionAllowed({ ...ready, readingSections: 0 })).toBe(false);
    expect(extensionAllowed({ ...ready, usedToday: EXTENSIONS_PER_DAY })).toBe(false);
    expect(extensionAllowed({ ...ready, aiAvailable: false })).toBe(false);
  });
});

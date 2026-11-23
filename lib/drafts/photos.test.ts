import { describe, expect, it } from "vitest";
import { MAX_PHOTO_BYTES, MAX_PHOTOS, photosForAi } from "./photos";

const file = (type: string, bytes: number[] | number) => {
  const data = typeof bytes === "number" ? new Uint8Array(bytes) : new Uint8Array(bytes);
  return { type, size: data.length, arrayBuffer: async () => data.buffer };
};

describe("photosForAi", () => {
  it("turns photos into base64 images", async () => {
    const result = await photosForAi([file("image/jpeg", [104, 105])]);
    expect(result).toEqual({ ok: true, images: [{ mediaType: "image/jpeg", base64: "aGk=" }] });
  });

  it("ignores empty file fields and needs at least one photo", async () => {
    expect(await photosForAi([])).toEqual({ ok: false, reason: "none" });
    expect(await photosForAi([file("application/octet-stream", 0)])).toEqual({ ok: false, reason: "none" });
  });

  it("rejects too many photos", async () => {
    const many = Array.from({ length: MAX_PHOTOS + 1 }, () => file("image/png", [1]));
    expect(await photosForAi(many)).toEqual({ ok: false, reason: "too_many" });
  });

  it("rejects files that are not images Claude can read", async () => {
    expect(await photosForAi([file("image/heic", [1])])).toEqual({ ok: false, reason: "bad_type" });
    expect(await photosForAi([file("application/pdf", [1])])).toEqual({ ok: false, reason: "bad_type" });
  });

  it("rejects photos that are too large", async () => {
    expect(await photosForAi([file("image/jpeg", MAX_PHOTO_BYTES + 1)])).toEqual({ ok: false, reason: "too_large" });
  });
});

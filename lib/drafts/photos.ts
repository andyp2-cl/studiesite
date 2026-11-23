import type { AiImage, AiImageType } from "@/lib/ai";

// Photos the admin uploads to draft a moment from. The browser shrinks them
// before upload, so these limits are only a guard against odd files.

export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const TYPES: readonly AiImageType[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type PhotoFile = { type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> };

export type PhotoCheck = { ok: true; images: AiImage[] } | { ok: false; reason: "none" | "too_many" | "bad_type" | "too_large" };

const isImageType = (type: string): type is AiImageType => (TYPES as readonly string[]).includes(type);

/** Validates uploaded photos and turns them into base64 images for the AI. */
export async function photosForAi(files: PhotoFile[]): Promise<PhotoCheck> {
  const photos = files.filter((f) => f.size > 0);
  if (photos.length === 0) return { ok: false, reason: "none" };
  if (photos.length > MAX_PHOTOS) return { ok: false, reason: "too_many" };
  const images: AiImage[] = [];
  for (const photo of photos) {
    if (!isImageType(photo.type)) return { ok: false, reason: "bad_type" };
    if (photo.size > MAX_PHOTO_BYTES) return { ok: false, reason: "too_large" };
    images.push({ mediaType: photo.type, base64: Buffer.from(await photo.arrayBuffer()).toString("base64") });
  }
  return { ok: true, images };
}

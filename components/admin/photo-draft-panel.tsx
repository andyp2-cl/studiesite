"use client";

import { Camera, ImagePlus, LoaderCircle, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { draftFromPhoto, type DraftResult } from "@/lib/drafts/actions";
import { strings } from "@/lib/strings";
import { Button, Message, textareaClass } from "./ui";

const t = strings.admin.drafts.photo;

const MAX_PHOTOS = 4;
// Long side in pixels. Enough for Claude to read small print, small enough
// that four photos stay well under Vercel's 4.5 MB request limit.
const MAX_SIDE = 1600;
const QUALITY = 0.82;

/** Shrinks a photo to a JPEG with at most MAX_SIDE pixels on its long side. */
async function shrink(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.fillStyle = "#fff"; // transparent PNGs become white, not black
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
    if (!blob) throw new Error("no blob");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Photo = { id: string; blob: Blob; preview: string };

/**
 * "Skapa från foto av frågor" on a "Läs och svara" moment: the admin photographs
 * questions (the phone camera opens directly) and the AI writes a short reading
 * text and turns the questions into quiz questions, saved as drafts.
 */
export function PhotoDraftPanel({ momentId, unavailable }: { momentId: string; unavailable: string | null }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [note, setNote] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<DraftResult | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // Free the preview URLs when the panel goes away.
  const previews = useRef<string[]>([]);
  useEffect(() => {
    previews.current = photos.map((p) => p.preview);
  }, [photos]);
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setResult(null);
    setPreparing(true);
    try {
      const room = MAX_PHOTOS - photos.length;
      const picked = Array.from(files).slice(0, room);
      const added = await Promise.all(
        picked.map(async (file) => {
          const blob = await shrink(file);
          return { id: crypto.randomUUID(), blob, preview: URL.createObjectURL(blob) };
        }),
      );
      setPhotos((current) => [...current, ...added].slice(0, MAX_PHOTOS));
      if (files.length > room) setResult({ ok: false, error: strings.admin.drafts.photo.errors.too_many });
    } catch {
      setResult({ ok: false, error: t.errors.unreadable });
    } finally {
      setPreparing(false);
      if (input.current) input.current.value = "";
    }
  }

  function remove(id: string) {
    setPhotos((current) => {
      const photo = current.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.preview);
      return current.filter((p) => p.id !== id);
    });
  }

  function submit() {
    const form = new FormData();
    photos.forEach((p, i) => form.append("photos", p.blob, `fraga-${i + 1}.jpg`));
    form.append("note", note);
    setResult(null);
    startTransition(async () => {
      const r = await draftFromPhoto(momentId, form);
      setResult(r);
      if (r.ok) {
        photos.forEach((p) => URL.revokeObjectURL(p.preview));
        setPhotos([]);
        setNote("");
      }
    });
  }

  const busy = pending || preparing;
  const blocked = unavailable !== null;

  return (
    <div className="flex flex-col gap-3 border border-dashed border-border p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Camera className="size-4 text-primary" /> {t.title}
      </p>
      <p className="text-sm text-muted-foreground">{t.help}</p>

      {/* capture="environment" opens the back camera on phones; on a computer it is a normal file picker. */}
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => add(e.target.files)}
      />

      {photos.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <li key={p.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={p.preview} alt={`${i + 1}`} className="h-28 w-auto border border-border object-cover" />
              <button
                type="button"
                onClick={() => remove(p.id)}
                disabled={busy}
                aria-label={t.remove}
                className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border border-border bg-background hover:border-foreground"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => input.current?.click()} disabled={busy || blocked || photos.length >= MAX_PHOTOS}>
          {preparing ? <LoaderCircle className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {photos.length ? t.more : t.take}
        </Button>
        {photos.length > 0 && (
          <span className="font-mono text-[11px] text-muted-foreground">{t.count(photos.length, MAX_PHOTOS)}</span>
        )}
      </div>

      {photos.length > 0 && (
        <>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder={t.notePlaceholder}
            className={textareaClass}
            disabled={busy}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={submit} disabled={busy || blocked}>
              {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {t.button}
            </Button>
            {!pending && <span className="font-mono text-[11px] text-muted-foreground">{unavailable ?? t.cost}</span>}
          </div>
        </>
      )}

      {photos.length === 0 && blocked && <span className="font-mono text-[11px] text-muted-foreground">{unavailable}</span>}
      {preparing && <p className="font-mono text-xs text-muted-foreground">{t.preparing}</p>}
      {pending && <p className="font-mono text-xs text-muted-foreground">{t.working}</p>}
      {result &&
        (result.ok ? <Message kind="success">{result.summary}</Message> : <Message kind="error">{result.error}</Message>)}
    </div>
  );
}

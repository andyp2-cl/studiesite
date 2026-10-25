// Updates a seeded intro in the database to the current seed text – but only
// if it still matches the old seed text exactly or has not been edited by the
// admin (detected by a marker phrase), so admin edits are never overwritten.
// Usage: npm run refresh-seed-text -- <moment-slug> "<phrase only the old text has>"

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";
import { mathSubject } from "../lib/seed/math";

const [slug, oldMarker, newMarker] = process.argv.slice(2);
if (!slug || !oldMarker) {
  console.error('Användning: npm run refresh-seed-text -- <moment-slug> "<fras som bara den gamla texten har>"');
  process.exit(1);
}

const moment = mathSubject.areas.flatMap((a) => a.moments).find((m) => m.slug === slug);
if (!moment) throw new Error(`Inget moment med slug ${slug} i seed-datan.`);

const db = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: rows } = await db
    .from("content_blocks")
    .select("id, body_md, moments!inner(slug)")
    .eq("type", "intro")
    .eq("moments.slug", slug);
  const row = rows?.[0];
  if (!row) return console.log("Ingen introduktion hittades.");
  if (newMarker && row.body_md.includes(newMarker)) return console.log("Redan uppdaterad.");
  if (!row.body_md.includes(oldMarker)) return console.log("Texten har ändrats i admin – lämnas orörd.");
  const { error } = await db.from("content_blocks").update({ body_md: moment!.intro }).eq("id", row.id);
  console.log(error ? `Fel: ${error.message}` : `✓ Introduktionen för ${slug} uppdaterad.`);
}

main();

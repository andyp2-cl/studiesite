// Seeds the mathematics package, achievements, settings and test accounts.
// Run with: npm run seed
//
// Idempotent and non-destructive: rows that already exist are left as they
// are, so edits made in the admin panel are never overwritten.

import { createClient } from "@supabase/supabase-js";
import { generatePassword } from "../lib/auth/password";
import { usernameToEmail } from "../lib/auth/username";
import type { Database } from "../lib/database.types";
import { seedAchievements } from "../lib/seed/achievements";
import { mathSubject } from "../lib/seed/math";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
}

const db = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function must<R extends { data: unknown; error: { message: string } | null }>(
  result: R,
  what: string,
): NonNullable<R["data"]> {
  if (result.error || result.data === null || result.data === undefined) {
    throw new Error(`${what}: ${result.error?.message ?? "no data"}`);
  }
  return result.data as NonNullable<R["data"]>;
}

async function seedContent() {
  const s = mathSubject;
  must(
    await db
      .from("subjects")
      .upsert(
        {
          slug: s.slug,
          name: s.name,
          description: s.description,
          color: s.color,
          icon: s.icon,
          sort_order: 0,
        },
        { onConflict: "slug", ignoreDuplicates: true },
      )
      .select("id"),
    "upsert subject",
  );
  const subject = must(await db.from("subjects").select("id").eq("slug", s.slug).single(), "subject");

  let momentCount = 0;
  let blockCount = 0;

  for (const [areaIndex, a] of s.areas.entries()) {
    must(
      await db
        .from("areas")
        .upsert(
          {
            subject_id: subject.id,
            slug: a.slug,
            name: a.name,
            description: a.description,
            color: a.color,
            icon: a.icon,
            sort_order: areaIndex,
          },
          { onConflict: "subject_id,slug", ignoreDuplicates: true },
        )
        .select("id"),
      `upsert area ${a.slug}`,
    );
    const area = must(
      await db.from("areas").select("id").eq("subject_id", subject.id).eq("slug", a.slug).single(),
      `area ${a.slug}`,
    );

    for (const [momentIndex, m] of a.moments.entries()) {
      must(
        await db
          .from("moments")
          .upsert(
            {
              area_id: area.id,
              slug: m.slug,
              name: m.name,
              description: m.description,
              source: "generator",
              sort_order: momentIndex,
            },
            { onConflict: "area_id,slug", ignoreDuplicates: true },
          )
          .select("id"),
        `upsert moment ${m.slug}`,
      );
      const { id: momentId } = must(
        await db.from("moments").select("id").eq("area_id", area.id).eq("slug", m.slug).single(),
        `moment ${m.slug}`,
      );
      momentCount++;

      must(
        await db
          .from("generators")
          .upsert(
            { moment_id: momentId, generator_key: m.generatorKey },
            { onConflict: "moment_id", ignoreDuplicates: true },
          )
          .select("id"),
        `generator ${m.slug}`,
      );

      // Only add texts to moments that have none, to keep admin edits.
      const { count } = await db
        .from("content_blocks")
        .select("id", { count: "exact", head: true })
        .eq("moment_id", momentId);
      if (count === 0) {
        const blocks: Database["public"]["Tables"]["content_blocks"]["Insert"][] = [
          { moment_id: momentId, type: "intro", body_md: m.intro, sort_order: 0 },
          ...m.deepenings.map((d, i) => ({
            moment_id: momentId,
            type: "deepening" as const,
            title: d.title,
            body_md: d.body,
            unlock_level: d.unlockLevel,
            sort_order: i + 1,
          })),
        ];
        must(await db.from("content_blocks").insert(blocks).select("id"), `content ${m.slug}`);
        blockCount += blocks.length;
      }
    }
  }

  console.log(`✓ Matematik: ${s.areas.length} områden, ${momentCount} moment, ${blockCount} nya texter`);
}

async function seedAchievementRows() {
  const rows = seedAchievements.map((a, i) => ({ ...a, sort_order: i }));
  must(
    await db.from("achievements").upsert(rows, { onConflict: "key", ignoreDuplicates: true }).select("id"),
    "achievements",
  );
  console.log(`✓ Märken: ${rows.length}`);
}

type SeedUser = { username: string; displayName: string; role: "admin" | "student" };

// Only the admin account. Student accounts are real people: create them with
// `npm run create-user` (later from the admin panel), so no test students end
// up on the leaderboard.
const seedUsers: SeedUser[] = [{ username: "admin", displayName: "Admin", role: "admin" }];

async function seedAccounts() {
  const existing = must(
    await db
      .from("profiles")
      .select("username")
      .in(
        "username",
        seedUsers.map((u) => u.username),
      ),
    "profiles",
  );
  const existingNames = new Set(existing.map((p) => p.username));
  const created: { username: string; password: string }[] = [];

  for (const u of seedUsers) {
    if (existingNames.has(u.username)) continue;
    const password = generatePassword();
    const { error } = await db.auth.admin.createUser({
      email: usernameToEmail(u.username),
      password,
      email_confirm: true,
      user_metadata: { username: u.username, display_name: u.displayName },
      app_metadata: { role: u.role },
    });
    if (error) throw new Error(`user ${u.username}: ${error.message}`);
    created.push({ username: u.username, password });
  }

  if (created.length === 0) {
    console.log("✓ Konton: fanns redan, inga lösenord ändrade");
    return;
  }
  console.log("✓ Nya konton – spara lösenorden nu, de visas bara en gång:");
  for (const c of created) console.log(`    ${c.username.padEnd(12)} ${c.password}`);
}

async function main() {
  await seedContent();
  await seedAchievementRows();
  // --skip-accounts lets content be (re)seeded without touching auth users.
  if (!process.argv.includes("--skip-accounts")) await seedAccounts();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

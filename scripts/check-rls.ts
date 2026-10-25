// Smoke test for Row Level Security against the real Supabase project.
// Creates two throwaway students, checks what they can and cannot do, then
// deletes them. Run with: npm run check:rls

import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { usernameToEmail } from "../lib/auth/username";
import type { Database } from "../lib/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !anonKey || !serviceRoleKey) throw new Error("Missing Supabase env vars in .env.local.");

const noSession = { auth: { autoRefreshToken: false, persistSession: false } };
const admin = createClient<Database>(url, serviceRoleKey, noSession);

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "✓" : "✗"} ${name}${!ok && detail ? ` – ${detail}` : ""}`);
}

async function createStudent(): Promise<{ id: string; client: SupabaseClient<Database> }> {
  const username = `rlstest-${randomUUID().slice(0, 8)}`;
  const password = randomUUID();
  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username, display_name: username },
  });
  if (error || !data.user) throw new Error(`createUser: ${error?.message}`);
  const client = createClient<Database>(url, anonKey, noSession);
  const signIn = await client.auth.signInWithPassword({ email: usernameToEmail(username), password });
  if (signIn.error) throw new Error(`signIn: ${signIn.error.message}`);
  return { id: data.user.id, client };
}

async function main() {
  const anon = createClient<Database>(url, anonKey, noSession);
  const a = await createStudent();
  const b = await createStudent();

  try {
    const anonSubjects = await anon.from("subjects").select("id");
    check("anonymous users see no content", (anonSubjects.data ?? []).length === 0);

    // Separate client: a successful sign-up would log it in.
    const signupClient = createClient<Database>(url, anonKey, noSession);
    const signup = await signupClient.auth.signUp({
      email: usernameToEmail(`intruder-${randomUUID().slice(0, 6)}`),
      password: randomUUID(),
    });
    check(
      "self sign-up is disabled",
      !!signup.error,
      "turn off 'Allow new users to sign up' in Supabase Auth",
    );
    if (signup.data.user) await admin.auth.admin.deleteUser(signup.data.user.id);

    const own = await a.client.from("profiles").select("role, xp").eq("id", a.id).single();
    check("student reads own profile as student", own.data?.role === "student", own.error?.message);

    const other = await a.client.from("profiles").select("id").eq("id", b.id);
    check("student cannot read another student's profile", (other.data ?? []).length === 0);

    const xpHack = await a.client
      .from("profiles")
      .update({ xp: 99999 } as never)
      .eq("id", a.id);
    check("student cannot change own XP", !!xpHack.error);

    const roleHack = await a.client
      .from("profiles")
      .update({ role: "admin" } as never)
      .eq("id", a.id);
    check("student cannot make themselves admin", !!roleHack.error);

    const avatar = await a.client.from("profiles").update({ avatar: "fox" }).eq("id", a.id).select("avatar");
    check("student can change own avatar", avatar.data?.[0]?.avatar === "fox", avatar.error?.message);

    const subjects = await a.client.from("subjects").select("id");
    check("student sees subjects", (subjects.data ?? []).length > 0, subjects.error?.message);

    const blocks = await a.client.from("content_blocks").select("type");
    const types = new Set((blocks.data ?? []).map((r) => r.type));
    check("student sees intros", types.has("intro"), blocks.error?.message);
    check("locked deepenings are hidden", !types.has("deepening"));

    const { data: moment } = await admin
      .from("content_blocks")
      .select("moment_id")
      .eq("type", "deepening")
      .eq("unlock_level", 1)
      .limit(1)
      .single();
    if (moment) {
      await admin.from("moment_progress").insert({ user_id: a.id, moment_id: moment.moment_id, stars: 1 });
      const unlocked = await a.client
        .from("content_blocks")
        .select("id")
        .eq("moment_id", moment.moment_id)
        .eq("type", "deepening");
      check("deepening unlocks after clearing its level", (unlocked.data ?? []).length > 0);
    }

    const tasks = await a.client.from("tasks").select("id");
    check("student cannot read tasks (answer keys)", (tasks.data ?? []).length === 0 && !tasks.error);

    const attempt = await a.client
      .from("attempts")
      .insert({
        user_id: a.id,
        moment_id: moment?.moment_id ?? "",
        level: 1,
        generator_seed: 1,
        answer: "1",
        correct: true,
      });
    check("student cannot insert attempts directly", !!attempt.error);

    const xp = await a.client.from("xp_events").insert({ user_id: a.id, amount: 1000, reason: "hack" });
    check("student cannot award themselves XP", !!xp.error);

    const aiCalls = await a.client.from("ai_calls").select("id");
    check("student cannot read AI cost log", (aiCalls.data ?? []).length === 0);

    const board = await a.client.rpc("get_leaderboard", { p_period: "week" });
    const ids = new Set((board.data ?? []).map((r) => r.user_id));
    check("leaderboard lists both students", ids.has(a.id) && ids.has(b.id), board.error?.message);

    const anonBoard = await anon.rpc("get_leaderboard", { p_period: "week" });
    check(
      "leaderboard is closed to anonymous users",
      !!anonBoard.error || (anonBoard.data ?? []).length === 0,
    );
  } finally {
    await admin.auth.admin.deleteUser(a.id);
    await admin.auth.admin.deleteUser(b.id);
  }

  console.log(failures === 0 ? "\nAlla kontroller OK." : `\n${failures} kontroll(er) misslyckades.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

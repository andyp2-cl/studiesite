// Creates one account and prints its password once.
// Usage: npm run create-user -- <username> "<Display name>" [--admin]
// Until the admin panel exists (step 7), this is how student accounts are made.

import { createClient } from "@supabase/supabase-js";
import { normalizeUsername, usernameToEmail } from "../lib/auth/username";
import { generatePassword } from "../lib/auth/password";
import type { Database } from "../lib/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
}

const args = process.argv.slice(2);
const isAdmin = args.includes("--admin");
const [rawUsername, displayName] = args.filter((a) => !a.startsWith("--"));

const username = rawUsername ? normalizeUsername(rawUsername) : null;
if (!username || !displayName) {
  console.error('Användning: npm run create-user -- <användarnamn> "<Visningsnamn>" [--admin]');
  console.error("Användarnamn: 2–32 tecken, bara a–z, 0–9 och . _ - (inga å, ä, ö).");
  process.exit(1);
}

const db = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main(username: string, displayName: string) {
  const password = generatePassword();
  const { error } = await db.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username, display_name: displayName },
    app_metadata: { role: isAdmin ? "admin" : "student" },
  });

  if (error) {
    console.error(`Kunde inte skapa ${username}: ${error.message}`);
    process.exit(1);
  }

  console.log(`✓ Skapade ${isAdmin ? "admin" : "elev"} "${displayName}"`);
  console.log(`    användarnamn: ${username}`);
  console.log(`    lösenord:     ${password}`);
  console.log("  Spara lösenordet nu – det visas bara en gång.");
}

main(username, displayName).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

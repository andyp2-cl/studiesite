import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { LOGIN_PATH } from "@/lib/auth/redirect";
import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * The signed-in user's profile, or null. Verifies the JWT (getClaims) rather
 * than trusting the cookie. Cached per request.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return profile;
});

/** For pages and actions that need a signed-in user (student or admin). */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(LOGIN_PATH);
  return profile;
}

/** For everything under /admin. Students are sent home, never shown admin UI. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/");
  return profile;
}

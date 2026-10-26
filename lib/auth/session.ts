import "server-only";
import { cookies } from "next/headers";
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

/** Cookie with the student an admin has chosen in "Visa som". */
export const VIEW_AS_COOKIE = "view_as";

/**
 * The profile the student pages are shown for: the signed-in user, or for an
 * admin the student picked in "Visa som". Only admins can view as someone
 * else, and only as a student; anything else falls back to the user's own
 * profile. Answers are still saved as the signed-in user.
 */
export const getViewProfile = cache(async (): Promise<Profile | null> => {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") return profile;
  const studentId = (await cookies()).get(VIEW_AS_COOKIE)?.value;
  if (!studentId) return profile;
  const supabase = await createClient();
  const { data: student } = await supabase.from("profiles").select("*").eq("id", studentId).eq("role", "student").maybeSingle();
  return student ?? profile;
});

/** Like requireProfile, but for pages that show "Visa som". */
export async function requireViewProfile(): Promise<Profile> {
  const profile = await getViewProfile();
  if (!profile) redirect(LOGIN_PATH);
  return profile;
}

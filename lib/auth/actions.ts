"use server";

import { redirect } from "next/navigation";
import { LOGIN_PATH, safeNextPath } from "@/lib/auth/redirect";
import { normalizeUsername, usernameToEmail } from "@/lib/auth/username";
import { strings } from "@/lib/strings";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null; username: string };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const rawUsername = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const username = normalizeUsername(rawUsername);

  if (!username || !password) {
    return { error: strings.login.errors.missing, username: rawUsername };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) {
    const message = error.status === 429 ? strings.login.errors.tooMany : strings.login.errors.invalid;
    return { error: message, username: rawUsername };
  }

  redirect(safeNextPath(String(formData.get("next") ?? "")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}

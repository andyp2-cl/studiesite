"use server";

import { cookies } from "next/headers";
import { requireAdmin, VIEW_AS_COOKIE } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** Lets an admin see the student pages as a student does (null = as themself). */
export async function setViewAs(studentId: string | null): Promise<void> {
  await requireAdmin();
  const jar = await cookies();
  if (!studentId) {
    jar.delete(VIEW_AS_COOKIE);
    return;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id").eq("id", studentId).eq("role", "student").maybeSingle();
  if (!data) return;
  jar.set(VIEW_AS_COOKIE, data.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
}

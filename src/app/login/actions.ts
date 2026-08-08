"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=missing-fields");
  }

  // redirect() works by throwing internally, so it never happens inside
  // this try block -- only the target path is decided there. Calling
  // redirect() inside a try/catch here would risk the catch clause
  // swallowing its own redirect signal.
  let target = "/";
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      target = "/login?error=invalid-credentials";
    }
  } catch {
    // A thrown error here is a genuine network/connection failure, a
    // different case from the normal { error } response above -- same
    // distinction every other Server Action in this app makes.
    target = "/login?error=connection-issue";
  }

  redirect(target);
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function asFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(formData: FormData) {
  const email = asFormString(formData, "email");
  const password = asFormString(formData, "password");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signUp(formData: FormData) {
  const email = asFormString(formData, "email");
  const password = asFormString(formData, "password");
  const username = asFormString(formData, "username").toLowerCase();
  const supabase = await createClient();

  if (!/^[a-z0-9_]{2,30}$/.test(username)) {
    redirect("/signup?error=Use%20a%20lowercase%20username%20with%20letters%2C%20numbers%2C%20or%20underscores.");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

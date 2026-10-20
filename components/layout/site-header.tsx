import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { SiteNav } from "@/components/layout/site-nav";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";

async function getAccount() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile?.username) {
    return null;
  }

  return {
    username: profile.username,
    avatarUrl: profile.avatar_url,
  };
}

export async function SiteHeader() {
  const account = await getAccount();
  const initials = account
    ? account.username.slice(0, 2).toUpperCase()
    : "";

  return (
    <header className="border-b border-[#242426] bg-[#0f0f10]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
        <Link href="/" className="shrink-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8c887b]">
            EST. 2026 // ARCHIVE
          </p>
          <span className="mt-0.5 block font-serif text-2xl tracking-tight text-[#f3efe6]">
            matchd
          </span>
        </Link>

        <SiteNav />

        <div className="flex items-center gap-4">
          {account ? (
            <>
              <Link
                href={`/users/${account.username}`}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#8c887b] transition-colors hover:text-[#f3efe6]"
              >
                {account.avatarUrl ? (
                  <img
                    src={account.avatarUrl}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#242426] font-mono text-[10px] text-[#f3efe6]">
                    {initials}
                  </span>
                )}
                {account.username}
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-xs font-mono uppercase tracking-widest text-[#8c887b] transition-colors hover:text-[#f3efe6]"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-mono uppercase tracking-widest text-[#8c887b] transition-colors hover:text-[#f3efe6]"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-xs font-mono uppercase tracking-widest text-[#d4973b] transition-colors hover:text-[#f3efe6]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

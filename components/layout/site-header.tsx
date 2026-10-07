import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { Container } from "@/components/layout/container";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";

async function getUsername() {
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
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return null;
  }

  return profile?.username ?? null;
}

export async function SiteHeader() {
  const username = await getUsername();

  return (
    <header className="border-b border-border bg-[#D8DCE2]/80 backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between">
        <Link href="/" className="font-serif text-xl tracking-tight">
          matchd
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link href="/matches" className="hover:text-foreground">
            Matches
          </Link>
          <Link href="/fights" className="hover:text-foreground">
            Fights
          </Link>
          <Link
            href="/search"
            aria-label="Search"
            className="inline-flex items-center hover:text-foreground"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <circle
                cx="7"
                cy="7"
                r="4.25"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M10.5 10.5L13.5 13.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Link>
          {username ? (
            <>
              <Link
                href={`/users/${username}`}
                className="hover:text-foreground"
              >
                {username}
              </Link>
              <form action={signOut}>
                <button type="submit" className="hover:text-foreground">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-foreground">
                Log in
              </Link>
              <Link href="/signup" className="text-foreground hover:text-accent">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </Container>
    </header>
  );
}

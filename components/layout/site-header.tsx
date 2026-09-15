import Link from "next/link";
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
    <header className="border-b border-border">
      <Container className="flex h-14 items-center justify-between">
        <Link href="/" className="font-serif text-xl tracking-tight">
          matchd
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link href="/matches" className="hover:text-foreground">
            Matches
          </Link>
          {username ? (
            <Link
              href={`/users/${username}`}
              className="hover:text-foreground"
            >
              {username}
            </Link>
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

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasSupabaseConfig()) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          const changed = cookiesToSet.some(
            ({ name, value }) => request.cookies.get(name)?.value !== value,
          );
          if (!changed) {
            return;
          }

          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Touch the session so expired tokens refresh. Do not replace this
  // with getSession() — that reads the cookie without validating it.
  // Only write cookies when the token actually changed, so a refresh
  // does not send Set-Cookie on every request and retrigger the page.
  await supabase.auth.getUser();

  return response;
}

import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { signIn } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight">Log in</h1>
      <p className="mt-2 text-sm text-muted">
        Rate the matches you watched.
      </p>
      <div className="mt-8">
        <AuthForm action={signIn} submitLabel="Log in" error={error} />
      </div>
      <p className="mt-6 text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="text-foreground hover:text-accent">
          Create an account
        </Link>
      </p>
    </div>
  );
}

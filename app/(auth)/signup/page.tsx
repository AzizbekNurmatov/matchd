import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "@/app/(auth)/actions";

export const metadata: Metadata = {
  title: "Sign up",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div>
      <h1 className="font-serif text-3xl tracking-tight">Sign up</h1>
      <p className="mt-2 text-sm text-muted">
        Keep a record of the matches that mattered.
      </p>
      <div className="mt-8">
        <AuthForm
          action={signUp}
          submitLabel="Create account"
          includeUsername
          error={error}
        />
      </div>
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground hover:text-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}

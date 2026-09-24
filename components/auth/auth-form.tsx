"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type AuthFormProps = {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  includeUsername?: boolean;
  error?: string;
};

export function AuthForm({
  action,
  submitLabel,
  includeUsername = false,
  error,
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      {includeUsername ? (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted">Username</span>
          <input
            name="username"
            type="text"
            autoComplete="username"
            required
            minLength={2}
            maxLength={30}
            pattern="[a-z0-9_]+"
            title="Lowercase letters, numbers, and underscores"
            className={fieldClassName}
          />
        </label>
      ) : null}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldClassName}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Password</span>
        <span className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={includeUsername ? "new-password" : "current-password"}
            required
            minLength={6}
            className={cn(fieldClassName, "w-full pr-16")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-3 flex items-center text-xs text-muted hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </span>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        className="mt-1 h-10 rounded-md bg-[#0F172A] text-sm font-medium text-[#F8FAFC] hover:bg-[#1E293B]"
      >
        {submitLabel}
      </button>
    </form>
  );
}

const fieldClassName = cn(
  "h-10 rounded-md border border-border bg-background px-3 text-foreground",
  "outline-none focus:border-accent",
);

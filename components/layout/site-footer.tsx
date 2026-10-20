import type { ReactNode } from "react";
import Link from "next/link";

const ARCHIVE = [
  { href: "/matches", label: "Browse Matches" },
  { href: "/f1", label: "F1 Archives" },
  { href: "/fights", label: "Fight Cards" },
  { href: "/leaderboard", label: "Community Leaderboard" },
] as const;

const PLATFORM = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/status", label: "System Status" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#242426] bg-[#0d0d0e]">
      <div className="mx-auto w-full max-w-7xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="font-serif text-2xl tracking-tight text-[#f3efe6]">
              matchd
            </p>
            <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#8c887b]">
              The matches you watched, remembered together.
            </p>
          </div>

          <nav aria-label="Archive">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8c887b]">
              Archive
            </p>
            <ul className="mt-4 space-y-2">
              {ARCHIVE.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Platform">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8c887b]">
              Platform
            </p>
            <ul className="mt-4 space-y-2">
              {PLATFORM.map((item) => (
                <li key={item.href}>
                  {item.href === "/status" ? (
                    <FooterLink href={item.href}>
                      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {item.label}
                    </FooterLink>
                  ) : (
                    <FooterLink href={item.href}>{item.label}</FooterLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-[#1c1c1e] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-mono text-[#8c887b]">
            © 2026 Matchd. All rights reserved.
          </p>
          <p className="text-[11px] font-mono text-[#8c887b]">
            Built for football & combat sports purists
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-xs font-mono uppercase tracking-widest text-[#8c887b] transition-colors hover:text-[#f3efe6]"
    >
      {children}
    </Link>
  );
}

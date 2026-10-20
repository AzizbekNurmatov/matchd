"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/matches", label: "Matches" },
  { href: "/fights", label: "Fights" },
  { href: "/f1", label: "F1" },
  { href: "/search", label: "Search" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Primary">
      {LINKS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-xs font-mono uppercase tracking-widest transition-colors",
              active
                ? "text-[#d4973b]"
                : "text-[#8492a6] hover:text-[#f1f5f9]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

import type { ReactNode } from "react";

export function EmptyState({
  title,
  icon = "calendar",
  action,
}: {
  title: string;
  icon?: "calendar" | "search";
  action?: ReactNode;
}) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-lg border border-slate-800 bg-slate-900 px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-slate-500">
        {icon === "search" ? <SearchMark /> : <CalendarMark />}
      </span>
      <p className="mt-4 max-w-sm text-sm text-slate-400">{title}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function CalendarMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-5 w-5">
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M8 3.5v3M16 3.5v3M4 9.5h16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function SearchMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-5 w-5">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 16.5L20 20.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

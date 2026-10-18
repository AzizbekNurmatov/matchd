import { cn } from "@/lib/utils";

type SkeletonAccent = "slate" | "emerald" | "amber" | "red";

const ACCENT = {
  slate: "border-l-slate-600",
  emerald: "border-l-emerald-500",
  amber: "border-l-amber-500",
  red: "border-l-red-600",
} as const;

export function MatchCardSkeleton({
  accent = "slate",
}: {
  accent?: SkeletonAccent;
}) {
  return (
    <div
      className={cn(
        "animate-pulse overflow-hidden rounded-lg border border-slate-800 border-l-4 bg-slate-900 p-4",
        ACCENT[accent],
      )}
      aria-hidden
    >
      <div className="flex items-center justify-between gap-3">
        <div className="h-5 w-24 rounded-full bg-slate-800" />
        <div className="h-3 w-20 rounded bg-slate-800" />
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-4 w-4/5 rounded bg-slate-800" />
        <div className="h-4 w-3/5 rounded bg-slate-800" />
      </div>
      <div className="mt-5 h-px bg-slate-800" />
      <div className="mt-3 flex items-center justify-between">
        <div className="h-3 w-16 rounded-full bg-slate-800" />
        <div className="h-3 w-24 rounded bg-slate-800" />
      </div>
    </div>
  );
}

export function MatchCardSkeletonList({
  count = 3,
  accent = "slate",
  columns = false,
}: {
  count?: number;
  accent?: SkeletonAccent;
  columns?: boolean;
}) {
  return (
    <div
      className={cn("mt-8", columns ? "grid gap-3 sm:grid-cols-2" : "flex flex-col gap-6")}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: count }, (_, index) => (
        <MatchCardSkeleton key={index} accent={accent} />
      ))}
    </div>
  );
}

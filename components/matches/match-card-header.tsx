import { formatMatchCardDate } from "@/lib/dates";

const DEFAULT_BADGE = "border-[#94A3B8] bg-[#CBD5E1]";

const LEAGUE_BADGES: { test: RegExp; className: string }[] = [
  { test: /\b(pl|premier league)\b/i, className: "border-[#7C3AED] bg-[#C4B5FD]" },
  { test: /\b(sa|serie a)\b/i, className: "border-[#B91C1C] bg-[#FCA5A5]" },
  {
    test: /\b(pd|la liga|primera)\b/i,
    className: "border-[#15803D] bg-[#86EFAC]",
  },
  { test: /\b(bl1|bundesliga)\b/i, className: "border-[#B45309] bg-[#FCD34D]" },
  { test: /\b(fl1|ligue 1)\b/i, className: "border-[#1D4ED8] bg-[#93C5FD]" },
  {
    test: /\b(cl|champions league)\b/i,
    className: "border-[#4338CA] bg-[#A5B4FC]",
  },
];

function leagueBadgeClass(name: string, code: string | null) {
  const label = `${code ?? ""} ${name}`;
  return (
    LEAGUE_BADGES.find((league) => league.test.test(label))?.className ??
    DEFAULT_BADGE
  );
}

export function MatchCardHeader({
  league,
  leagueCode,
  kickoffAt,
}: {
  league: string | null;
  leagueCode?: string | null;
  kickoffAt: string;
}) {
  const name = league ?? "Match";

  return (
    <div className="mb-2 flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
      <span
        className={`inline-flex max-w-[58%] truncate rounded-sm border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#0F172A] ${leagueBadgeClass(name, leagueCode ?? null)}`}
      >
        {name}
      </span>
      <time
        dateTime={kickoffAt}
        className="shrink-0 text-xs font-semibold tabular-nums text-[#334155]"
      >
        {formatMatchCardDate(kickoffAt)}
      </time>
    </div>
  );
}

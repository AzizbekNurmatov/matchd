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
  {
    test: /\b(wc|fifa world cup|world cup)\b/i,
    className: "border-[#047857] bg-[#6EE7B7]",
  },
  {
    test: /\b(ec|european championship|euro)\b/i,
    className: "border-[#1D4ED8] bg-[#93C5FD]",
  },
  {
    test: /\b(nations league)\b/i,
    className: "border-[#0F766E] bg-[#5EEAD4]",
  },
];

function leagueBadgeClass(name: string, code: string | null) {
  const label = `${code ?? ""} ${name}`;
  if (/\b(mls|major league soccer)\b/i.test(label)) {
    return "";
  }
  return (
    LEAGUE_BADGES.find((league) => league.test.test(label))?.className ??
    DEFAULT_BADGE
  );
}

function leagueBadgeLabel(name: string, code: string | null) {
  const label = `${code ?? ""} ${name}`;
  if (/\b(mls|major league soccer)\b/i.test(label)) {
    return "MLS";
  }
  return name;
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
  const code = leagueCode ?? null;
  const isMls = leagueBadgeLabel(name, code) === "MLS";

  return (
    <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
      <span
        className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-sm border uppercase tracking-wider ${
          isMls
            ? "border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800"
            : `px-2.5 py-1 text-[11px] font-semibold text-[#0F172A] ${leagueBadgeClass(name, code)}`
        }`}
      >
        {leagueBadgeLabel(name, code)}
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

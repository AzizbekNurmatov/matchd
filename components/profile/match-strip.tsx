import Link from "next/link";
import type { ProfileMatchSummary, ProfileTeam } from "@/components/profile/types";
import { cn } from "@/lib/utils";

type MatchStripProps = {
  match: ProfileMatchSummary;
  href?: string;
};

export function MatchStrip({ match, href }: MatchStripProps) {
  const content = (
    <div className="flex items-center gap-2">
      <TeamSide team={match.homeTeam} align="left" />
      <p className="shrink-0 px-1 font-mono text-sm font-medium text-[#0F172A]">
        {match.homeScore ?? "–"}
        <span className="mx-1 text-[#475569]">–</span>
        {match.awayScore ?? "–"}
      </p>
      <TeamSide team={match.awayTeam} align="right" />
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block hover:opacity-90">
      {content}
    </Link>
  );
}

function TeamSide({
  team,
  align,
}: {
  team: ProfileTeam | null;
  align: "left" | "right";
}) {
  const label = team?.short_name || team?.name || "TBD";
  const crest = team?.crest_url ? (
    <img src={team.crest_url} alt="" className="h-7 w-7 object-contain" />
  ) : (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E4E7EB] text-[10px] uppercase text-[#475569]">
      {label.slice(0, 1)}
    </span>
  );

  return (
    <span
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2",
        align === "right" && "flex-row-reverse text-right",
      )}
    >
      {crest}
      <span className="truncate text-sm font-medium text-[#0F172A]">{label}</span>
    </span>
  );
}

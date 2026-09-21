"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { CountryFlag } from "@/components/country-flag";
import {
  searchTeams,
  updateUserProfile,
  type TeamSearchLeague,
  type TeamSearchResult,
} from "@/lib/actions/profile";
import { FOOTBALL_COUNTRIES } from "@/lib/utils/countries";
import { cn } from "@/lib/utils";

const LEAGUE_FILTERS: { id: TeamSearchLeague; label: string }[] = [
  { id: "all", label: "All" },
  { id: "PL", label: "Premier League" },
  { id: "PD", label: "La Liga" },
  { id: "CL", label: "Champions League" },
  { id: "BL1", label: "Bundesliga" },
  { id: "SA", label: "Serie A" },
  { id: "FL1", label: "Ligue 1" },
];

type EditProfileModalProps = {
  countryCode: string | null;
  favoriteTeam: TeamSearchResult | null;
};

export function EditProfileModal({
  countryCode,
  favoriteTeam,
}: EditProfileModalProps) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState(countryCode ?? "");
  const [selectedTeam, setSelectedTeam] = useState<TeamSearchResult | null>(
    favoriteTeam,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }

    setCountry(countryCode ?? "");
    setSelectedTeam(favoriteTeam);
    setError(null);
  }, [open, countryCode, favoriteTeam]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function close() {
    if (isPending) {
      return;
    }
    setOpen(false);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateUserProfile({
        countryCode: country || null,
        favoriteTeamId: selectedTeam?.id ?? null,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 border border-[#2e2d2b] bg-[#1a1918] px-3 py-1 font-mono text-xs uppercase tracking-wider text-[#f3efe6] transition-colors hover:border-[#d4973b]"
      >
        Edit Profile
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-16 sm:items-center">
          <button
            type="button"
            aria-label="Close edit profile"
            className="absolute inset-0 cursor-default"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 w-full max-w-lg border border-[#242426] bg-[#151516] p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#8c887b]">
                  Supporter Flair
                </p>
                <h2
                  id={titleId}
                  className="mt-2 font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-[#f3efe6]"
                >
                  EDIT PROFILE
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="font-mono text-xs uppercase tracking-wider text-[#8c887b] hover:text-[#f3efe6]"
              >
                Close
              </button>
            </div>

            <form className="mt-6 flex flex-col gap-5" onSubmit={onSubmit}>
              <CountryCombobox
                value={country}
                onChange={setCountry}
                disabled={isPending}
              />

              <ClubPicker
                selectedTeam={selectedTeam}
                onSelect={setSelectedTeam}
                disabled={isPending}
              />

              {error ? <p className="text-sm text-red-400">{error}</p> : null}

              <div className="mt-1 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={close}
                  disabled={isPending}
                  className="font-mono text-xs uppercase tracking-wider text-[#8c887b] hover:text-[#f3efe6] disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="border border-[#d4973b] bg-[#d4973b] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#151516] transition-colors hover:bg-[#e0a84a] disabled:opacity-70"
                >
                  {isPending ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CountryCombobox({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const selected = FOOTBALL_COUNTRIES.find((country) => country.code === value);

  const options = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) {
      return FOOTBALL_COUNTRIES;
    }
    return FOOTBALL_COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(needle) ||
        country.code.toLowerCase().includes(needle),
    );
  }, [filter]);

  useEffect(() => {
    if (!open) {
      return;
    }

    searchRef.current?.focus();

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function select(code: string) {
    onChange(code);
    setFilter("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <span className="font-mono text-[11px] uppercase tracking-wider text-[#8c887b]">
        Country
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 w-full items-center justify-between gap-3 border border-[#242426] bg-[#0f0f10] px-3 text-left outline-none hover:border-[#3d3b38] focus:border-[#d4973b] disabled:opacity-70"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {selected ? (
            <>
              <CountryFlag code={selected.code} className="h-[15px] w-5" />
              <span className="truncate text-sm text-[#f3efe6]">
                {selected.name}
              </span>
            </>
          ) : (
            <span className="text-sm text-[#8c887b]">No country</span>
          )}
        </span>
        <span className="font-mono text-[10px] text-[#8c887b]">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div className="border border-[#242426] bg-[#1a1918]">
          <input
            ref={searchRef}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search countries..."
            autoComplete="off"
            className="h-10 w-full border-b border-[#242426] bg-[#0f0f10] px-3 text-sm text-[#f3efe6] outline-none placeholder:text-[#8c887b] focus:border-[#d4973b]"
          />
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => select("")}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-[#151516]",
                value === "" ? "text-[#f3efe6]" : "text-[#8c887b]",
              )}
            >
              No country
            </button>
            {options.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => select(country.code)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[#151516]",
                  country.code === value ? "bg-[#151516]" : null,
                )}
              >
                <CountryFlag code={country.code} className="h-[15px] w-5" />
                <span className="truncate text-sm text-[#f3efe6]">
                  {country.name}
                </span>
              </button>
            ))}
            {options.length === 0 ? (
              <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#8c887b]">
                No countries found
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ClubPicker({
  selectedTeam,
  onSelect,
  disabled,
}: {
  selectedTeam: TeamSearchResult | null;
  onSelect: (team: TeamSearchResult | null) => void;
  disabled: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [league, setLeague] = useState<TeamSearchLeague>("all");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TeamSearchResult[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const shouldSearch = league !== "all" || query.trim().length > 0;
      if (!shouldSearch) {
        setResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      void searchTeams(query, league).then((teams) => {
        setResults(teams);
        setSearching(false);
      });
    }, 250);

    return () => window.clearTimeout(handle);
  }, [query, league]);

  useEffect(() => {
    if (!listOpen) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setListOpen(false);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [listOpen]);

  function selectLeague(next: TeamSearchLeague) {
    setLeague(next);
    setListOpen(true);
  }

  const emptyHint =
    league === "all" && query.trim().length === 0
      ? "Type to search or pick a league"
      : "No clubs found";

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <span className="font-mono text-[11px] uppercase tracking-wider text-[#8c887b]">
        Favorite Club
      </span>

      <div className="flex flex-wrap gap-1.5">
        {LEAGUE_FILTERS.map((item) => {
          const active = item.id === league;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => selectLeague(item.id)}
              className={cn(
                "border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors disabled:opacity-70",
                active
                  ? "border-[#d4973b] bg-[#1a1918] text-[#f3efe6]"
                  : "border-[#242426] text-[#8c887b] hover:border-[#3d3b38] hover:text-[#f3efe6]",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {selectedTeam ? (
        <div className="flex items-center justify-between gap-3 border border-[#242426] bg-[#0f0f10] px-3 py-2">
          <span className="flex min-w-0 items-center gap-2.5">
            <ClubCrest team={selectedTeam} size={20} />
            <span className="min-w-0">
              <span className="block truncate text-sm text-[#f3efe6]">
                {selectedTeam.name}
              </span>
              {selectedTeam.leagueName ? (
                <span className="block text-xs text-[#8c887b]">
                  {selectedTeam.leagueName}
                </span>
              ) : null}
            </span>
          </span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            disabled={disabled}
            className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[#8c887b] hover:text-[#f3efe6] disabled:opacity-70"
          >
            Clear
          </button>
        </div>
      ) : null}

      <div className="relative">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setListOpen(true);
          }}
          onFocus={() => setListOpen(true)}
          disabled={disabled}
          placeholder="Search clubs..."
          autoComplete="off"
          className="h-10 w-full border border-[#242426] bg-[#0f0f10] px-3 text-sm text-[#f3efe6] outline-none placeholder:text-[#8c887b] focus:border-[#d4973b] disabled:opacity-70"
        />

        {listOpen ? (
          <div className="absolute inset-x-0 z-20 mt-1 max-h-64 overflow-y-auto border border-[#242426] bg-[#1a1918] py-1">
            {searching && results.length === 0 ? (
              <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#8c887b]">
                Searching...
              </p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#8c887b]">
                {emptyHint}
              </p>
            ) : (
              results.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    onSelect(team);
                    setQuery("");
                    setListOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[#151516]"
                >
                  <ClubCrest team={team} size={24} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-[#f3efe6]">
                      {team.name}
                    </span>
                    {team.leagueName ? (
                      <span className="block truncate text-xs text-[#8c887b]">
                        {team.leagueName}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ClubCrest({
  team,
  size,
}: {
  team: Pick<TeamSearchResult, "name" | "crest_url">;
  size: 20 | 24;
}) {
  const px = size === 24 ? "h-6 w-6" : "h-5 w-5";
  if (team.crest_url) {
    return (
      <img
        src={team.crest_url}
        alt=""
        className={cn("shrink-0 object-contain", px)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-[#151516] font-mono text-[9px] text-[#8c887b]",
        px,
      )}
    >
      {team.name.slice(0, 1)}
    </span>
  );
}

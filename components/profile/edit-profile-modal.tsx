"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  searchTeams,
  updateUserProfile,
  type TeamSearchResult,
} from "@/lib/actions/profile";
import {
  FOOTBALL_COUNTRIES,
  getCountryFlag,
} from "@/lib/utils/countries";

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
  const [query, setQuery] = useState(favoriteTeam?.name ?? "");
  const [results, setResults] = useState<TeamSearchResult[]>([]);
  const [listOpen, setListOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCountry(countryCode ?? "");
    setSelectedTeam(favoriteTeam);
    setQuery(favoriteTeam?.name ?? "");
    setError(null);
    setListOpen(false);
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

  useEffect(() => {
    if (!open) {
      return;
    }

    const handle = window.setTimeout(() => {
      const nextQuery = selectedTeam && query === selectedTeam.name ? "" : query;
      setSearching(true);
      void searchTeams(nextQuery).then((teams) => {
        setResults(teams);
        setSearching(false);
      });
    }, 200);

    return () => window.clearTimeout(handle);
  }, [open, query, selectedTeam]);

  useEffect(() => {
    if (!listOpen) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setListOpen(false);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [listOpen]);

  function selectTeam(team: TeamSearchResult) {
    setSelectedTeam(team);
    setQuery(team.name);
    setListOpen(false);
    setError(null);
  }

  function clearTeam() {
    setSelectedTeam(null);
    setQuery("");
    setListOpen(true);
    setError(null);
  }

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
            className="relative z-10 w-full max-w-md border border-[#242426] bg-[#151516] p-5 shadow-2xl sm:p-6"
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
              <label className="flex flex-col gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8c887b]">
                  Country
                </span>
                <select
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  disabled={isPending}
                  className="h-10 border border-[#242426] bg-[#0f0f10] px-3 font-mono text-xs uppercase tracking-wider text-[#f3efe6] outline-none focus:border-[#d4973b] disabled:opacity-70"
                >
                  <option value="">No country</option>
                  {FOOTBALL_COUNTRIES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {getCountryFlag(item.code)} {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <div ref={searchRef} className="flex flex-col gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8c887b]">
                  Favorite Club
                </span>
                {selectedTeam ? (
                  <div className="flex items-center justify-between gap-3 border border-[#242426] bg-[#0f0f10] px-3 py-2">
                    <span className="flex min-w-0 items-center gap-2.5">
                      {selectedTeam.crest_url ? (
                        <img
                          src={selectedTeam.crest_url}
                          alt=""
                          className="h-5 w-5 shrink-0 object-contain"
                        />
                      ) : (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[#151516] font-mono text-[9px] text-[#8c887b]">
                          {selectedTeam.name.slice(0, 1)}
                        </span>
                      )}
                      <span className="truncate text-sm text-[#f3efe6]">
                        {selectedTeam.name}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={clearTeam}
                      disabled={isPending}
                      className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[#8c887b] hover:text-[#f3efe6] disabled:opacity-70"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setListOpen(true);
                      }}
                      onFocus={() => setListOpen(true)}
                      disabled={isPending}
                      placeholder="Search clubs..."
                      autoComplete="off"
                      className="h-10 w-full border border-[#242426] bg-[#0f0f10] px-3 text-sm text-[#f3efe6] outline-none placeholder:text-[#8c887b] focus:border-[#d4973b] disabled:opacity-70"
                    />
                    {listOpen ? (
                      <div className="absolute inset-x-0 z-20 mt-1 max-h-56 overflow-y-auto border border-[#242426] bg-[#1a1918] py-1">
                        {searching && results.length === 0 ? (
                          <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#8c887b]">
                            Searching...
                          </p>
                        ) : results.length === 0 ? (
                          <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#8c887b]">
                            No clubs found
                          </p>
                        ) : (
                          results.map((team) => (
                            <button
                              key={team.id}
                              type="button"
                              onClick={() => selectTeam(team)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#8c887b] transition-colors hover:bg-[#151516] hover:text-[#f3efe6]"
                            >
                              {team.crest_url ? (
                                <img
                                  src={team.crest_url}
                                  alt=""
                                  className="h-5 w-5 shrink-0 object-contain"
                                />
                              ) : (
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-[#151516] font-mono text-[9px] text-[#8c887b]">
                                  {team.name.slice(0, 1)}
                                </span>
                              )}
                              <span className="truncate">{team.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

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

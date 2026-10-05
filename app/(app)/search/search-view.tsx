"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MatchTicket } from "@/components/matches/match-ticket";
import { UfcEventCard } from "@/components/ufc/ufc-event-card";
import { cn } from "@/lib/utils";
import { searchCatalogAction } from "./actions";

type SearchResults = Awaited<ReturnType<typeof searchCatalogAction>>;

type SearchViewProps = {
  initialQuery: string;
  initialResults: SearchResults | null;
};

export function SearchView({ initialQuery, initialResults }: SearchViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);
  const skippedInitial = useRef(false);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(initialResults);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    const href = trimmed
      ? `/search?q=${encodeURIComponent(trimmed)}`
      : "/search";
    window.history.replaceState(null, "", href);

    if (!trimmed) {
      setResults(null);
      setPending(false);
      setError(null);
      return;
    }

    if (!skippedInitial.current) {
      skippedInitial.current = true;
      if (trimmed === initialQuery.trim()) {
        return;
      }
    }

    const requestId = ++requestRef.current;
    setPending(true);
    setError(null);
    const timer = window.setTimeout(() => {
      void searchCatalogAction(trimmed)
        .then((next) => {
          if (requestId !== requestRef.current) {
            return;
          }
          setResults(next);
          setPending(false);
        })
        .catch(() => {
          if (requestId !== requestRef.current) {
            return;
          }
          setError("Search is unavailable right now.");
          setPending(false);
        });
    }, 200);

    return () => window.clearTimeout(timer);
  }, [initialQuery, query]);

  const trimmed = query.trim();
  const hasResults =
    results != null &&
    (results.fighters.length > 0 ||
      results.events.length > 0 ||
      results.promotions.length > 0);

  return (
    <div className="mt-8">
      <form action="/search" className="relative">
        <label htmlFor="catalog-search" className="sr-only">
          Search for fighters, events, or promotions
        </label>
        <input
          ref={inputRef}
          id="catalog-search"
          name="q"
          type="search"
          value={query}
          autoFocus
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for fighters, events, or promotions..."
          className={cn(
            "h-12 w-full rounded-sm border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:border-slate-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden",
            query ? "py-0 pr-10 pl-4" : "px-4",
          )}
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-xs text-slate-400 transition-colors hover:text-slate-600"
          >
            ✕
          </button>
        ) : null}
      </form>

      {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}

      {!trimmed ? (
        <p className="mt-8 text-sm text-[#475569]">
          Search for fighters, events, or promotions...
        </p>
      ) : pending && !hasResults ? (
        <p className="mt-8 font-mono text-xs uppercase tracking-widest text-[#475569]">
          Searching…
        </p>
      ) : results && !hasResults && !pending ? (
        <p className="mt-8 text-sm text-[#475569]">
          No results for &quot;{trimmed}&quot;
        </p>
      ) : results ? (
        <div className={cn("mt-10 flex flex-col gap-12", pending && "opacity-70")}>
          {results.fighters.length > 0 ? (
            <section>
              <SectionLabel>Fighters</SectionLabel>
              <div className="mt-4 flex flex-col gap-8">
                {results.fighters.map((fighter) => (
                  <div key={fighter.name}>
                    <div className="mb-3 flex items-center gap-3">
                      {fighter.imageUrl ? (
                        <img
                          src={fighter.imageUrl}
                          alt=""
                          className="h-8 w-8 shrink-0 object-contain"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#E4E7EB] font-mono text-xs text-[#475569]">
                          {fighter.name.slice(0, 1)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Fighter
                        </p>
                        <p className="truncate text-sm font-bold text-slate-900">
                          {fighter.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      {fighter.events.map((event) => (
                        <UfcEventCard
                          key={`${fighter.name}-${event.id}`}
                          event={event}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {results.events.length > 0 ? (
            <section>
              <SectionLabel>Events</SectionLabel>
              <div className="mt-4 flex flex-col gap-4">
                {results.events.map((event) => (
                  <UfcEventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ) : null}

          {results.promotions.length > 0 ? (
            <section>
              <SectionLabel>Promotions</SectionLabel>
              <div className="mt-4 flex flex-col gap-4">
                {results.promotions.map((promotion) => (
                  <article
                    key={promotion.id}
                    className="overflow-hidden rounded-lg border border-[#BAC2CB] bg-white shadow-card"
                  >
                    <Link
                      href={promotion.href}
                      className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50 px-6 py-4"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Promotion
                        </p>
                        <h3 className="truncate text-lg font-bold tracking-tight text-slate-900">
                          {promotion.name}
                        </h3>
                      </div>
                      <span className="shrink-0 text-xs text-[#B45309]">
                        View →
                      </span>
                    </Link>
                    {promotion.matches.length > 0 ? (
                      <div className="grid gap-3 p-4 sm:grid-cols-2">
                        {promotion.matches.map((match) => (
                          <MatchTicket key={match.id} match={match} />
                        ))}
                      </div>
                    ) : (
                      <p className="px-6 py-4 text-sm text-slate-500">
                        {promotion.detail}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#475569]">
      {children}
    </h2>
  );
}

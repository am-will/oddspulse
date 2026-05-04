"use client";

import { ArrowUpRight, Broadcast, Database, Funnel, MagnifyingGlass, Pulse, Sparkle, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/badge";
import { ScoreRing } from "@/components/score-ring";
import { formatDate, formatMoney, formatPct } from "@/lib/format";
import type { Category, HotMarket, SourceHealth } from "@/lib/types";

const categories: Array<Category | "all"> = ["all", "politics", "crypto", "economics", "sports", "tech-ai", "weather", "legal", "other"];
const platforms = ["all", "polymarket", "kalshi"] as const;

export function Dashboard({ initialMarkets, sources, sample }: { initialMarkets: HotMarket[]; sources: SourceHealth[]; sample: boolean }) {
  const [platform, setPlatform] = useState<(typeof platforms)[number]>("all");
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");

  const markets = useMemo(
    () =>
      initialMarkets.filter((market) => {
        const platformMatch = platform === "all" || market.platform === platform;
        const categoryMatch = category === "all" || market.category === category;
        const queryMatch = market.title.toLowerCase().includes(query.toLowerCase());
        return platformMatch && categoryMatch && queryMatch;
      }),
    [category, initialMarkets, platform, query],
  );

  const topMarket = markets[0] ?? initialMarkets[0];
  const activeSources = sources.filter((source) => source.status === "ok").length;
  const averageScore = markets.length
    ? Math.round(markets.reduce((sum, market) => sum + (market.trend?.score ?? 0), 0) / markets.length)
    : 0;

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_20%_0%,rgba(15,118,110,0.12),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef3f8_100%)] px-4 py-5 text-slate-950 md:px-8 md:py-8">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="relative mx-auto max-w-[1400px]">
        <header className="grid gap-6 border-b border-slate-200/80 pb-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-slate-500 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.7)] backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-teal-600 opacity-60 animate-breathe" />
                <span className="relative inline-flex size-2 rounded-full bg-teal-700" />
              </span>
              Prediction market radar
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-none tracking-tighter text-slate-950 md:text-6xl">
              OddsPulse reads the market before it looks obvious.
            </h1>
            <p className="mt-5 max-w-[62ch] text-base leading-7 text-slate-600">
              A cleaner watch desk for Polymarket and Kalshi heat, built around price movement, liquidity, open interest, and context signals instead of noisy tables.
            </p>
          </div>

          <div className="grid gap-3 rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.55)] backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Desk status</span>
              {sample ? (
                <Badge className="border-amber-200 bg-amber-50 text-amber-700">sample feed</Badge>
              ) : (
                <Badge className="border-teal-200 bg-teal-50 text-teal-700">live cache</Badge>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <HeroStat label="Markets" value={String(markets.length)} />
              <HeroStat label="Avg heat" value={String(averageScore)} />
              <HeroStat label="Sources" value={`${activeSources}/${sources.length}`} />
            </div>
          </div>
        </header>

        <MarketTape markets={initialMarkets} />

        <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="grid gap-3 rounded-[2rem] border border-white/80 bg-white/80 p-3 shadow-[0_20px_60px_-46px_rgba(15,23,42,0.65)] backdrop-blur-xl md:grid-cols-[1fr_auto]">
              <label className="grid gap-2">
                <span className="sr-only">Search markets</span>
                <span className="relative block">
                  <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" weight="bold" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by event, asset, candidate, team"
                    className="h-12 w-full rounded-[1.35rem] border border-slate-200 bg-slate-50/80 pl-12 pr-4 text-sm font-medium outline-none transition duration-300 focus:border-teal-600 focus:bg-white"
                  />
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((item) => (
                  <FilterButton key={item} active={platform === item} onClick={() => setPlatform(item)}>
                    {item}
                  </FilterButton>
                ))}
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              <div className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500">
                <Funnel className="size-4" weight="bold" />
              </div>
              {categories.map((item) => (
                <FilterButton key={item} active={category === item} onClick={() => setCategory(item)} compact>
                  {item}
                </FilterButton>
              ))}
            </div>

            <div className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_22px_60px_-48px_rgba(15,23,42,0.7)]">
              <div className="grid grid-cols-[80px_1fr_170px_110px] border-b border-slate-200 bg-slate-50/80 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 max-md:hidden">
                <span>Heat</span>
                <span>Market</span>
                <span>Pulse</span>
                <span>Window</span>
              </div>

              {markets.length ? (
                <div className="divide-y divide-slate-100">
                  {markets.map((market, index) => (
                    <MarketRow key={market.id} market={market} sample={sample} index={index} />
                  ))}
                </div>
              ) : (
                <EmptyState query={query} />
              )}
            </div>
          </div>

          <aside className="grid content-start gap-5">
            {topMarket ? <FocusPanel market={topMarket} /> : null}
            <SourcePanel sources={sources} />
            <div className="rounded-[2rem] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[0_28px_70px_-50px_rgba(15,23,42,0.9)]">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                <Database className="size-4 text-teal-300" weight="bold" />
                Convex ingest
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Send a bearer-authorized request to <code className="rounded bg-white/10 px-1.5 py-1 font-mono text-xs">/api/ingest/run</code> to collect fresh market snapshots.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-slate-200/70 bg-slate-50 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 font-mono text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function FilterButton({ active, compact, children, onClick }: { active: boolean; compact?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 text-sm font-medium capitalize transition duration-300 active:-translate-y-[1px] ${
        compact ? "h-10" : "h-12"
      } ${active ? "border-teal-700 bg-teal-700 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
    >
      {children}
    </button>
  );
}

function MarketTape({ markets }: { markets: HotMarket[] }) {
  const tape = [...markets, ...markets].slice(0, 12);
  if (!tape.length) return null;
  return (
    <div className="mt-5 overflow-hidden rounded-full border border-slate-200 bg-white/70 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="flex w-max gap-3 px-3 animate-tape">
        {tape.map((market, index) => (
          <div key={`${market.id}-${index}`} className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
            <span className="font-mono text-teal-700">{Math.round(market.trend?.score ?? 0)}</span>
            <span className="max-w-[220px] truncate">{market.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketRow({ market, sample, index }: { market: HotMarket; sample: boolean; index: number }) {
  return (
    <Link
      href={`/markets/${market.platform}/${encodeURIComponent(market.externalId)}`}
      className="grid gap-4 px-5 py-5 transition duration-300 hover:bg-slate-50/70 active:-translate-y-[1px] md:grid-cols-[80px_1fr_170px_110px]"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="animate-rise-in">
        <ScoreRing score={market.trend?.score ?? 0} />
      </div>
      <div className="min-w-0 animate-rise-in" style={{ animationDelay: `${index * 45 + 40}ms` }}>
        <div className="flex flex-wrap gap-2">
          <Badge>{market.platform}</Badge>
          <Badge>{market.category}</Badge>
          {sample ? <Badge className="border-amber-200 bg-amber-50 text-amber-700">sample</Badge> : null}
        </div>
        <h2 className="mt-3 max-w-3xl text-lg font-semibold leading-6 tracking-tight text-slate-950">{market.title}</h2>
        <p className="mt-2 line-clamp-1 text-sm leading-6 text-slate-500">{market.trend?.why.join(" · ")}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm md:grid-cols-1">
        <Metric label="Price" value={formatPct(market.snapshot?.price)} />
        <Metric label="24h Vol" value={formatMoney(market.snapshot?.volume24h ?? market.snapshot?.volume)} />
        <Metric label="Spread" value={formatPct(market.snapshot?.spread)} />
      </div>
      <div className="flex items-end justify-between gap-3 md:grid md:content-between">
        <span className="text-sm text-slate-500">Closes {formatDate(market.closeTime)}</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700">
          Detail <ArrowUpRight className="size-4" weight="bold" />
        </span>
      </div>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-1 font-mono text-sm font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function FocusPanel({ market }: { market: HotMarket }) {
  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_22px_60px_-46px_rgba(15,23,42,0.7)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <Pulse className="size-4 text-teal-700" weight="bold" />
          Lead signal
        </div>
        <span className="font-mono text-sm font-semibold text-teal-700">{Math.round(market.trend?.score ?? 0)}</span>
      </div>
      <h2 className="mt-4 text-xl font-semibold leading-7 tracking-tight text-slate-950">{market.title}</h2>
      <div className="mt-5 grid gap-3">
        {(market.trend?.why ?? ["Baseline activity detected"]).slice(0, 3).map((reason) => (
          <div key={reason} className="flex items-start gap-3 rounded-[1.35rem] border border-slate-100 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            <Sparkle className="mt-1 size-4 shrink-0 text-teal-700" weight="bold" />
            {reason}
          </div>
        ))}
      </div>
    </div>
  );
}

function SourcePanel({ sources }: { sources: SourceHealth[] }) {
  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-[0_22px_60px_-46px_rgba(15,23,42,0.7)]">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <Broadcast className="size-4 text-teal-700" weight="bold" />
        Source health
      </div>
      <div className="mt-5 grid gap-2">
        {sources.map((source) => (
          <div key={source.source} className="grid gap-2 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold capitalize text-slate-800">{source.source}</span>
              <Badge className={source.status === "ok" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-500"}>{source.status}</Badge>
            </div>
            <p className="text-xs leading-5 text-slate-500">{source.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <div className="grid size-14 place-items-center rounded-full border border-amber-200 bg-amber-50 text-amber-700">
        <WarningCircle className="size-7" weight="bold" />
      </div>
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">No markets match this view</h2>
      <p className="mt-2 max-w-[44ch] text-sm leading-6 text-slate-500">
        {query ? "Try a broader term or clear one of the filters." : "No cached markets are available for this source/category combination yet."}
      </p>
    </div>
  );
}

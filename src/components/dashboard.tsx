"use client";

import { ArrowUpRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/badge";
import { HeatBar } from "@/components/score-ring";
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
    <main className="relative z-10 min-h-[100dvh] text-paper">
      <TopBar sample={sample} />
      <Tape markets={initialMarkets} />

      <div className="mx-auto max-w-[1480px] px-6 md:px-10">
        <Hero markets={markets.length} avgHeat={averageScore} sources={`${activeSources}/${sources.length}`} />

        <Toolbar
          query={query}
          setQuery={setQuery}
          platform={platform}
          setPlatform={setPlatform}
          category={category}
          setCategory={setCategory}
        />

        <section className="grid grid-cols-1 gap-10 pb-24 lg:grid-cols-[minmax(0,1fr)_360px]">
          <MarketTable markets={markets} sample={sample} query={query} />
          <Aside topMarket={topMarket} sources={sources} />
        </section>
      </div>
    </main>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* top bar                                                       */
/* ──────────────────────────────────────────────────────────── */

function TopBar({ sample }: { sample: boolean }) {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      const ss = String(d.getUTCSeconds()).padStart(2, "0");
      setNow(`${hh}:${mm}:${ss}Z`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border-b border-[color:var(--color-rule)]">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between px-6 py-3 md:px-10">
        <div className="flex items-center gap-4">
          <div className="grid size-7 place-items-center rounded-sm bg-amber-400/95 text-[11px] font-bold tracking-tight text-[color:var(--color-ink)]" style={{ background: "var(--color-amber)" }}>
            OP
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-paper-dim">
            ODDSPULSE <span className="mx-2 text-paper-mute">/</span> tape
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-paper-mute md:flex">
            <span className="live-dot" />
            <span className="text-paper-dim">live</span>
            <span className="text-paper-mute">·</span>
            <span className="tabular text-paper-dim">{now || "00:00:00Z"}</span>
          </div>
          {sample ? (
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-amber-300" style={{ color: "var(--color-amber)" }}>
              ⌁ sample feed
            </span>
          ) : (
            <span className="font-mono text-[10.5px] uppercase tracking-[0.22em]" style={{ color: "var(--color-mint)" }}>
              ⌁ live cache
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* tape                                                          */
/* ──────────────────────────────────────────────────────────── */

function Tape({ markets }: { markets: HotMarket[] }) {
  const tape = [...markets, ...markets, ...markets].slice(0, 24);
  if (!tape.length) return null;
  return (
    <div className="overflow-hidden border-b border-[color:var(--color-rule)]">
      <div className="flex w-max gap-10 py-2.5 animate-tape">
        {tape.map((market, index) => {
          const score = Math.round(market.trend?.score ?? 0);
          const hot = score >= 70;
          return (
            <div key={`${market.id}-${index}`} className="flex shrink-0 items-center gap-3 font-mono text-[11.5px] uppercase tracking-[0.14em] text-paper-dim">
              <span
                className="tabular font-semibold"
                style={{ color: hot ? "var(--color-amber)" : "var(--color-paper-mute)" }}
              >
                {String(score).padStart(2, "0")}
              </span>
              <span className="text-paper-mute">▸</span>
              <span className="max-w-[280px] truncate normal-case tracking-normal text-paper-dim">{market.title}</span>
              <span className="text-paper-mute">·</span>
              <span className="tabular text-paper-mute">{formatPct(market.snapshot?.price)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* hero                                                          */
/* ──────────────────────────────────────────────────────────── */

function Hero({ markets, avgHeat, sources }: { markets: number; avgHeat: number; sources: string }) {
  return (
    <section className="grid grid-cols-1 gap-10 pt-14 pb-12 lg:grid-cols-[1fr_280px] lg:gap-16">
      <div className="animate-rise">
        <div className="eyebrow flex items-center gap-3">
          <span className="inline-block h-px w-7 bg-[color:var(--color-amber)]" />
          Issue 001 · Prediction-market tape
        </div>

        <h1 className="mt-7 max-w-[18ch] text-[clamp(48px,6.4vw,92px)] leading-[0.98] tracking-[-0.03em] text-paper">
          Reading the market{" "}
          <span className="display-serif text-[clamp(52px,7vw,104px)] leading-[0.95] tracking-[-0.03em]" style={{ color: "var(--color-amber)" }}>
            before
          </span>{" "}
          it goes obvious.
        </h1>

        <p className="mt-8 max-w-[62ch] text-[15.5px] leading-[1.65] text-paper-dim">
          A late-night terminal for Polymarket and Kalshi. Markets ranked by deterministic heat —
          price, liquidity, open interest, context — never noise. Tabular numerals, hairline rules,
          one ember of amber.
        </p>
      </div>

      <div className="grid content-end gap-0">
        <StatRow label="Markets in view" value={String(markets).padStart(3, "0")} />
        <StatRow label="Avg heat" value={String(avgHeat).padStart(2, "0")} accent />
        <StatRow label="Sources online" value={sources} />
      </div>
    </section>
  );
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-t border-[color:var(--color-rule)] py-5">
      <span className="eyebrow">{label}</span>
      <span
        className="tabular font-mono text-[44px] font-light leading-none"
        style={{ color: accent ? "var(--color-amber)" : "var(--color-paper)" }}
      >
        {value}
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* toolbar                                                       */
/* ──────────────────────────────────────────────────────────── */

function Toolbar({
  query,
  setQuery,
  platform,
  setPlatform,
  category,
  setCategory,
}: {
  query: string;
  setQuery: (q: string) => void;
  platform: (typeof platforms)[number];
  setPlatform: (p: (typeof platforms)[number]) => void;
  category: Category | "all";
  setCategory: (c: Category | "all") => void;
}) {
  return (
    <section className="mb-7 border-y border-[color:var(--color-rule)] py-5">
      <div className="grid items-center gap-5 md:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-3">
          <span className="eyebrow shrink-0">⌕ search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="event, asset, candidate, ticker…"
            className="terminal w-full pb-1.5 font-sans text-[15px] tracking-tight"
          />
          <span className="font-mono text-paper-mute animate-blink">▌</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {platforms.map((item) => (
            <button key={item} className="pill" data-active={platform === item} onClick={() => setPlatform(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="eyebrow shrink-0">filter</span>
        <span className="text-paper-mute">·</span>
        {categories.map((item) => (
          <button key={item} className="pill" data-active={category === item} onClick={() => setCategory(item)}>
            {item.replace("-", "/")}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* market table                                                  */
/* ──────────────────────────────────────────────────────────── */

function MarketTable({ markets, sample, query }: { markets: HotMarket[]; sample: boolean; query: string }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="display-serif text-3xl tracking-[-0.02em]">The Tape</h2>
        <span className="eyebrow tabular">{String(markets.length).padStart(3, "0")} listings</span>
      </div>

      <div className="hidden grid-cols-[64px_1fr_92px_120px_88px_120px] gap-6 border-b border-[color:var(--color-rule-strong)] pb-2.5 md:grid">
        <span className="eyebrow">heat</span>
        <span className="eyebrow">market</span>
        <span className="eyebrow text-right">yes price</span>
        <span className="eyebrow text-right">24h vol</span>
        <span className="eyebrow text-right">spread</span>
        <span className="eyebrow text-right">closes</span>
      </div>

      {markets.length ? (
        <ul>
          {markets.map((market, index) => (
            <MarketRow key={market.id} market={market} sample={sample} index={index} />
          ))}
        </ul>
      ) : (
        <EmptyState query={query} />
      )}
    </div>
  );
}

function MarketRow({ market, sample, index }: { market: HotMarket; sample: boolean; index: number }) {
  const score = Math.round(market.trend?.score ?? 0);
  return (
    <li className="market-row border-b border-[color:var(--color-rule)]" style={{ animationDelay: `${index * 35}ms` }}>
      <Link
        href={`/markets/${market.platform}/${encodeURIComponent(market.externalId)}`}
        className="grid grid-cols-[1fr_auto] items-start gap-5 py-6 md:grid-cols-[64px_1fr_92px_120px_88px_120px] md:items-center md:gap-6"
      >
        {/* heat number */}
        <div className="md:order-1">
          <div
            className="score-glyph text-[44px]"
            style={{ color: score >= 70 ? "var(--color-amber)" : "var(--color-paper)" }}
          >
            {String(score).padStart(2, "0")}
          </div>
        </div>

        {/* market info */}
        <div className="min-w-0 md:order-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{market.platform}</Badge>
            <Badge muted>{market.category}</Badge>
            {sample ? <Badge tone="amber">sample</Badge> : null}
          </div>
          <h3 className="display-serif mt-2.5 text-[22px] leading-[1.18] tracking-[-0.015em] text-paper">
            {market.title}
          </h3>
          <div className="mt-2 max-w-[60ch]">
            <HeatBar score={score} />
          </div>
          <p className="mt-2 line-clamp-1 text-[13px] leading-5 text-paper-mute">
            {(market.trend?.why ?? []).join("  ·  ") || "Baseline activity detected"}
          </p>
        </div>

        {/* price */}
        <div className="hidden text-right font-mono text-[15px] tabular text-paper md:order-3 md:block">
          {formatPct(market.snapshot?.price)}
        </div>
        {/* vol */}
        <div className="hidden text-right font-mono text-[15px] tabular text-paper-dim md:order-4 md:block">
          {formatMoney(market.snapshot?.volume24h ?? market.snapshot?.volume)}
        </div>
        {/* spread */}
        <div className="hidden text-right font-mono text-[15px] tabular text-paper-dim md:order-5 md:block">
          {formatPct(market.snapshot?.spread)}
        </div>
        {/* closes + arrow */}
        <div className="hidden items-center justify-end gap-3 md:order-6 md:flex">
          <span className="font-mono text-[12px] tabular text-paper-mute">{formatDate(market.closeTime)}</span>
          <ArrowUpRight className="size-4 text-paper-mute transition group-hover:text-amber-300" weight="bold" />
        </div>

        {/* mobile metrics */}
        <div className="col-span-2 grid grid-cols-3 gap-4 border-t border-[color:var(--color-rule)] pt-3 md:hidden">
          <MobileMetric label="yes price" value={formatPct(market.snapshot?.price)} />
          <MobileMetric label="24h vol" value={formatMoney(market.snapshot?.volume24h ?? market.snapshot?.volume)} />
          <MobileMetric label="spread" value={formatPct(market.snapshot?.spread)} />
        </div>
      </Link>
    </li>
  );
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="mt-1 font-mono text-[13px] tabular text-paper">{value}</div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="grid place-items-center border-b border-[color:var(--color-rule)] px-6 py-24 text-center">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-paper-mute">⌀ no signal</span>
      <h2 className="display-serif mt-5 text-3xl tracking-[-0.015em]">Nothing matches that view.</h2>
      <p className="mt-3 max-w-[44ch] text-sm leading-6 text-paper-mute">
        {query ? "Loosen the search term, or pop a filter off." : "No cached markets in this slice yet — kick off the ingest."}
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* aside                                                         */
/* ──────────────────────────────────────────────────────────── */

function Aside({ topMarket, sources }: { topMarket: HotMarket | undefined; sources: SourceHealth[] }) {
  return (
    <aside className="grid content-start gap-10 lg:sticky lg:top-6 lg:self-start">
      {topMarket ? <FocusPanel market={topMarket} /> : null}
      <SourcePanel sources={sources} />
      <IngestPanel />
    </aside>
  );
}

function FocusPanel({ market }: { market: HotMarket }) {
  const score = Math.round(market.trend?.score ?? 0);
  const reasons = (market.trend?.why ?? ["Baseline activity detected"]).slice(0, 4);
  return (
    <section>
      <div className="flex items-center justify-between border-t border-[color:var(--color-rule-strong)] pt-4">
        <span className="eyebrow flex items-center gap-2">
          <span className="live-dot" />
          Lead signal
        </span>
        <span
          className="score-glyph text-[56px]"
          style={{ color: score >= 70 ? "var(--color-amber)" : "var(--color-paper)" }}
        >
          {String(score).padStart(2, "0")}
        </span>
      </div>

      <h3 className="display-serif mt-5 text-[28px] leading-[1.1] tracking-[-0.018em]">
        {market.title}
      </h3>

      <ol className="mt-6 grid gap-3.5">
        {reasons.map((reason, i) => (
          <li key={reason} className="grid grid-cols-[28px_1fr] items-baseline gap-3 border-t border-[color:var(--color-rule)] pt-3">
            <span className="font-mono text-[11px] tabular text-paper-mute">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[14px] leading-[1.55] text-paper-dim">{reason}</span>
          </li>
        ))}
      </ol>

      <Link
        href={`/markets/${market.platform}/${encodeURIComponent(market.externalId)}`}
        className="mt-6 inline-flex items-center gap-2 border-b border-[color:var(--color-amber)] pb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-amber-300"
        style={{ color: "var(--color-amber)" }}
      >
        Read the full tape <ArrowUpRight className="size-3.5" weight="bold" />
      </Link>
    </section>
  );
}

function SourcePanel({ sources }: { sources: SourceHealth[] }) {
  return (
    <section>
      <div className="flex items-center justify-between border-t border-[color:var(--color-rule-strong)] pt-4">
        <span className="eyebrow">Source health</span>
        <span className="font-mono text-[11px] tabular text-paper-mute">
          {sources.filter((s) => s.status === "ok").length}/{sources.length}
        </span>
      </div>
      <ul className="mt-4 grid">
        {sources.map((source) => {
          const ok = source.status === "ok";
          return (
            <li key={source.source} className="grid gap-1 border-t border-[color:var(--color-rule)] py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[13px] capitalize text-paper">
                  <span
                    className="inline-block size-1.5 rounded-full"
                    style={{ background: ok ? "var(--color-mint)" : "var(--color-paper-mute)" }}
                  />
                  {source.source}
                </span>
                <span
                  className="font-mono text-[10.5px] uppercase tracking-[0.18em]"
                  style={{ color: ok ? "var(--color-mint)" : "var(--color-paper-mute)" }}
                >
                  {source.status}
                </span>
              </div>
              <p className="text-[12px] leading-[1.5] text-paper-mute">{source.message}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function IngestPanel() {
  return (
    <section className="relative overflow-hidden border border-[color:var(--color-amber)]/40 bg-[color:var(--color-ink-2)] p-6">
      <div className="glow-sweep absolute inset-0" />
      <div className="relative">
        <div className="eyebrow flex items-center gap-2">
          <span style={{ color: "var(--color-amber)" }}>◇</span>
          Convex ingest
        </div>
        <p className="mt-4 max-w-[42ch] text-[14px] leading-[1.55] text-paper-dim">
          Bearer-authorize a request to the ingest endpoint to capture a fresh tape of snapshots.
        </p>
        <code className="mt-4 inline-block border-b border-[color:var(--color-rule-strong)] pb-1 font-mono text-[12.5px] tracking-tight text-paper">
          GET <span style={{ color: "var(--color-amber)" }}>/api/ingest/run</span>
        </code>
      </div>
    </section>
  );
}

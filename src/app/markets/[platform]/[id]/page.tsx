import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Badge } from "@/components/badge";
import { HeatBar } from "@/components/score-ring";
import { formatDate, formatMoney, formatPct } from "@/lib/format";
import { getMarketDetail } from "@/lib/repository";
import { sampleHotMarkets } from "@/lib/sample-data";
import type { ContextItem } from "@/lib/types";

export const revalidate = 30;

export default async function MarketPage({ params }: { params: Promise<{ platform: string; id: string }> }) {
  const { platform, id } = await params;
  const decodedId = decodeURIComponent(id);
  const storedMarket = await getMarketDetail(platform, decodedId);
  const sampleMarket = sampleHotMarkets.find((item) => item.platform === platform && item.externalId === decodedId);
  const market = storedMarket ?? (sampleMarket ? { ...sampleMarket, snapshots: sampleMarket.snapshot ? [sampleMarket.snapshot] : [] } : null);

  if (!market) {
    return (
      <main className="relative z-10 grid min-h-[100dvh] place-items-center px-6 text-paper">
        <div className="border-y border-[color:var(--color-rule-strong)] py-12 text-center">
          <span className="eyebrow">404 · void</span>
          <h1 className="display-serif mt-4 text-5xl tracking-[-0.02em]">Market not found.</h1>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 border-b border-[color:var(--color-amber)] pb-1 font-mono text-[11px] uppercase tracking-[0.22em]"
            style={{ color: "var(--color-amber)" }}
          >
            <ArrowLeft className="size-3.5" weight="bold" /> Back to the tape
          </Link>
        </div>
      </main>
    );
  }

  const latest = market.snapshots[0];
  const score = Math.round(market.trend?.score ?? 0);

  return (
    <main className="relative z-10 min-h-[100dvh] text-paper">
      <div className="mx-auto max-w-[1180px] px-6 py-10 md:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-paper-mute transition hover:text-paper"
        >
          <ArrowLeft className="size-3.5" weight="bold" /> Back to the tape
        </Link>

        <header className="mt-10 grid gap-10 border-b border-[color:var(--color-rule-strong)] pb-10 lg:grid-cols-[1fr_240px]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{market.platform}</Badge>
              <Badge muted>{market.category}</Badge>
              <Badge tone="amber">{market.status}</Badge>
            </div>
            <h1 className="display-serif mt-7 max-w-4xl text-[clamp(40px,6vw,88px)] leading-[0.95] tracking-[-0.025em]">
              {market.title}
            </h1>
            <a
              href={market.url}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex items-center gap-2 border-b border-[color:var(--color-amber)] pb-1 font-mono text-[11px] uppercase tracking-[0.22em]"
              style={{ color: "var(--color-amber)" }}
            >
              Open source market <ArrowUpRight className="size-3.5" weight="bold" />
            </a>
          </div>

          <div className="grid content-end gap-4 border-l border-[color:var(--color-rule)] pl-8 lg:border-l">
            <span className="eyebrow">Heat score</span>
            <span
              className="score-glyph text-[120px]"
              style={{ color: score >= 70 ? "var(--color-amber)" : "var(--color-paper)" }}
            >
              {String(score).padStart(2, "0")}
            </span>
            <HeatBar score={score} />
          </div>
        </header>

        <section className="grid grid-cols-2 gap-0 border-b border-[color:var(--color-rule)] md:grid-cols-5">
          <Stat label="Price" value={formatPct(latest?.price)} />
          <Stat label="24h Volume" value={formatMoney(latest?.volume24h ?? latest?.volume)} />
          <Stat label="Liquidity" value={formatMoney(latest?.liquidity)} />
          <Stat label="Open Interest" value={formatMoney(latest?.openInterest)} />
          <Stat label="Closes" value={formatDate(market.closeTime)} />
        </section>

        <section className="grid gap-12 py-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center justify-between border-t border-[color:var(--color-rule-strong)] pt-4">
              <span className="eyebrow">Why it is moving</span>
              <span className="font-mono text-[11px] tabular text-paper-mute">{(market.trend?.why ?? []).length} signals</span>
            </div>

            <ol className="mt-6 grid gap-0">
              {(market.trend?.why ?? ["Baseline activity detected"]).map((reason: string, i: number) => (
                <li key={reason} className="grid grid-cols-[36px_1fr] items-baseline gap-4 border-t border-[color:var(--color-rule)] py-5">
                  <span className="font-mono text-[12px] tabular text-paper-mute">{String(i + 1).padStart(2, "0")}</span>
                  <span className="display-serif text-[20px] leading-[1.35] tracking-[-0.012em] text-paper">{reason}</span>
                </li>
              ))}
            </ol>

            <div className="mt-10 grid grid-cols-3 gap-0 border-t border-[color:var(--color-rule-strong)]">
              <SubStat label="Volume score" value={String(Math.round(market.trend?.volumeScore ?? 0)).padStart(2, "0")} />
              <SubStat label="Price score" value={String(Math.round(market.trend?.priceScore ?? 0)).padStart(2, "0")} />
              <SubStat label="Context score" value={String(Math.round(market.trend?.contextScore ?? 0)).padStart(2, "0")} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between border-t border-[color:var(--color-rule-strong)] pt-4">
              <span className="eyebrow">Context dispatches</span>
              <span className="font-mono text-[11px] tabular text-paper-mute">{market.contextItems.length}</span>
            </div>

            <ul className="mt-4">
              {market.contextItems.length ? (
                market.contextItems.map((item: ContextItem) => (
                  <li key={item.id} className="border-t border-[color:var(--color-rule)]">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group grid gap-2 py-4 transition hover:bg-[color:var(--color-rule)]"
                    >
                      <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.22em] text-paper-mute">
                        <span>{item.source}</span>
                        <ArrowUpRight className="size-3 transition group-hover:text-amber-300" weight="bold" />
                      </div>
                      <div className="text-[14.5px] leading-[1.4] text-paper">{item.title}</div>
                    </a>
                  </li>
                ))
              ) : (
                <li className="border-t border-[color:var(--color-rule)] py-6 text-[13px] leading-6 text-paper-mute">
                  No cached context yet. Run ingestion after configuring optional source keys or RSS feeds.
                </li>
              )}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 border-r border-[color:var(--color-rule)] px-4 py-6 last:border-r-0 md:px-6 md:py-8">
      <span className="eyebrow">{label}</span>
      <span className="font-mono text-[24px] leading-none tabular text-paper">{value}</span>
    </div>
  );
}

function SubStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 border-r border-[color:var(--color-rule)] px-2 py-5 last:border-r-0">
      <span className="eyebrow">{label}</span>
      <span className="score-glyph text-[44px] text-paper">{value}</span>
    </div>
  );
}

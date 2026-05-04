import { ArrowLeft, ArrowUpRight, NewspaperClipping, Pulse, Sparkle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Badge } from "@/components/badge";
import { ScoreRing } from "@/components/score-ring";
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
      <main className="grid min-h-[100dvh] place-items-center bg-slate-50 p-6 text-slate-950">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_22px_60px_-46px_rgba(15,23,42,0.7)]">
          <h1 className="text-xl font-semibold tracking-tight">Market not found</h1>
          <Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
            <ArrowLeft className="size-4" weight="bold" />
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }
  const latest = market.snapshots[0];
  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_20%_0%,rgba(15,118,110,0.12),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef3f8_100%)] px-4 py-6 text-slate-950 md:px-8">
      <div className="mx-auto max-w-[1180px]">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition duration-300 hover:text-teal-700 active:-translate-y-[1px]">
          <ArrowLeft className="size-4" weight="bold" />
          Dashboard
        </Link>

        <section className="mt-6 grid gap-6 rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.6)] backdrop-blur-xl md:p-8 lg:grid-cols-[1fr_220px]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{market.platform}</Badge>
              <Badge>{market.category}</Badge>
              <Badge>{market.status}</Badge>
            </div>
            <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-none tracking-tighter md:text-5xl">{market.title}</h1>
            <a href={market.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-700">
              Open source market <ArrowUpRight className="size-4" weight="bold" />
            </a>
          </div>
          <div className="grid content-between gap-5 rounded-[1.6rem] border border-slate-200 bg-white p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Heat score</div>
            <ScoreRing score={market.trend?.score ?? 0} />
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-5">
          <Stat label="Price" value={formatPct(latest?.price)} />
          <Stat label="24h Volume" value={formatMoney(latest?.volume24h ?? latest?.volume)} />
          <Stat label="Liquidity" value={formatMoney(latest?.liquidity)} />
          <Stat label="Open Interest" value={formatMoney(latest?.openInterest)} />
          <Stat label="Closes" value={formatDate(market.closeTime)} />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_22px_60px_-46px_rgba(15,23,42,0.7)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Pulse className="size-4 text-teal-700" weight="bold" />
              Why it is moving
            </div>
            <div className="mt-5 grid gap-3">
              {(market.trend?.why ?? ["Baseline activity detected"]).map((why: string) => (
                <div key={why} className="flex items-start gap-3 rounded-[1.35rem] border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  <Sparkle className="mt-1 size-4 shrink-0 text-teal-700" weight="bold" />
                  {why}
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <Stat label="Volume Score" value={String(Math.round(market.trend?.volumeScore ?? 0))} compact />
              <Stat label="Price Score" value={String(Math.round(market.trend?.priceScore ?? 0))} compact />
              <Stat label="Context Score" value={String(Math.round(market.trend?.contextScore ?? 0))} compact />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_22px_60px_-46px_rgba(15,23,42,0.7)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <NewspaperClipping className="size-4 text-teal-700" weight="bold" />
              Context
            </div>
            <div className="mt-5 grid gap-3">
              {market.contextItems.length ? (
                market.contextItems.map((item: ContextItem) => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="rounded-[1.35rem] border border-slate-100 bg-slate-50 p-4 transition duration-300 hover:border-teal-200 hover:bg-white active:-translate-y-[1px]">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{item.source}</div>
                    <div className="mt-2 text-sm font-semibold leading-5 text-slate-900">{item.title}</div>
                  </a>
                ))
              ) : (
                <p className="rounded-[1.35rem] border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                  No cached context yet. Run ingestion after configuring optional source keys or RSS feeds.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={`rounded-[1.5rem] border border-slate-200 bg-white ${compact ? "p-4" : "p-5 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.7)]"}`}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="mt-2 font-mono text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

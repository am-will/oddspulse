import type { ContextItem, Market, MarketSnapshot, TrendScore } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function pctChange(current: number | null, previous: number | null) {
  if (current == null || previous == null || previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function computeTrendScore(args: {
  market: Market;
  latest: MarketSnapshot;
  previous?: MarketSnapshot | null;
  contexts: ContextItem[];
}): TrendScore {
  const { market, latest, previous, contexts } = args;
  const volumeDelta = pctChange(latest.volume ?? latest.volume24h, previous?.volume ?? previous?.volume24h ?? null);
  const priceDelta = Math.abs((latest.price ?? 0) - (previous?.price ?? latest.price ?? 0)) * 100;
  const spread = latest.spread ?? (latest.bestAsk != null && latest.bestBid != null ? latest.bestAsk - latest.bestBid : null);
  const hoursToClose = market.closeTime
    ? (new Date(market.closeTime).getTime() - Date.now()) / 3_600_000
    : 999;

  const volumeScore = clamp(Math.log10((latest.volume24h ?? latest.volume ?? 0) + 1) * 16 + volumeDelta * 0.35);
  const priceScore = clamp(priceDelta * 8);
  const liquidityScore = clamp(Math.log10((latest.liquidity ?? 0) + 1) * 15 + (spread == null ? 0 : Math.max(0, 20 - spread * 100)));
  const openInterestScore = clamp(Math.log10((latest.openInterest ?? 0) + 1) * 14);
  const contextScore = clamp(contexts.filter((item) => item.relevanceScore > 0).length * 12);
  const recencyScore = clamp(hoursToClose < 0 ? 0 : hoursToClose < 72 ? 25 : hoursToClose < 24 * 14 ? 12 : 4);

  const score = clamp(
    volumeScore * 0.28 +
      priceScore * 0.22 +
      liquidityScore * 0.18 +
      openInterestScore * 0.12 +
      contextScore * 0.12 +
      recencyScore * 0.08,
  );

  const why = [
    volumeScore > 45 ? "Elevated trading volume" : null,
    priceScore > 25 ? "Fast probability move" : null,
    liquidityScore > 45 ? "Useful liquidity and tight spread" : null,
    openInterestScore > 35 ? "Meaningful open interest" : null,
    contextScore > 20 ? "Related news or Reddit mentions found" : null,
    recencyScore > 20 ? "Approaching resolution window" : null,
  ].filter(Boolean) as string[];

  return {
    marketId: market.id,
    score: Number(score.toFixed(2)),
    volumeScore: Number(volumeScore.toFixed(2)),
    priceScore: Number(priceScore.toFixed(2)),
    liquidityScore: Number(liquidityScore.toFixed(2)),
    openInterestScore: Number(openInterestScore.toFixed(2)),
    contextScore: Number(contextScore.toFixed(2)),
    recencyScore: Number(recencyScore.toFixed(2)),
    why: why.length ? why : ["Baseline activity detected"],
    computedAt: new Date().toISOString(),
  };
}

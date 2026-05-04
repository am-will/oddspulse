import { api } from "../../convex/_generated/api";
import { fetchAction, fetchQuery } from "convex/nextjs";
import type { ContextItem, HotMarket, MarketSnapshot, TrendScore } from "./types";

type ConvexMarketRow = {
  marketId: string;
  platform: "polymarket" | "kalshi";
  externalId: string;
  ticker?: string;
  title: string;
  category: string;
  url: string;
  status: string;
  closeTime?: string;
};

type ConvexSnapshotRow = Parameters<typeof snapshotFromConvex>[0];
type ConvexContextRow = Parameters<typeof contextFromConvex>[0];
type ConvexTrendRow = Parameters<typeof trendFromConvex>[0];

type ConvexHotRow = {
  market: ConvexMarketRow;
  snapshot: ConvexSnapshotRow | null;
  trend: ConvexTrendRow;
  contextItems: ConvexContextRow[];
};

type ConvexDetailRow = {
  market: ConvexMarketRow;
  snapshots: ConvexSnapshotRow[];
  trend: ConvexTrendRow | null;
  contextItems: ConvexContextRow[];
};

export function hasConvexConfig() {
  return Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
}

function snapshotFromConvex(row: {
  marketId: string;
  ts: string;
  price?: number;
  volume?: number;
  volume24h?: number;
  liquidity?: number;
  spread?: number;
  openInterest?: number;
  bestBid?: number;
  bestAsk?: number;
}): MarketSnapshot {
  return {
    marketId: row.marketId,
    ts: row.ts,
    price: row.price ?? null,
    volume: row.volume ?? null,
    volume24h: row.volume24h ?? null,
    liquidity: row.liquidity ?? null,
    spread: row.spread ?? null,
    openInterest: row.openInterest ?? null,
    bestBid: row.bestBid ?? null,
    bestAsk: row.bestAsk ?? null,
  };
}

function contextFromConvex(row: {
  contextId: string;
  marketId: string;
  source: string;
  title: string;
  url: string;
  publishedAt?: string;
  matchedKeywords: string[];
  relevanceScore: number;
}): ContextItem {
  return {
    id: row.contextId,
    marketId: row.marketId,
    source: row.source,
    title: row.title,
    url: row.url,
    publishedAt: row.publishedAt ?? null,
    matchedKeywords: row.matchedKeywords,
    relevanceScore: row.relevanceScore,
  };
}

function trendFromConvex(row: {
  marketId: string;
  score: number;
  volumeScore: number;
  priceScore: number;
  liquidityScore: number;
  openInterestScore: number;
  contextScore: number;
  recencyScore: number;
  why: string[];
  computedAt: string;
}): TrendScore {
  return row;
}

export async function getHotMarkets(limit = 50): Promise<HotMarket[]> {
  if (!hasConvexConfig()) return [];
  let rows: ConvexHotRow[];
  try {
    rows = (await fetchQuery(api.markets.hot, { limit })) as ConvexHotRow[];
  } catch {
    return [];
  }
  return rows.map(({ market, snapshot, trend, contextItems }) => ({
    id: market.marketId,
    platform: market.platform,
    externalId: market.externalId,
    ticker: market.ticker ?? null,
    title: market.title,
    category: market.category as HotMarket["category"],
    url: market.url,
    status: market.status,
    closeTime: market.closeTime ?? null,
    snapshot: snapshot ? snapshotFromConvex(snapshot) : null,
    trend: trendFromConvex(trend),
    contextItems: contextItems.map(contextFromConvex),
  }));
}

export async function getMarketDetail(platform: string, externalId: string) {
  if (!hasConvexConfig()) return null;
  let row: ConvexDetailRow | null;
  try {
    row = (await fetchQuery(api.markets.detail, { platform, externalId })) as ConvexDetailRow | null;
  } catch {
    return null;
  }
  if (!row) return null;
  return {
    id: row.market.marketId,
    platform: row.market.platform,
    externalId: row.market.externalId,
    ticker: row.market.ticker ?? null,
    title: row.market.title,
    category: row.market.category,
    url: row.market.url,
    status: row.market.status,
    closeTime: row.market.closeTime ?? null,
    snapshots: row.snapshots.map(snapshotFromConvex),
    trend: row.trend ? trendFromConvex(row.trend) : null,
    contextItems: row.contextItems.map(contextFromConvex),
  };
}

export async function runConvexIngest() {
  if (!hasConvexConfig()) throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  return fetchAction(api.ingest.run, {});
}

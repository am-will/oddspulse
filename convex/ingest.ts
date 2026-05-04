"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { FunctionReference } from "convex/server";
import { computeTrendScore } from "../src/lib/scoring";
import { fetchContextItems } from "../src/lib/sources/context";
import { fetchKalshiMarkets } from "../src/lib/sources/kalshi";
import { fetchPolymarketMarkets } from "../src/lib/sources/polymarket";
import { getSourceHealth } from "../src/lib/sources/status";
import type { Market, MarketSnapshot } from "../src/lib/types";

type IngestResult = {
  source: string;
  status: "ok" | "disabled" | "error";
  message: string;
  count: number;
};

async function timed<T>(
  ctx: {
    runMutation: (reference: FunctionReference<"mutation", "public" | "internal">, args: Record<string, unknown>) => Promise<unknown>;
  },
  source: string,
  fn: () => Promise<T>,
): Promise<{ result: T | null; health: IngestResult }> {
  const start = Date.now();
  try {
    const result = await fn();
    const count = Array.isArray(result) ? result.length : 0;
    await ctx.runMutation(api.markets.logIngestRun, {
      source,
      status: "ok",
      message: `Fetched ${count} records`,
      durationMs: Date.now() - start,
    });
    return { result, health: { source, status: "ok", message: `Fetched ${count} records`, count } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await ctx.runMutation(api.markets.logIngestRun, {
      source,
      status: "error",
      message,
      durationMs: Date.now() - start,
    });
    return { result: null, health: { source, status: "error", message, count: 0 } };
  }
}

function fromConvexSnapshot(row: {
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

export const run = action({
  args: {},
  handler: async (ctx) => {
    const sourceHealth = getSourceHealth();
    const polymarket = await timed(ctx, "polymarket", () => fetchPolymarketMarkets(100));
    const kalshiSource = sourceHealth.find((source) => source.source === "kalshi");
    const kalshi =
      kalshiSource?.status === "ok"
        ? await timed(ctx, "kalshi", () => fetchKalshiMarkets(100))
        : {
            result: [],
            health: {
              source: "kalshi",
              status: "disabled",
              message: kalshiSource?.message ?? "Disabled",
              count: 0,
            } as IngestResult,
          };

    const records = [...(polymarket.result ?? []), ...(kalshi.result ?? [])];
    const previousRows = (await ctx.runQuery(api.markets.previousSnapshots, {
      marketIds: records.map((record) => record.market.id),
    })) as Array<Parameters<typeof fromConvexSnapshot>[0]>;
    const previous = new Map(previousRows.map((row) => [String(row.marketId), fromConvexSnapshot(row as Parameters<typeof fromConvexSnapshot>[0])]));

    await ctx.runMutation(api.markets.saveMarketBatch, { records });

    const preScores = records
      .map((record) => ({
        record,
        score: computeTrendScore({
          market: record.market,
          latest: record.snapshot,
          previous: previous.get(record.market.id),
          contexts: [],
        }).score,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    const contextItems = (
      await Promise.all(
        preScores.slice(0, 10).map(async ({ record }) => {
          try {
            return await fetchContextItems(record.market);
          } catch {
            return [];
          }
        }),
      )
    ).flat();
    await ctx.runMutation(api.markets.saveContextBatch, { items: contextItems });

    const contextsByMarket = new Map<string, typeof contextItems>();
    for (const item of contextItems) {
      const items = contextsByMarket.get(item.marketId) ?? [];
      items.push(item);
      contextsByMarket.set(item.marketId, items);
    }

    const scores = records.map((record: { market: Market; snapshot: MarketSnapshot }) =>
      computeTrendScore({
        market: record.market,
        latest: record.snapshot,
        previous: previous.get(record.market.id),
        contexts: contextsByMarket.get(record.market.id) ?? [],
      }),
    );
    await ctx.runMutation(api.markets.saveTrendScores, { scores });

    return {
      sources: [polymarket.health, kalshi.health],
      markets: records.length,
      contexts: contextItems.length,
      scores: scores.length,
    };
  },
});

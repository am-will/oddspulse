import { categorize } from "../category";
import type { Market, MarketSnapshot } from "../types";

const GAMMA = "https://gamma-api.polymarket.com";

type GammaMarket = {
  id?: string;
  conditionId?: string;
  question?: string;
  slug?: string;
  eventSlug?: string | null;
  events?: Array<{ slug?: string | null }>;
  active?: boolean;
  closed?: boolean;
  endDate?: string;
  volume?: string | number;
  volume24hr?: string | number;
  liquidity?: string | number;
  bestBid?: string | number;
  bestAsk?: string | number;
  lastTradePrice?: string | number;
};

function num(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function polymarketUrl(raw: GammaMarket) {
  const slug = raw.eventSlug ?? raw.events?.find((event) => event.slug)?.slug ?? raw.slug;
  return slug ? `https://polymarket.com/event/${slug}` : "https://polymarket.com";
}

export function normalizePolymarketMarket(raw: GammaMarket): { market: Market; snapshot: MarketSnapshot } | null {
  const externalId = raw.conditionId ?? raw.id;
  const title = raw.question;
  if (!externalId || !title) return null;
  const id = `polymarket:${externalId}`;
  const bestBid = num(raw.bestBid);
  const bestAsk = num(raw.bestAsk);
  const price = num(raw.lastTradePrice) ?? (bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : null);

  return {
    market: {
      id,
      platform: "polymarket",
      externalId,
      title,
      category: categorize(title),
      url: polymarketUrl(raw),
      status: raw.closed ? "closed" : raw.active === false ? "inactive" : "active",
      closeTime: raw.endDate ?? null,
      raw,
    },
    snapshot: {
      marketId: id,
      ts: new Date().toISOString(),
      price,
      volume: num(raw.volume),
      volume24h: num(raw.volume24hr),
      liquidity: num(raw.liquidity),
      spread: bestBid != null && bestAsk != null ? Math.max(0, bestAsk - bestBid) : null,
      openInterest: null,
      bestBid,
      bestAsk,
      raw,
    },
  };
}

export async function fetchPolymarketMarkets(limit = 100) {
  const params = new URLSearchParams({
    active: "true",
    closed: "false",
    limit: String(limit),
    order: "volume24hr",
    ascending: "false",
  });
  const response = await fetch(`${GAMMA}/markets?${params}`);
  if (!response.ok) throw new Error(`Polymarket ${response.status}`);
  const data = (await response.json()) as GammaMarket[];
  return data.map(normalizePolymarketMarket).filter(Boolean) as Array<NonNullable<ReturnType<typeof normalizePolymarketMarket>>>;
}

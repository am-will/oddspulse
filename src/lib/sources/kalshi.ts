import crypto from "node:crypto";
import { categorize } from "../category";
import { getOptionalEnv } from "../env";
import type { Market, MarketSnapshot } from "../types";

const KALSHI = "https://api.elections.kalshi.com/trade-api/v2";

type KalshiMarket = {
  ticker?: string;
  title?: string;
  eventTitle?: string;
  status?: string;
  close_time?: string;
  yes_bid?: number;
  yes_bid_dollars?: string;
  yes_ask?: number;
  yes_ask_dollars?: string;
  last_price?: number;
  last_price_dollars?: string;
  volume?: number;
  volume_fp?: string;
  volume_24h?: number;
  volume_24h_fp?: string;
  liquidity?: number;
  liquidity_dollars?: string;
  open_interest?: number;
  open_interest_fp?: string;
};

type KalshiEvent = {
  title?: string;
  markets?: KalshiMarket[];
};

function num(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildKalshiHeaders(path: string, method = "GET"): Record<string, string> {
  const keyId = getOptionalEnv("KALSHI_API_KEY_ID");
  const privateKey = getOptionalEnv("KALSHI_PRIVATE_KEY");
  if (!keyId || !privateKey) return {};
  const ts = Date.now().toString();
  const message = ts + method + path;
  const key = crypto.createPrivateKey(privateKey.replace(/\\n/g, "\n"));
  const signature = crypto.sign("sha256", Buffer.from(message), {
    key,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  });
  return {
    "KALSHI-ACCESS-KEY": keyId,
    "KALSHI-ACCESS-SIGNATURE": signature.toString("base64"),
    "KALSHI-ACCESS-TIMESTAMP": ts,
  };
}

function cents(value: number | undefined, dollarValue: string | undefined): number | null {
  if (value != null) return value / 100;
  return num(dollarValue);
}

function metric(value: number | undefined, fixedPointValue: string | undefined): number | null {
  return value ?? num(fixedPointValue);
}

function displayTitle(raw: KalshiMarket) {
  if (raw.eventTitle && (!raw.title || raw.title.includes("  "))) return raw.eventTitle;
  return raw.title;
}

export function normalizeKalshiMarket(raw: KalshiMarket): { market: Market; snapshot: MarketSnapshot } | null {
  const title = displayTitle(raw);
  if (!raw.ticker || !title) return null;
  const id = `kalshi:${raw.ticker}`;
  const bestBid = cents(raw.yes_bid, raw.yes_bid_dollars);
  const bestAsk = cents(raw.yes_ask, raw.yes_ask_dollars);
  const price = cents(raw.last_price, raw.last_price_dollars) ?? (bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : null);
  const volume = metric(raw.volume, raw.volume_fp);
  const volume24h = metric(raw.volume_24h, raw.volume_24h_fp);
  const liquidity = metric(raw.liquidity, raw.liquidity_dollars);
  const openInterest = metric(raw.open_interest, raw.open_interest_fp);
  return {
    market: {
      id,
      platform: "kalshi",
      externalId: raw.ticker,
      ticker: raw.ticker,
      title,
      category: categorize(title),
      url: `https://kalshi.com/markets/${raw.ticker}`,
      status: raw.status ?? "active",
      closeTime: raw.close_time ?? null,
      raw,
    },
    snapshot: {
      marketId: id,
      ts: new Date().toISOString(),
      price,
      volume,
      volume24h,
      liquidity,
      spread: bestBid != null && bestAsk != null ? Math.max(0, bestAsk - bestBid) : null,
      openInterest,
      bestBid,
      bestAsk,
      raw,
    },
  };
}

export async function fetchKalshiMarkets(limit = 100) {
  const path = `/events?limit=${Math.min(limit, 200)}&status=open&with_nested_markets=true`;
  const response = await fetch(`${KALSHI}${path}`, {
    headers: buildKalshiHeaders(path),
  });
  if (!response.ok) throw new Error(`Kalshi ${response.status}`);
  const data = (await response.json()) as { events?: KalshiEvent[] };
  return (data.events ?? [])
    .flatMap((event) => (event.markets ?? []).map((market) => ({ ...market, eventTitle: event.title })))
    .map(normalizeKalshiMarket)
    .filter(Boolean)
    .slice(0, limit) as Array<NonNullable<ReturnType<typeof normalizeKalshiMarket>>>;
}

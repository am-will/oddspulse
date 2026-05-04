import crypto from "node:crypto";
import { categorize } from "../category";
import { getOptionalEnv } from "../env";
import type { Market, MarketSnapshot } from "../types";

const KALSHI = "https://api.elections.kalshi.com/trade-api/v2";

type KalshiMarket = {
  ticker?: string;
  title?: string;
  status?: string;
  close_time?: string;
  yes_bid?: number;
  yes_ask?: number;
  last_price?: number;
  volume?: number;
  volume_24h?: number;
  liquidity?: number;
  open_interest?: number;
};

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

export function normalizeKalshiMarket(raw: KalshiMarket): { market: Market; snapshot: MarketSnapshot } | null {
  if (!raw.ticker || !raw.title) return null;
  const id = `kalshi:${raw.ticker}`;
  const bestBid = raw.yes_bid != null ? raw.yes_bid / 100 : null;
  const bestAsk = raw.yes_ask != null ? raw.yes_ask / 100 : null;
  const price = raw.last_price != null ? raw.last_price / 100 : bestBid != null && bestAsk != null ? (bestBid + bestAsk) / 2 : null;
  return {
    market: {
      id,
      platform: "kalshi",
      externalId: raw.ticker,
      ticker: raw.ticker,
      title: raw.title,
      category: categorize(raw.title),
      url: `https://kalshi.com/markets/${raw.ticker}`,
      status: raw.status ?? "active",
      closeTime: raw.close_time ?? null,
      raw,
    },
    snapshot: {
      marketId: id,
      ts: new Date().toISOString(),
      price,
      volume: raw.volume ?? null,
      volume24h: raw.volume_24h ?? null,
      liquidity: raw.liquidity ?? null,
      spread: bestBid != null && bestAsk != null ? Math.max(0, bestAsk - bestBid) : null,
      openInterest: raw.open_interest ?? null,
      bestBid,
      bestAsk,
      raw,
    },
  };
}

export async function fetchKalshiMarkets(limit = 100) {
  const path = `/markets?limit=${limit}&status=open`;
  const response = await fetch(`${KALSHI}${path}`, {
    headers: buildKalshiHeaders(path),
  });
  if (!response.ok) throw new Error(`Kalshi ${response.status}`);
  const data = (await response.json()) as { markets?: KalshiMarket[] };
  return (data.markets ?? []).map(normalizeKalshiMarket).filter(Boolean) as Array<NonNullable<ReturnType<typeof normalizeKalshiMarket>>>;
}

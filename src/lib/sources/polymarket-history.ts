const GAMMA = "https://gamma-api.polymarket.com";
const CLOB = "https://clob.polymarket.com";

export type PricePoint = { t: number; p: number };
export type Range = "1d" | "1w" | "1m" | "max";

const RANGE_FIDELITY: Record<Range, number> = {
  "1d": 5,
  "1w": 30,
  "1m": 120,
  max: 720,
};

/**
 * Read clobTokenIds from a stored Gamma payload. The Gamma API serialises
 * clobTokenIds as a JSON string, but if anything has parsed it already we
 * accept that too.
 */
export function extractClobTokenId(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const ids = (raw as Record<string, unknown>).clobTokenIds;
  if (typeof ids === "string") {
    try {
      const parsed = JSON.parse(ids);
      if (Array.isArray(parsed) && parsed.length > 0) return String(parsed[0]);
    } catch {
      return null;
    }
  } else if (Array.isArray(ids) && ids.length > 0) {
    return String(ids[0]);
  }
  return null;
}

/** Fetch the YES-side CLOB token id for a given conditionId via Gamma. */
export async function fetchClobTokenIdByCondition(conditionId: string): Promise<string | null> {
  const params = new URLSearchParams({ conditionId, limit: "1" });
  const res = await fetch(`${GAMMA}/markets?${params.toString()}`, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  const arr = (await res.json()) as Array<Record<string, unknown>>;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return extractClobTokenId(arr[0]);
}

/** Fetch a Polymarket CLOB price history for a token. */
export async function fetchPolymarketHistory(
  tokenId: string,
  range: Range = "max",
): Promise<PricePoint[]> {
  const params = new URLSearchParams({
    market: tokenId,
    interval: range,
    fidelity: String(RANGE_FIDELITY[range]),
  });
  const res = await fetch(`${CLOB}/prices-history?${params.toString()}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { history?: PricePoint[] } | PricePoint[];
  const points = Array.isArray(data) ? data : (data.history ?? []);
  return points.filter(
    (pt) => typeof pt?.t === "number" && typeof pt?.p === "number" && Number.isFinite(pt.p),
  );
}

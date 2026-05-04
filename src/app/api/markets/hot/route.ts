import { getHotMarkets } from "@/lib/repository";
import { sampleHotMarkets } from "@/lib/sample-data";

export const revalidate = 30;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const platform = url.searchParams.get("platform");
  const category = url.searchParams.get("category");
  const query = url.searchParams.get("query");
  const hasFilters = Boolean((platform && platform !== "all") || (category && category !== "all") || query?.trim());
  const markets = await getHotMarkets(limit, {
    platform: platform && platform !== "all" ? platform : undefined,
    category: category && category !== "all" ? category : undefined,
    query: query?.trim() || undefined,
  });
  const useSample = !hasFilters && markets.length === 0;
  return Response.json({ markets: markets.length ? markets : useSample ? sampleHotMarkets : [], sample: useSample });
}

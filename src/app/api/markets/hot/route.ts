import { getHotMarkets } from "@/lib/repository";
import { sampleHotMarkets } from "@/lib/sample-data";

export const revalidate = 30;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const markets = await getHotMarkets(limit);
  return Response.json({ markets: markets.length ? markets : sampleHotMarkets, sample: markets.length === 0 });
}

import { getMarketDetail } from "@/lib/repository";
import { sampleHotMarkets } from "@/lib/sample-data";

export const revalidate = 30;

export async function GET(_: Request, context: { params: Promise<{ platform: string; id: string }> }) {
  const params = await context.params;
  const market = await getMarketDetail(params.platform, decodeURIComponent(params.id));
  const sample = sampleHotMarkets.find((item) => item.platform === params.platform && item.externalId === decodeURIComponent(params.id));
  if (!market && sample) return Response.json({ market: { ...sample, snapshots: sample.snapshot ? [sample.snapshot] : [] }, sample: true });
  if (!market) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ market });
}

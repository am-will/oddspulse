import { Dashboard } from "@/components/dashboard";
import { getConvexSourceHealth, getHotMarkets } from "@/lib/repository";
import { sampleHotMarkets } from "@/lib/sample-data";
import { getSourceHealth } from "@/lib/sources/status";

export const revalidate = 30;

export default async function Page() {
  const [markets, convexSources] = await Promise.all([getHotMarkets(75), getConvexSourceHealth().catch(() => [])]);
  const sources = convexSources.length ? convexSources : getSourceHealth();
  return <Dashboard initialMarkets={markets.length ? markets : sampleHotMarkets} sources={sources} sample={markets.length === 0} />;
}

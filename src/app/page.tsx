import { Dashboard } from "@/components/dashboard";
import { getHotMarkets } from "@/lib/repository";
import { sampleHotMarkets } from "@/lib/sample-data";
import { getSourceHealth } from "@/lib/sources/status";

export const revalidate = 30;

export default async function Page() {
  const markets = await getHotMarkets(75);
  return <Dashboard initialMarkets={markets.length ? markets : sampleHotMarkets} sources={getSourceHealth()} sample={markets.length === 0} />;
}

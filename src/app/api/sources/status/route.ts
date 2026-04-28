import { getSourceHealth } from "@/lib/sources/status";
import { getConvexSourceHealth } from "@/lib/repository";

export const revalidate = 30;

export async function GET() {
  try {
    const sources = await getConvexSourceHealth();
    if (sources.length) return Response.json({ sources });
  } catch {
    // Fall back to local env visibility if Convex is not reachable.
  }
  return Response.json({ sources: getSourceHealth() });
}

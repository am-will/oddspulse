import { getSourceHealth } from "@/lib/sources/status";

export const revalidate = 30;

export async function GET() {
  return Response.json({ sources: getSourceHealth() });
}

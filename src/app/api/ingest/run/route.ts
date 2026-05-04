import { runConvexIngest } from "@/lib/repository";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const token = process.env.CRON_SECRET;
  if (!token || auth !== `Bearer ${token}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runConvexIngest();
  return Response.json({ ok: true, result });
}

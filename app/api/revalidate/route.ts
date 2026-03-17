import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// This endpoint is called by Vercel Cron every day at 08:00 UTC
// It revalidates the dashboard page so fresh data is served
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  // In production, Vercel Cron passes a secret header automatically
  // You can also add CRON_SECRET env var for extra protection
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidatePath("/");

  return NextResponse.json({
    revalidated: true,
    timestamp: new Date().toISOString(),
  });
}

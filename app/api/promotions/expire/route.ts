import { NextRequest, NextResponse } from "next/server";
import { expirePromotions } from "@/lib/services/ranking-engine";

export async function POST(req: NextRequest) {
  // Vercel cron or external call
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET || "cron_secret"}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await expirePromotions();
  return NextResponse.json({ ok: true, expired: result });
}

// Also accessible via GET for Vercel cron
export async function GET(req: NextRequest) {
  const result = await expirePromotions();
  return NextResponse.json({ ok: true, expired: result });
}

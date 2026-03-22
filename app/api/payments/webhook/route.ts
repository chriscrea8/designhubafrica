import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateWebhookSignature } from "@/lib/payments";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("x-paystack-signature") || "";
    if (!validateWebhookSignature(body, sig)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    const event = JSON.parse(body);
    if (event.event === "charge.success") {
      const { metadata, reference } = event.data;
      if (metadata?.orderId) await db.order.update({ where: { id: metadata.orderId }, data: { status: "confirmed", paymentRef: reference, paidAt: new Date() } });
    }
    return NextResponse.json({ received: true });
  } catch (e) { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
}

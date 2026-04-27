import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateWebhookSignature } from "@/lib/payments";
import { depositToEscrow, getOrCreateEscrow } from "@/lib/services/escrow";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get("x-paystack-signature") || "";
    if (!validateWebhookSignature(body, sig)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

    const event = JSON.parse(body);
    const { metadata, reference, amount } = event.data || {};
    const amountNaira = Math.round((amount || 0) / 100);

    if (event.event === "charge.success") {
      // Escrow milestone funding
      if (metadata?.milestoneId && metadata?.projectId) {
        await getOrCreateEscrow(metadata.projectId, metadata.userId);
        await depositToEscrow({ projectId: metadata.projectId, milestoneId: metadata.milestoneId, amount: amountNaira, paymentRef: reference }).catch(() => {});
      }

      // Consultation payment
      if (metadata?.consultationId) {
        await db.consultation.update({ where: { id: metadata.consultationId }, data: { status: "PAID", paymentRef: reference } });
        const c = await db.consultation.findUnique({ where: { id: metadata.consultationId }, include: { designer: { include: { user: true } } } });
        if (c?.designer?.userId) {
          await db.notification.create({ data: { userId: c.designer.userId, type: "consultation_booked", title: "Consultation Booked!", message: `A client paid for a ${c.type} consultation with you.`, link: "/designer-consultations" } });
        }
      }

      // Featured listing payment
      if (metadata?.type === "featured_listing" && metadata?.designerId) {
        const days = metadata.days || 7;
        const endDate = new Date(); endDate.setDate(endDate.getDate() + days);
        await db.featuredDesigner.upsert({ where: { designerId: metadata.designerId }, create: { designerId: metadata.designerId, startDate: new Date(), endDate, pricePaid: amountNaira, plan: metadata.plan || "STANDARD" }, update: { startDate: new Date(), endDate, pricePaid: amountNaira, plan: metadata.plan || "STANDARD", isActive: true } });
      }

      // Wallet topup
      if (metadata?.type === "wallet_topup" && metadata?.userId) {
        await db.platformTransaction.create({
          data: { type: "WALLET_TOPUP", amount: amountNaira, referenceId: metadata.userId, description: `Wallet funded: ${reference}` },
        });
      }

      // Marketplace order
      if (metadata?.orderId) {
        await db.order.update({ where: { id: metadata.orderId }, data: { status: "confirmed", paymentRef: reference, paidAt: new Date() } });
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[Webhook Error]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

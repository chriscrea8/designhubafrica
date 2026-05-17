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

      // Vendor subscription upgrade
      if (metadata?.type === "vendor_subscription" && metadata?.vendorId) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await db.vendorSubscription.upsert({
          where: { vendorId: metadata.vendorId },
          update: { plan: metadata.plan, listingLimit: metadata.listingLimit, boostCredits: metadata.boostCredits, expiresAt, paystackRef: reference },
          create: { vendorId: metadata.vendorId, plan: metadata.plan, listingLimit: metadata.listingLimit, boostCredits: metadata.boostCredits, expiresAt, paystackRef: reference },
        });
      }

      // Product boost
      if (metadata?.type === "product_boost" && metadata?.productId) {
        const expiresAt = new Date(Date.now() + (metadata.days || 7) * 24 * 60 * 60 * 1000);
        await db.productBoost.create({
          data: { productId: metadata.productId, vendorId: metadata.vendorId || "", type: metadata.boostType || "BOOST", expiresAt, paystackRef: reference, isActive: true },
        });
        // Mark product as featured if FEATURED or HOMEPAGE
        if (["FEATURED","HOMEPAGE"].includes(metadata.boostType)) {
          await db.product.update({ where: { id: metadata.productId }, data: { moderationStatus: metadata.boostType } }).catch(() => {});
        }
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

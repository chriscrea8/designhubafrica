import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const body    = await req.text();
  const sig     = req.headers.get("x-paystack-signature") || "";

  const valid = await verifyWebhookSignature(body, sig);
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let event: any;
  try { event = JSON.parse(body); } catch { return NextResponse.json({ ok: true }); }

  if (event.event !== "charge.success") return NextResponse.json({ ok: true });

  const { reference, metadata, amount } = event.data;
  const grossAmount = amount / 100; // kobo → naira

  // Idempotency: skip if already processed
  const existing = await db.transaction.findFirst({ where: { providerReference: reference } });
  if (existing?.status === "successful") return NextResponse.json({ ok: true });

  const type = metadata?.type;

  try {
    // ── 1. Consultation Booking ────────────────────────────────────
    if (type === "consultation_booking" && metadata?.bookingId) {
      await db.consultationBooking.update({
        where: { id: metadata.bookingId },
        data: { paymentStatus: "PAID", bookingStatus: "CONFIRMED" } as any,
      });
      // Reveal meeting link (if designer has set one)
      const booking = await db.consultationBooking.findUnique({
        where: { id: metadata.bookingId },
        include: { designer: { select: { userId: true } }, package: { select: { title: true } } },
      });
      if (booking) {
        await db.notification.create({ data: { userId: booking.clientId, type: "payment_success", title: "Consultation Confirmed!", message: `Your ${booking.package.title} consultation is confirmed`, link: `/consultations` } }).catch(() => {});
        await db.notification.create({ data: { userId: booking.designer.userId, type: "booking_confirmed", title: "New Booking Paid", message: `A client paid for ${booking.package.title}`, link: `/designer-consultations` } }).catch(() => {});
      }
    }

    // ── 2. Milestone Invoice ───────────────────────────────────────
    if (type === "milestone_invoice" && metadata?.invoiceId) {
      await db.milestoneInvoice.update({
        where: { id: metadata.invoiceId },
        data: { status: "PAID", paidAt: new Date() } as any,
      });
      if (metadata.milestoneId) {
        await db.milestone.update({ where: { id: metadata.milestoneId }, data: { status: "paid", paidAt: new Date() } });
      }
      // Notify designer
      const invoice = await db.milestoneInvoice.findUnique({
        where: { id: metadata.invoiceId },
        include: { designer: { select: { userId: true } }, milestone: { select: { title: true } } },
      });
      if (invoice) {
        await db.notification.create({ data: { userId: invoice.designer.userId, type: "payment_received", title: "Milestone Payment Received", message: `"${invoice.milestone.title}" has been paid — ₦${invoice.netAmount.toLocaleString()} will be settled to your account`, link: `/designer-invoices` } }).catch(() => {});
      }
    }

    // ── 3. Featured designer ────────────────────────────────────────
    if (type === "featured_listing" && metadata?.designerId) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.designerProfile.update({ where: { id: metadata.designerId }, data: { isFeatured: true, featuredUntil: expiresAt } as any });
    }

    // ── 4. Vendor subscription ──────────────────────────────────────
    if (type === "vendor_subscription" && metadata?.vendorId) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.vendorSubscription.upsert({
        where: { vendorId: metadata.vendorId },
        update: { plan: metadata.plan, listingLimit: metadata.listingLimit, boostCredits: metadata.boostCredits, expiresAt, paystackRef: reference },
        create: { vendorId: metadata.vendorId, plan: metadata.plan, listingLimit: metadata.listingLimit, boostCredits: metadata.boostCredits, expiresAt, paystackRef: reference },
      });
    }

    // ── 5. Product boost ────────────────────────────────────────────
    if (type === "product_boost" && metadata?.productId) {
      const expiresAt = new Date(Date.now() + (metadata.days || 7) * 24 * 60 * 60 * 1000);
      await db.productBoost.create({ data: { productId: metadata.productId, vendorId: metadata.vendorId || "", type: metadata.boostType || "BOOST", expiresAt, paystackRef: reference, isActive: true } });
    }

    // ── Update transaction status ───────────────────────────────────
    await db.transaction.updateMany({
      where: { providerReference: reference },
      data: { status: "successful" } as any,
    });

    // ── 6. Promotion payment (boost/featured_store) ───────────────────────
    if (type?.startsWith("promo_")) {
      const { activatePromotion } = await import("@/lib/services/promotion-billing");
      await activatePromotion(reference).catch(() => {});
    }

  } catch (err) {
    console.error("[Webhook Error]", err);
    // Don't throw — return 200 so Paystack doesn't retry infinitely
  }

  return NextResponse.json({ ok: true });
}

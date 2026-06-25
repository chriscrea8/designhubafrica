import { db } from "@/lib/db";
import { createCheckout, generateReference, verifyPayment } from "@/lib/payments";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://designhubafrica.vercel.app";

export async function initiatePromotion(params: {
  vendorId: string;
  vendorEmail: string;
  type: "BOOST" | "FEATURED_STORE" | "ADVERTISEMENT" | "SUBSCRIPTION";
  planId?: string;
  productId?: string;
  amount: number;
  metadata: Record<string, any>;
}) {
  const reference = generateReference(`promo_${params.type.toLowerCase()}`);
  const callbackUrl = `${APP_URL}/vendor-growth?promo=success&ref=${reference}`;

  const txn = await db.promotionTransaction.create({
    data: {
      vendorId:         params.vendorId,
      amount:           params.amount,
      paymentProvider:  "paystack",
      paymentReference: reference,
      transactionType:  params.type,
      metadata:         params.metadata,
    } as any,
  });

  const checkout = await createCheckout({
    email:       params.vendorEmail,
    amount:      Math.round(params.amount * 100), // kobo
    reference,
    callbackUrl,
    metadata: { type: `promo_${params.type.toLowerCase()}`, vendorId: params.vendorId, ...params.metadata },
  });

  return { checkoutUrl: checkout.authorizationUrl, reference, txnId: txn.id };
}

export async function activatePromotion(reference: string) {
  const txn = await db.promotionTransaction.findFirst({ where: { paymentReference: reference } } as any);
  if (!txn || txn.status === "successful") return null;

  const verified = await verifyPayment(reference);
  if (verified.status !== "success") return null;

  await db.promotionTransaction.update({ where: { id: txn.id }, data: { status: "successful" } as any });

  const meta = txn.metadata as any;
  const now = new Date();

  if (txn.transactionType === "BOOST" && meta?.productId && meta?.planId) {
    const plan = await db.promotionPlan.findUnique({ where: { id: meta.planId } });
    if (plan) {
      const endDate = new Date(now.getTime() + plan.durationDays * 86400000);
      const pp = await db.promotedProduct.create({
        data: { productId: meta.productId, vendorId: txn.vendorId, promotionPlanId: meta.planId, boostScore: plan.boostScore, startDate: now, endDate, status: "ACTIVE", paymentReference: reference } as any,
      });
      // Notify
      const vp = await db.vendorProfile.findUnique({ where: { id: txn.vendorId }, select: { userId: true } });
      if (vp) db.notification.create({ data: { userId: vp.userId, type: "promotion_activated", title: "Boost Activated! 🚀", message: `Your product has been boosted for ${plan.durationDays} days`, link: "/vendor-growth" } }).catch(()=>{});
      return pp;
    }
  }

  if (txn.transactionType === "FEATURED_STORE" && meta?.durationDays) {
    const endDate = new Date(now.getTime() + meta.durationDays * 86400000);
    return db.featuredStore.create({
      data: { vendorId: txn.vendorId, startDate: now, endDate, status: "ACTIVE", paymentReference: reference } as any,
    });
  }

  return null;
}

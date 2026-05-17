import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

const PLANS = {
  FREE:    { price: 0,      listingLimit: 5,   boostCredits: 0,  label: "Free",    description: "Get started with 5 product listings" },
  PRO:     { price: 15000,  listingLimit: 50,  boostCredits: 3,  label: "Pro",     description: "50 listings + 3 monthly boost credits" },
  PREMIUM: { price: 35000,  listingLimit: 999, boostCredits: 10, label: "Premium", description: "Unlimited listings + 10 boosts + homepage placement" },
};

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Vendor profile not found", 404);
    const sub = await db.vendorSubscription.findUnique({ where: { vendorId: profile.id } });
    return apiSuccess({ subscription: sub || { plan: "FREE", listingLimit: 5, boostCredits: 0 }, plans: PLANS });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { plan } = await req.json();
    if (!PLANS[plan as keyof typeof PLANS]) return apiError("Invalid plan", 400);

    const profile = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Vendor profile not found", 404);

    const planData = PLANS[plan as keyof typeof PLANS];

    if (plan === "FREE") {
      const sub = await db.vendorSubscription.upsert({
        where: { vendorId: profile.id },
        update: { plan: "FREE", listingLimit: 5, boostCredits: 0, expiresAt: null },
        create: { vendorId: profile.id, plan: "FREE", listingLimit: 5, boostCredits: 0 },
      });
      return apiSuccess(sub);
    }

    // Initialize Paystack payment for paid plans
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
    const reference = `vendor_plan_${profile.id}_${Date.now()}`;
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user!.email,
        amount: planData.price * 100,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://designhubafrica.vercel.app"}/vendor-dashboard?upgraded=true`,
        metadata: { vendorId: profile.id, plan, type: "vendor_subscription", listingLimit: planData.listingLimit, boostCredits: planData.boostCredits },
      }),
    });
    const json = await res.json();
    if (!json.status) return apiError(json.message || "Payment initialization failed", 400);
    return apiSuccess({ authorizationUrl: json.data.authorization_url, reference });
  });
}

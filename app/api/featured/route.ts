import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
const FEATURED_PLANS = { STANDARD: { price: 25000, days: 7, label: "7 Days Featured" }, PREMIUM: { price: 70000, days: 30, label: "30 Days Featured" } };

export async function GET() {
  return withErrorHandling(async () => {
    const now = new Date();
    const featured = await db.featuredDesigner.findMany({ where: { isActive: true, endDate: { gt: now } }, include: { designer: { include: { user: { select: { id: true, firstName: true, lastName: true, location: true, image: true, isVerified: true } }, _count: { select: { reviews: true } } } } }, orderBy: { plan: "desc" } });
    return apiSuccess(featured.map(f => f.designer));
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { plan } = await req.json();
    const planConfig = FEATURED_PLANS[plan as keyof typeof FEATURED_PLANS];
    if (!planConfig) return apiError("Invalid plan", 400);
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Profile not found", 404);
    const reference = `featured_${profile.id}_${Date.now()}`;
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST", headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: user!.email, amount: planConfig.price * 100, reference, callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/designer-settings?featured=true`, metadata: { designerId: profile.id, plan, type: "featured_listing", days: planConfig.days } }),
    });
    const json = await res.json();
    if (!json.status) return apiError("Payment failed", 400);
    return apiSuccess({ authorizationUrl: json.data.authorization_url, reference: json.data.reference, plan: planConfig });
  });
}

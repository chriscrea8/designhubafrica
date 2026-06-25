import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

const BOOST_TYPES = {
  BOOST:    { price: 3000,  days: 7,  label: "Standard Boost",    desc: "Appear higher in search results for 7 days" },
  FEATURED: { price: 8000,  days: 14, label: "Featured Product",  desc: "Featured badge + priority placement for 14 days" },
  HOMEPAGE: { price: 20000, days: 7,  label: "Homepage Spotlight", desc: "Featured on marketplace homepage for 7 days" },
};

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { productId, boostType } = await req.json();
    if (!productId || !BOOST_TYPES[boostType as keyof typeof BOOST_TYPES]) return apiError("productId and boostType (BOOST|FEATURED|HOMEPAGE) required", 400);

    const product = await db.product.findUnique({ where: { id: productId }, include: { vendor: { select: { userId: true, id: true } } } });
    if (!product) return apiError("Product not found", 404);
    if (product.vendor?.userId !== user!.id) return apiError("Not your product", 403);

    const boost = BOOST_TYPES[boostType as keyof typeof BOOST_TYPES];
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
    const reference = `boost_${productId}_${boostType}_${Date.now()}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user!.email,
        amount: boost.price * 100,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/products?boosted=true`,
        metadata: { productId, vendorId: product.vendor?.id, boostType, days: boost.days, type: "product_boost" },
      }),
    });
    const json = await res.json();
    if (!json.status) return apiError(json.message || "Payment failed", 400);
    return apiSuccess({ authorizationUrl: json.data.authorization_url, reference, boost });
  });
}

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    // Return homepage featured products
    const now = new Date();
    const boosts = await db.productBoost.findMany({
      where: { type: "HOMEPAGE", isActive: true, expiresAt: { gt: now } },
      include: { product: { include: { vendor: { select: { storeName: true, storeImage: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    return apiSuccess(boosts.map((b: any) => b.product));
  });
}

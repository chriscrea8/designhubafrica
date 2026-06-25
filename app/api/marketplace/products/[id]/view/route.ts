import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackJourney, createLead } from "@/lib/services/marketplace-tracking";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireAuth().catch(() => ({ user: null, error: null }));
    await db.product.update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } }).catch(()=>{});
    if (user?.id) {
      trackJourney(user.id, "VIEWED_PRODUCT", "product", params.id);
      const product = await db.product.findUnique({ where: { id: params.id }, select: { vendorId: true } });
      if (product) createLead({ sourceType: "PRODUCT_VIEW", userId: user.id, vendorId: product.vendorId, productId: params.id });
    }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ ok: true }); }
}

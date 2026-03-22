import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verifyPayment } from "@/lib/payments";
import { db } from "@/lib/db";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error } = await requireAuth();
    if (error) return error;
    const ref = new URL(req.url).searchParams.get("reference");
    if (!ref) return apiError("Reference required", 400);
    const result = await verifyPayment(ref);
    if (!result.status || result.data.status !== "success") return apiError("Verification failed", 400);
    if (result.data.metadata?.orderId) await db.order.update({ where: { id: result.data.metadata.orderId }, data: { status: "confirmed", paymentRef: ref, paidAt: new Date() } });
    return apiSuccess({ verified: true, reference: ref, amount: result.data.amount / 100 });
  });
}

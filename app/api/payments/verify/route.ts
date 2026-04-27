import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { verifyPayment } from "@/lib/payments";
import { db } from "@/lib/db";
import { depositToEscrow, getOrCreateEscrow } from "@/lib/services/escrow";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const ref = new URL(req.url).searchParams.get("reference");
    if (!ref) return apiError("Reference required", 400);
    const result = await verifyPayment(ref);
    if (!result.status || result.data.status !== "success") return apiError("Verification failed", 400);

    const metadata = result.data.metadata || {};
    const amountNaira = Math.round(result.data.amount / 100);

    // Handle order payment
    if (metadata.orderId) {
      await db.order.update({ where: { id: metadata.orderId }, data: { status: "confirmed", paymentRef: ref, paidAt: new Date() } });
    }

    // Handle escrow milestone funding
    if (metadata.milestoneId && metadata.projectId) {
      try {
        await getOrCreateEscrow(metadata.projectId, metadata.userId || user!.id);
        await depositToEscrow({ projectId: metadata.projectId, milestoneId: metadata.milestoneId, amount: amountNaira, paymentRef: ref });
      } catch (e: any) {
        console.log("[Verify] Escrow deposit:", e.message); // May already be processed by webhook
      }
    }

    return apiSuccess({ verified: true, reference: ref, amount: amountNaira });
  });
}

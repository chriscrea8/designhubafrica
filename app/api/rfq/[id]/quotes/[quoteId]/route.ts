import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { createLead } from "@/lib/services/marketplace-tracking";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; quoteId: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const rfq = await db.rFQ.findFirst({ where: { id: params.id, clientId: user!.id } });
    if (!rfq) return apiError("Not authorized", 403);
    const { action } = await req.json(); // accept | decline
    const newStatus = action === "accept" ? "ACCEPTED" : "DECLINED";
    const quote = await db.vendorQuote.update({ where: { id: params.quoteId }, data: { status: newStatus } as any });

    if (action === "accept") {
      await db.rFQ.update({ where: { id: params.id }, data: { status: "ACCEPTED" } as any });
      createLead({ sourceType: "QUOTE_ACCEPTED", userId: user!.id, rfqId: params.id, vendorId: quote.vendorId });
      const vendor = await db.vendorProfile.findUnique({ where: { id: quote.vendorId }, select: { userId: true } });
      if (vendor) await db.notification.create({ data: { userId: vendor.userId, type: "quote_accepted", title: "Quote Accepted! 🎉", message: `Your quote on "${rfq.title}" was accepted`, link: `/vendor-rfqs` } }).catch(()=>{});
    }
    return apiSuccess(quote);
  });
}

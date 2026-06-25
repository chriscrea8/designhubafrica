import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { genQuoteNumber, createLead } from "@/lib/services/marketplace-tracking";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const vendor = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!vendor) return apiError("Vendor profile required", 403);

    const rfq = await db.rFQ.findUnique({ where: { id: params.id }, select: { id: true, clientId: true, title: true } });
    if (!rfq) return apiError("RFQ not found", 404);

    // Check not already quoted
    const existing = await db.vendorQuote.findFirst({ where: { rfqId: params.id, vendorId: vendor.id } } as any);
    if (existing) return apiError("Already quoted on this RFQ", 400);

    const { message, estimatedPriceMin, estimatedPriceMax, estimatedDelivery, validUntil } = await req.json();
    if (!message) return apiError("message required", 400);

    const started = rfq ? await db.rFQ.findUnique({ where: { id: params.id }, select: { createdAt: true } }) : null;
    const responseTimeHours = started ? (Date.now() - new Date(started.createdAt).getTime()) / 3600000 : null;

    const quote = await db.vendorQuote.create({
      data: {
        quoteNumber: genQuoteNumber(),
        rfqId: params.id,
        vendorId: vendor.id,
        message,
        estimatedPriceMin: estimatedPriceMin ? parseFloat(estimatedPriceMin) : null,
        estimatedPriceMax: estimatedPriceMax ? parseFloat(estimatedPriceMax) : null,
        estimatedDelivery: estimatedDelivery || null,
        validUntil: validUntil ? new Date(validUntil) : null,
        responseTimeHours,
        status: "SUBMITTED",
      } as any,
    });

    // Update RFQ status + notify client
    await db.rFQ.update({ where: { id: params.id }, data: { status: "QUOTED" } as any });
    await db.notification.create({ data: { userId: rfq.clientId, type: "quote_received", title: "Quote Received", message: `A vendor quoted on your RFQ: ${rfq.title}`, link: `/rfq/${params.id}` } }).catch(()=>{});

    createLead({ sourceType: "QUOTE_ACCEPTED", vendorId: vendor.id, rfqId: params.id });

    return apiSuccess(quote, 201);
  });
}

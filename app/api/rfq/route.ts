import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";
import { createLead, genRFQNumber } from "@/lib/services/marketplace-tracking";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const url = new URL(req.url);
    const mine   = url.searchParams.get("mine");
    const vendor = url.searchParams.get("vendor");
    const status = url.searchParams.get("status");

    let where: any = {};

    if (mine === "true") {
      where.clientId = user!.id;
    } else if (vendor === "true") {
      // Vendor sees open RFQs submitted to them or general marketplace RFQs
      const vProfile = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
      if (!vProfile) return apiError("Vendor profile required", 403);
      where = { OR: [{ vendorId: vProfile.id }, { vendorId: null, status: "SUBMITTED" }] };
    } else if (user!.role === "ADMIN") {
      if (status) where.status = status;
    } else {
      return apiError("Specify mine=true or vendor=true", 400);
    }

    const [items, total] = await Promise.all([
      db.rFQ.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: {
          client:  { select: { firstName: true, lastName: true, image: true } },
          product: { select: { name: true, images: true } },
          _count:  { select: { quotes: true } },
        },
      } as any),
      db.rFQ.count({ where }),
    ]);
    return paginatedResponse(items, total, page, limit);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const { title, description, quantity, budgetMin, budgetMax, deliveryLocation, requiredDate, productId, vendorId } = body;
    if (!title || !description) return apiError("title and description required", 400);

    const rfq = await db.rFQ.create({
      data: {
        rfqNumber: genRFQNumber(),
        clientId: user!.id,
        title, description,
        quantity:         quantity         || null,
        budgetMin:        budgetMin        ? parseFloat(budgetMin) : null,
        budgetMax:        budgetMax        ? parseFloat(budgetMax) : null,
        deliveryLocation: deliveryLocation || null,
        requiredDate:     requiredDate     ? new Date(requiredDate) : null,
        productId:        productId        || null,
        vendorId:         vendorId         || null,
        status: "SUBMITTED",
      } as any,
    });

    // Auto-create lead
    createLead({ sourceType: "RFQ_SUBMITTED", userId: user!.id, rfqId: rfq.id, productId: productId||undefined, vendorId: vendorId||undefined });

    // Notify vendor if targeted
    if (vendorId) {
      const vendor = await db.vendorProfile.findUnique({ where: { id: vendorId }, select: { userId: true } });
      if (vendor) {
        await db.notification.create({ data: { userId: vendor.userId, type: "new_rfq", title: "New RFQ Received", message: `${title}`, link: `/vendor-rfqs` } }).catch(()=>{});
      }
    }
    return apiSuccess(rfq, 201);
  });
}

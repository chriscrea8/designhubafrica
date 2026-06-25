import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const vendor = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!vendor) return apiError("Vendor profile required", 403);
    const { page, limit, skip } = getSearchParams(req);
    const url  = new URL(req.url);
    const tab  = url.searchParams.get("tab") || "open"; // open | quoted | mine

    let where: any;
    if (tab === "mine") {
      // RFQs the vendor already quoted on
      where = { quotes: { some: { vendorId: vendor.id } } };
    } else if (tab === "open") {
      // Open RFQs not yet quoted by this vendor
      where = { status: "SUBMITTED", quotes: { none: { vendorId: vendor.id } } };
    } else {
      where = { status: "QUOTED" };
    }

    const [items, total] = await Promise.all([
      db.rFQ.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: { client: { select: { firstName: true, lastName: true } }, product: { select: { name: true } }, _count: { select: { quotes: true } } },
      } as any),
      db.rFQ.count({ where }),
    ]);
    return paginatedResponse(items, total, page, limit);
  });
}

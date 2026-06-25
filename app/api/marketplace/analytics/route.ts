import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role === "ADMIN") {
      // Admin analytics
      const [products, vendors, rfqs, leads, recentLeads] = await Promise.all([
        db.product.count({ where: { moderationStatus: "PUBLISHED" } }),
        db.vendorProfile.count({ where: { approvalStatus: "APPROVED" } }),
        db.rFQ.count(),
        db.marketplaceLead.count(),
        db.marketplaceLead.findMany({ take: 20, orderBy: { createdAt: "desc" }, include: { vendor: { select: { storeName: true } }, product: { select: { name: true } } } } as any),
      ]);
      const leadsByType = await db.marketplaceLead.groupBy({ by: ["sourceType" as any], _count: { id: true } });
      return apiSuccess({ products, vendors, rfqs, leads, recentLeads, leadsByType });
    }

    // Vendor analytics
    const vendor = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!vendor) return apiError("Vendor profile required", 403);
    const [productCount, savedCount, inquiryCount, rfqCount, quoteCount, acceptedQuotes, leads] = await Promise.all([
      db.product.count({ where: { vendorId: vendor.id } }),
      db.savedProduct.count({ where: { product: { vendorId: vendor.id } } } as any),
      db.productInquiry.count({ where: { vendorId: vendor.id } }),
      db.rFQ.count({ where: { vendorId: vendor.id } }),
      db.vendorQuote.count({ where: { vendorId: vendor.id } }),
      db.vendorQuote.count({ where: { vendorId: vendor.id, status: "ACCEPTED" } }),
      db.marketplaceLead.findMany({ where: { vendorId: vendor.id }, orderBy: { createdAt: "desc" }, take: 10 } as any),
    ]);
    const acceptanceRate = quoteCount > 0 ? Math.round((acceptedQuotes / quoteCount) * 100) : 0;
    return apiSuccess({ productCount, savedCount, inquiryCount, rfqCount, quoteCount, acceptedQuotes, acceptanceRate, leads });
  });
}

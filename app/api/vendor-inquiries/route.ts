import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const vendor = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!vendor) return apiError("Vendor profile not found", 403);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const inquiries = await db.productInquiry.findMany({
      where: { vendorId: vendor.id, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, images: true } },
        user:    { select: { firstName: true, lastName: true, email: true, image: true } },
      },
    } as any);
    return apiSuccess(inquiries);
  });
}

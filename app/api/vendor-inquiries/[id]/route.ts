import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const vendor = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!vendor) return apiError("Not authorized", 403);
    const { response, status } = await req.json();
    const inquiry = await db.productInquiry.findFirst({ where: { id: params.id, vendorId: vendor.id } } as any);
    if (!inquiry) return apiError("Not found", 404);
    const updated = await db.productInquiry.update({
      where: { id: params.id },
      data: { response: response||null, status: status||"RESPONDED" } as any,
    });
    // Notify buyer
    if (response) {
      await db.notification.create({ data: { userId: inquiry.userId, type: "inquiry_response", title: "Vendor Replied to Your Inquiry", message: response.slice(0, 80), link: `/marketplace` } }).catch(() => {});
    }
    return apiSuccess(updated);
  });
}

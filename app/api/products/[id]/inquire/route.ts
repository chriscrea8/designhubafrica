import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { message } = await req.json();
    if (!message?.trim()) return apiError("Message required", 400);

    const product = await db.product.findUnique({
      where: { id: params.id },
      select: { id: true, vendorId: true, name: true },
    });
    if (!product) return apiError("Product not found", 404);

    const inquiry = await db.productInquiry.create({
      data: { productId: product.id, vendorId: product.vendorId, userId: user!.id, message } as any,
    });

    // Notify vendor
    const vendor = await db.vendorProfile.findUnique({ where: { id: product.vendorId }, select: { userId: true } });
    if (vendor) {
      await db.notification.create({ data: { userId: vendor.userId, type: "product_inquiry", title: "New Product Inquiry", message: `Someone inquired about: ${product.name}`, link: `/vendor-inquiries` } }).catch(() => {});
    }

    return apiSuccess(inquiry, 201);
  });
}

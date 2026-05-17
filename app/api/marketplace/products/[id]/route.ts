import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        vendor: { select: { id: true, storeName: true, storeImage: true, storeDescription: true, approvalStatus: true, avgRating: true, totalReviews: true, _count: { select: { products: true } } } },
      },
    });
    if (!product) return apiError("Product not found", 404);
    return apiSuccess(product);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    const product = await db.product.findUnique({ where: { id: params.id }, include: { vendor: { select: { userId: true } } } });
    if (!product) return apiError("Not found", 404);

    const isOwner = product.vendor?.userId === user!.id;
    const isAdmin = user!.role === "ADMIN";
    if (!isOwner && !isAdmin) return apiError("Not authorized", 403);

    const body = await req.json();

    // Admin-only fields
    if (!isAdmin) {
      delete body.isApproved;
      delete body.moderationStatus;
      delete body.moderationNote;
    }

    const updated = await db.product.update({ where: { id: params.id }, data: { ...body, updatedAt: new Date() } });
    return apiSuccess(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const product = await db.product.findUnique({ where: { id: params.id }, include: { vendor: { select: { userId: true } } } });
    if (!product) return apiError("Not found", 404);
    if (product.vendor?.userId !== user!.id && user!.role !== "ADMIN") return apiError("Not authorized", 403);
    await db.product.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const saved = await db.savedProduct.findMany({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          include: { vendor: { select: { storeName: true, storeImage: true } } },
        },
      },
    });
    return apiSuccess(saved.map((s: any) => s.product));
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { productId } = await req.json();
    const existing = await db.savedProduct.findUnique({
      where: { userId_productId: { userId: user!.id, productId } },
    });
    if (existing) {
      await db.savedProduct.delete({ where: { id: existing.id } });
      return apiSuccess({ saved: false });
    }
    await db.savedProduct.create({ data: { userId: user!.id, productId } });
    return apiSuccess({ saved: true });
  });
}

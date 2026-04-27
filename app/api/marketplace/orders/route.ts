import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createOrderSchema } from "@/lib/validations";
import { parseBody, apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const where = user!.role === "ADMIN" ? {} : { userId: user!.id };
    const [orders, total] = await Promise.all([
      db.order.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { items: { include: { product: { select: { name: true, images: true } } } } } }),
      db.order.count({ where }),
    ]);
    return paginatedResponse(orders, total, page, limit);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    const { data, error } = await parseBody(req, createOrderSchema);
    if (error) return error;
    let totalAmount = 0;
    const items: { productId: string; quantity: number; price: number }[] = [];
    for (const item of data!.items) {
      const product = await db.product.findUnique({ where: { id: item.productId } });
      if (!product || !product.inStock) return apiError(`Product unavailable`, 400);
      totalAmount += product.price * item.quantity;
      items.push({ productId: item.productId, quantity: item.quantity, price: product.price });
    }
    const order = await db.order.create({ data: { userId: user!.id, totalAmount, shippingAddress: data!.shippingAddress, items: { create: items } }, include: { items: true } });
    return apiSuccess(order, 201);
  });
}

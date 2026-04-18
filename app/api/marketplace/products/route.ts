import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createProductSchema } from "@/lib/validations";
import { parseBody, apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { page, limit, skip, search } = getSearchParams(req);
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const where: any = { isApproved: true, inStock: true };
    if (category && category !== "all") where.category = category;
    if (search) where.name = { contains: search, mode: "insensitive" };
    const [products, total] = await Promise.all([
      db.product.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { vendor: { include: { user: { select: { firstName: true, lastName: true } } } } } }),
      db.product.count({ where }),
    ]);
    return paginatedResponse(products, total, page, limit);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    const vendor = await db.vendorProfile.findUnique({ where: { userId: user!.id } });
    if (!vendor) return apiError("Vendor profile not found", 404);
    const { data, error } = await parseBody(req, createProductSchema);
    if (error) return error;
    const product = await db.product.create({ data: { ...data!, vendorId: vendor.id, inStock: (data!.stockCount || 0) > 0 } });
    return apiSuccess(product, 201);
  });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const url = new URL(req.url);
    const { page, limit, skip, search } = getSearchParams(req);
    const category = url.searchParams.get("category");
    const vendorId = url.searchParams.get("vendorId");
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const sort      = url.searchParams.get("sort") || "newest";
    const condition = url.searchParams.get("condition"); // new | used | refurbished
    const inStock   = url.searchParams.get("inStock");
    const myStore  = url.searchParams.get("myStore");

    const where: any = { isApproved: true, inStock: true };

    if (myStore === "true") {
      // Vendor viewing their own products — skip approval filter
      const { error, user } = await requireAuth();
      if (error) return error;
      const profile = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
      if (!profile) return apiSuccess({ items: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      delete where.isApproved;
      where.vendorId = profile.id;
    }

    if (category) where.category = { contains: category, mode: "insensitive" };
    if (vendorId) where.vendorId = vendorId;
    if (search) where.OR = [
      { name:        { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { material:    { contains: search, mode: "insensitive" } },
      { color:       { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
    if (minPrice)   where.price   = { ...(where.price || {}), gte: parseInt(minPrice) };
    if (condition)  where.condition = condition;
    if (inStock === "true") where.inStock = true;
    if (maxPrice) where.price = { ...(where.price || {}), lte: parseInt(maxPrice) };

    const orderBy: any = sort === "price_low" ? { price: "asc" } : sort === "price_high" ? { price: "desc" } : { createdAt: "desc" };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where, skip, take: limit, orderBy,
        include: { vendor: { select: { id: true, storeName: true, storeImage: true, approvalStatus: true } } },
      }),
      db.product.count({ where }),
    ]);
    return paginatedResponse(products, total, page, limit);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "VENDOR" && user!.role !== "ADMIN") return apiError("Vendor account required", 403);

    const profile = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true, approvalStatus: true } });
    if (!profile) return apiError("Vendor profile not found. Complete store setup first.", 404);

    const body = await req.json();
    const { name, description, price, category, images, stockCount, dimensions, material, color, tags, deliveryMethod, shippingCost } = body;

    if (!name || !description || !price || !category) return apiError("name, description, price, and category are required", 400);
    if (price < 1) return apiError("Price must be greater than 0", 400);
    if (images?.length === 0) return apiError("At least one product image required", 400);

    const product = await db.product.create({
      data: {
        vendorId: profile.id,
        name: name.trim(),
        description: description.trim(),
        price: parseInt(price),
        category,
        images: images || [],
        stockCount: stockCount || 0,
        inStock: (stockCount || 0) > 0,
        dimensions: dimensions || null,
        material: material || null,
        color: color || null,
        tags: tags || [],
        deliveryMethod: deliveryMethod || "delivery",
        shippingCost: shippingCost || 0,
        moderationStatus: "PENDING",
        isApproved: false,
      },
    });

    // Notify admins for moderation
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    for (const admin of admins) {
      await db.notification.create({ data: { userId: admin.id, type: "product_pending", title: "New Product Awaiting Approval", message: `"${name}" submitted by ${profile.id}`, link: "/marketplace-moderation" } }).catch(() => {});
    }

    return apiSuccess(product, 201);
  });
}

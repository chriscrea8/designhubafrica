import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

const SEED_CATEGORIES = [
  { name: "Furniture",              slug: "furniture",              icon: "🪑", sortOrder: 1 },
  { name: "Lighting",               slug: "lighting",               icon: "💡", sortOrder: 2 },
  { name: "Tiles",                  slug: "tiles",                  icon: "🏠", sortOrder: 3 },
  { name: "Paint",                  slug: "paint",                  icon: "🎨", sortOrder: 4 },
  { name: "Kitchen Fittings",       slug: "kitchen-fittings",       icon: "🍳", sortOrder: 5 },
  { name: "Bathroom Fittings",      slug: "bathroom-fittings",      icon: "🚿", sortOrder: 6 },
  { name: "Decor",                  slug: "decor",                  icon: "🖼️", sortOrder: 7 },
  { name: "Construction Materials", slug: "construction-materials", icon: "🧱", sortOrder: 8 },
];

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    // Auto-seed categories if empty
    const count = await db.productCategory.count();
    if (count === 0) {
      await db.productCategory.createMany({ data: SEED_CATEGORIES });
    }
    const categories = await db.productCategory.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      include: {
        children: { where: { isActive: true }, orderBy: { name: "asc" } },
        _count: { select: { products: true } },
      },
    });
    return apiSuccess(categories);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);
    const { name, slug, icon, parentId, sortOrder } = await req.json();
    if (!name || !slug) return apiError("Name and slug required", 400);
    const cat = await db.productCategory.create({ data: { name, slug, icon: icon || "📦", parentId: parentId || null, sortOrder: sortOrder || 99 } as any });
    return apiSuccess(cat, 201);
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);
    const { id, ...data } = await req.json();
    const cat = await db.productCategory.update({ where: { id }, data });
    return apiSuccess(cat);
  });
}

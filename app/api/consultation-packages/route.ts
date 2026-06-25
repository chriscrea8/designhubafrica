import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const url = new URL(req.url);
    const designerId = url.searchParams.get("designerId");
    const { error, user } = await requireAuth();
    if (error) return error;

    // Designer viewing their own packages (includes inactive)
    if (!designerId) {
      const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
      if (!profile) return apiSuccess([]);
      const packages = await db.consultationPackage.findMany({ where: { designerId: profile.id }, orderBy: { price: "asc" } });
      return apiSuccess(packages);
    }

    // Public: only active packages
    const packages = await db.consultationPackage.findMany({ where: { designerId, isActive: true }, orderBy: { price: "asc" } });
    return apiSuccess(packages);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Designer profile required", 403);

    const { title, description, duration, price } = await req.json();
    if (!title || !duration || !price) return apiError("title, duration, price required", 400);
    if (price < 1000) return apiError("Minimum price is ₦1,000", 400);

    const pkg = await db.consultationPackage.create({ data: { designerId: profile.id, title, description: description || null, duration: parseInt(duration), price: parseInt(price) } as any });
    return apiSuccess(pkg, 201);
  });
}

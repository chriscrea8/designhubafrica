import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const saved = await db.savedDesigner.findMany({ where: { userId: user!.id }, orderBy: { createdAt: "desc" }, include: { designer: { include: { user: { select: { id: true, firstName: true, lastName: true, image: true, location: true, isVerified: true } }, _count: { select: { reviews: true } } } } } });
    return apiSuccess(saved.map(s => s.designer));
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { designerId } = await req.json();
    const existing = await db.savedDesigner.findFirst({ where: { userId: user!.id, designerId } });
    if (existing) {
      await db.savedDesigner.delete({ where: { id: existing.id } });
      return apiSuccess({ saved: false });
    }
    await db.savedDesigner.create({ data: { userId: user!.id, designerId } });
    return apiSuccess({ saved: true });
  });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const biz = await db.business.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }], isActive: true },
      include: { owner: { select: { firstName: true, lastName: true, image: true } }, members: { where: { status: "ACTIVE" }, include: { user: { select: { id: true, firstName: true, lastName: true, image: true } } } }, reviews: { include: { client: { select: { firstName: true, lastName: true } } }, take: 10 }, _count: { select: { members: true, reviews: true, projects: true } } },
    } as any);
    if (!biz) return apiError("Business not found", 404);
    return apiSuccess(biz);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const biz = await db.business.findUnique({ where: { id: params.id } });
    if (!biz) return apiError("Not found", 404);
    if (biz.ownerUserId !== user!.id && user!.role !== "ADMIN") return apiError("Not authorized", 403);
    const body = await req.json();
    const { ownerUserId, slug, verificationLevel, verificationStatus, ...safe } = body;
    const updated = await db.business.update({ where: { id: params.id }, data: safe as any });
    return apiSuccess(updated);
  });
}

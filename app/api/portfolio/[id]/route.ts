import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const item = await db.portfolioItem.findUnique({ where: { id: params.id }, include: { designer: { include: { user: { select: { firstName: true, lastName: true, location: true, image: true } } } } } });
    if (!item) return apiError("Not found", 404);
    return apiSuccess(item);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const item = await db.portfolioItem.update({ where: { id: params.id }, data: body });
    return apiSuccess(item);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    await db.portfolioItem.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  });
}

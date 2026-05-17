import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const rels = await db.clientDesignerRelationship.findMany({ where: { OR: [{ clientId: user!.id }, { designerUserId: user!.id }] }, orderBy: { updatedAt: "desc" } });
    return apiSuccess(rels);
  });
}

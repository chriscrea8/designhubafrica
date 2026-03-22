import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const deleteAfter = new Date();
    deleteAfter.setDate(deleteAfter.getDate() + 30);
    await db.user.update({ where: { id: user!.id }, data: { status: "SUSPENDED", deactivatedAt: new Date(), deleteAfter } });
    return apiSuccess({ message: "Account deactivated. You have 30 days to reactivate.", deleteAfter });
  });
}

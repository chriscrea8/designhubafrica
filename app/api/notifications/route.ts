import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, getSearchParams, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const [items, total, unread] = await Promise.all([
      db.notification.findMany({ where: { userId: user!.id }, skip, take: limit, orderBy: { createdAt: "desc" } }),
      db.notification.count({ where: { userId: user!.id } }),
      db.notification.count({ where: { userId: user!.id, isRead: false } }),
    ]);
    return apiSuccess({ items, unread, pagination: { page, limit, total } });
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    await db.notification.updateMany({ where: { userId: user!.id, isRead: false }, data: { isRead: true } });
    return apiSuccess({ success: true });
  });
}

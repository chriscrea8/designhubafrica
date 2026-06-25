import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "PUBLISHED";
    const inspirations = await db.inspiration.findMany({
      where: { ...(status !== "ALL" ? { status } : {}), deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { designer: { include: { user: { select: { firstName: true, lastName: true } } } }, _count: { select: { moodboardItems: true } } },
    });
    return apiSuccess(inspirations);
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);
    const { id, action } = await req.json();
    const data: any = {};
    if (action === "approve")  { data.status = "PUBLISHED"; }
    if (action === "reject")   { data.status = "ARCHIVED"; }
    if (action === "feature")  { data.isFeatured = true; }
    if (action === "unfeature"){ data.isFeatured = false; }
    if (action === "remove")   { data.deletedAt = new Date(); data.status = "ARCHIVED"; }
    const updated = await db.inspiration.update({ where: { id }, data });
    return apiSuccess(updated);
  });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error } = await requireAuth();
    if (error) return error;
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const where: any = { projectId: params.id, ...(type ? { activityType: type } : {}) };
    const logs = await db.projectActivityLog.findMany({
      where, orderBy: { createdAt: "desc" }, take: 50,
      include: { user: { select: { firstName: true, lastName: true, image: true } } },
    } as any);
    return apiSuccess(logs);
  });
}

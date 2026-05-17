import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);

    const url = new URL(req.url);
    const { page, limit, skip, search } = getSearchParams(req);
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");

    const where: any = {};
    if (role && role !== "ALL") where.role = role;
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, firstName: true, lastName: true, email: true, role: true,
          status: true, isVerified: true, location: true, createdAt: true,
          _count: { select: { clientProjects: true } },
        },
      }),
      db.user.count({ where }),
    ]);

    return paginatedResponse(users, total, page, limit);
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);

    const { userId, status, role } = await req.json();
    if (!userId) return apiError("userId required", 400);

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        ...(status && { status }),
        ...(role && { role }),
      },
      select: { id: true, firstName: true, lastName: true, email: true, status: true, role: true },
    });

    return apiSuccess(updated);
  });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { createProjectSchema } from "@/lib/validations";
import { parseBody, apiSuccess, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const where: any = user!.role === "ADMIN" ? {} : { clientId: user!.id };
    const [projects, total] = await Promise.all([
      db.project.findMany({ where, skip, take: limit, orderBy: { updatedAt: "desc" },
        include: { client: { select: { firstName: true, lastName: true } }, designer: { include: { user: { select: { firstName: true, lastName: true } } } }, _count: { select: { tasks: true, proposals: true } } } }),
      db.project.count({ where }),
    ]);
    return paginatedResponse(projects, total, page, limit);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    const { data, error } = await parseBody(req, createProjectSchema);
    if (error) return error;
    const project = await db.project.create({ data: { ...data!, clientId: user!.id, startDate: data!.startDate ? new Date(data!.startDate) : undefined, endDate: data!.endDate ? new Date(data!.endDate) : undefined } });
    return apiSuccess(project, 201);
  });
}

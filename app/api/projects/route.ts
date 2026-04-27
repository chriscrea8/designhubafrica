import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { createProjectSchema } from "@/lib/validations";
import { parseBody, apiSuccess, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");

    let where: any;

    if (user!.role === "ADMIN") {
      where = statusFilter && statusFilter !== "ALL" ? { status: statusFilter } : {};
    } else if (user!.role === "DESIGNER" || user!.role === "ARTISAN") {
      const profile = user!.role === "DESIGNER"
        ? await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } })
        : await db.artisanProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });

      if (statusFilter === "OPEN") {
        // Job board — OPEN projects only, excluding ones they created
        where = { status: "OPEN", clientId: { not: user!.id } };
      } else if (statusFilter && statusFilter !== "ALL") {
        // Specific status — their assigned projects only
        where = profile ? { designerId: profile.id, status: statusFilter } : { id: "NONE_MATCH" };
      } else {
        // Default: their assigned projects only (NOT all open projects in client dashboard)
        where = profile ? { designerId: profile.id } : { id: "NONE_MATCH" };
      }
    } else {
      // CLIENT (and any other role) — STRICTLY only their own projects
      // This is the critical security gate: clientId must match the logged-in user
      where = { clientId: user!.id };
      if (statusFilter && statusFilter !== "ALL") where.status = statusFilter;
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, location: true, image: true } },
          designer: { include: { user: { select: { id: true, firstName: true, lastName: true, image: true, location: true } } } },
          milestones: { orderBy: { createdAt: "asc" } },
          _count: { select: { proposals: true, milestones: true } },
        },
      }),
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
    const project = await db.project.create({
      data: {
        ...data!, clientId: user!.id, status: "OPEN",
        startDate: data!.startDate ? new Date(data!.startDate) : undefined,
        endDate: data!.endDate ? new Date(data!.endDate) : undefined,
      },
    });
    return apiSuccess(project, 201);
  });
}

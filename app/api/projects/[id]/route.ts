import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { updateProjectSchema } from "@/lib/validations";
import { parseBody, apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const p = await db.project.findUnique({ where: { id: params.id }, include: {
      client: { select: { id: true, firstName: true, lastName: true, image: true } },
      designer: { include: { user: { select: { id: true, firstName: true, lastName: true, image: true } } } },
      tasks: { orderBy: { dueDate: "asc" } }, milestones: { orderBy: { dueDate: "asc" } },
      proposals: { include: { designer: { include: { user: { select: { firstName: true, lastName: true, image: true } } } } } },
      escrowAccount: { include: { transactions: { take: 10, orderBy: { createdAt: "desc" } } } },
    }});
    if (!p) return apiError("Not found", 404);
    return apiSuccess(p);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    const existing = await db.project.findUnique({ where: { id: params.id } });
    if (!existing) return apiError("Not found", 404);
    if (existing.clientId !== user!.id && user!.role !== "ADMIN") return apiError("Forbidden", 403);
    const { data, error } = await parseBody(req, updateProjectSchema);
    if (error) return error;
    const updated = await db.project.update({ where: { id: params.id }, data: { ...data!, startDate: data!.startDate ? new Date(data!.startDate) : undefined, endDate: data!.endDate ? new Date(data!.endDate) : undefined } });
    return apiSuccess(updated);
  });
}

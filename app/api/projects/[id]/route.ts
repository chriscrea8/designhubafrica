import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { updateProjectSchema } from "@/lib/validations";
import { parseBody, apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const project = await db.project.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, location: true, image: true } },
        designer: { include: { user: { select: { id: true, firstName: true, lastName: true, location: true, image: true } } } },
        milestones: { orderBy: { createdAt: "asc" } },
        proposals: { include: { designer: { include: { user: { select: { id: true, firstName: true, lastName: true, image: true, location: true } } } } }, orderBy: { createdAt: "desc" } },
        escrowAccount: { include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } } },
        _count: { select: { tasks: true, proposals: true, milestones: true, projectFiles: true } },
      },
    });
    if (!project) return apiError("Project not found", 404);
    // Increment view count only for designer/artisan views (not client's own project)
    const { user: viewer } = await requireAuth().catch(() => ({ user: null, error: null }));
    if (viewer && (viewer.role === "DESIGNER" || viewer.role === "ARTISAN") && project.clientId !== viewer.id) {
      db.project.update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    }
    return apiSuccess(project);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    const { data, error } = await parseBody(req, updateProjectSchema);
    if (error) return error;
    const project = await db.project.update({ where: { id: params.id }, data: data! });
    return apiSuccess(project);
  });
}

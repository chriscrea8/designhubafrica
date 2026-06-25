import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

const VISIT_TYPES = ["INITIAL_INSPECTION","MEASUREMENT","MATERIAL_SELECTION","PROGRESS_REVIEW","FINAL_HANDOVER"];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error } = await requireAuth();
    if (error) return error;
    const visits = await db.siteVisit.findMany({ where: { projectId: params.id }, orderBy: { visitDate: "asc" }, include: { scheduledByUser: { select: { firstName: true, lastName: true } } } } as any);
    return apiSuccess(visits);
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { visitType, visitDate, notes } = await req.json();
    if (!visitType || !visitDate) return apiError("visitType and visitDate required", 400);
    if (!VISIT_TYPES.includes(visitType)) return apiError("Invalid visitType", 400);

    const project = await db.project.findUnique({ where: { id: params.id }, select: { clientId: true, designerId: true } });
    if (!project) return apiError("Project not found", 404);

    const visit = await db.siteVisit.create({
      data: { projectId: params.id, scheduledBy: user!.id, visitType, visitDate: new Date(visitDate), notes: notes||null } as any,
    });

    // Log activity + notify
    await db.projectActivityLog.create({ data: { projectId: params.id, userId: user!.id, activityType: "SITE_VISIT_SCHEDULED", message: `Site visit scheduled: ${visitType.replace(/_/g," ")} on ${new Date(visitDate).toLocaleDateString("en-NG")}` } } as any);
    const notifyId = user!.id === project.clientId ? project.designerId : project.clientId;
    if (notifyId) await db.notification.create({ data: { userId: notifyId, type: "site_visit", title: "Site Visit Scheduled", message: `${visitType.replace(/_/g," ")} scheduled`, link: `/projects/${params.id}` } }).catch(()=>{});
    return apiSuccess(visit, 201);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { visitId, status, visitDate, notes } = await req.json();
    const visit = await db.siteVisit.findFirst({ where: { id: visitId, projectId: params.id } } as any);
    if (!visit) return apiError("Not found", 404);
    const updated = await db.siteVisit.update({ where: { id: visitId }, data: { status, ...(visitDate ? { visitDate: new Date(visitDate) } : {}), ...(notes !== undefined ? { notes } : {}) } as any });
    await db.projectActivityLog.create({ data: { projectId: params.id, userId: user!.id, activityType: "SITE_VISIT_UPDATED", message: `Site visit ${status?.toLowerCase() || "updated"}` } } as any);
    return apiSuccess(updated);
  });
}

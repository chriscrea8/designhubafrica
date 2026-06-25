import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

const ALLOWED_TYPES = ["pdf","jpg","jpeg","png","webp","docx","xlsx","dwg","zip"];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error } = await requireAuth();
    if (error) return error;
    const deliverables = await db.deliverable.findMany({ where: { projectId: params.id }, orderBy: { createdAt: "desc" }, include: { uploader: { select: { firstName: true, lastName: true } } } } as any);
    return apiSuccess(deliverables);
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { title, description, fileUrl, fileType, milestoneId } = await req.json();
    if (!title || !fileUrl || !fileType) return apiError("title, fileUrl, fileType required", 400);
    const ext = fileType.toLowerCase().replace(".", "");
    if (!ALLOWED_TYPES.includes(ext)) return apiError(`File type not allowed. Allowed: ${ALLOWED_TYPES.join(", ")}`, 400);

    const deliverable = await db.deliverable.create({
      data: { projectId: params.id, uploadedBy: user!.id, title, description: description||null, fileUrl, fileType: ext, milestoneId: milestoneId||null } as any,
    });
    await db.projectActivityLog.create({ data: { projectId: params.id, userId: user!.id, activityType: "DELIVERABLE_SUBMITTED", message: `Deliverable uploaded: ${title}` } } as any);

    const project = await db.project.findUnique({ where: { id: params.id }, select: { clientId: true } });
    if (project) await db.notification.create({ data: { userId: project.clientId, type: "deliverable_uploaded", title: "New Deliverable", message: `Designer uploaded: ${title}`, link: `/projects/${params.id}` } }).catch(()=>{});
    return apiSuccess(deliverable, 201);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { deliverableId, status, clientNotes } = await req.json();
    const updated = await db.deliverable.update({ where: { id: deliverableId }, data: { status, clientNotes: clientNotes||null } as any });
    const msg = status === "APPROVED" ? "Deliverable approved" : `Revision requested on: ${updated.title}`;
    await db.projectActivityLog.create({ data: { projectId: params.id, userId: user!.id, activityType: status === "APPROVED" ? "DELIVERABLE_APPROVED" : "REVISION_REQUESTED", message: msg } } as any);
    return apiSuccess(updated);
  });
}

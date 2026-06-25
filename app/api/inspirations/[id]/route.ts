import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const insp = await db.inspiration.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }], deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        designer: { include: { user: { select: { id: true, firstName: true, lastName: true, image: true, location: true } } } },
      },
    } as any);
    if (!insp) return apiError("Not found", 404);
    db.inspiration.update({ where: { id: insp.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return apiSuccess(insp);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const insp = await db.inspiration.findUnique({ where: { id: params.id }, include: { designer: { select: { userId: true } } } });
    if (!insp) return apiError("Not found", 404);
    const isOwner = insp.designer?.userId === user!.id;
    const isAdmin = user!.role === "ADMIN";
    if (!isOwner && !isAdmin) return apiError("Not authorized", 403);

    const body = await req.json();

    // Extract images — it's a separate relation, not a direct field
    const { images, ...rest } = body;

    // Only admins can feature; owners can change their own status (DRAFT/PUBLISHED/ARCHIVED)
    if (!isAdmin) { delete rest.isFeatured; }

    // Sanitize completionDate: empty string must become null
    if (rest.completionDate === "" || rest.completionDate === null) {
      rest.completionDate = null;
    } else if (rest.completionDate) {
      rest.completionDate = new Date(rest.completionDate);
    }

    const updated = await db.inspiration.update({
      where: { id: params.id },
      data: { ...rest, updatedAt: new Date() } as any,
    });

    // Update image records if provided
    if (Array.isArray(images) && images.length > 0) {
      await db.inspirationImage.deleteMany({ where: { inspirationId: params.id } });
      await db.inspirationImage.createMany({
        data: images.map((url: string, i: number) => ({
          inspirationId: params.id,
          imageUrl: url,
          sortOrder: i,
        })),
      });
    }

    return apiSuccess(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const insp = await db.inspiration.findUnique({ where: { id: params.id }, include: { designer: { select: { userId: true } } } });
    if (!insp) return apiError("Not found", 404);
    if (insp.designer?.userId !== user!.id && user!.role !== "ADMIN") return apiError("Not authorized", 403);
    await db.inspiration.update({ where: { id: params.id }, data: { deletedAt: new Date(), status: "ARCHIVED" } as any });
    return apiSuccess({ deleted: true });
  });
}

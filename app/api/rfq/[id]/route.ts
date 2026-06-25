import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const rfq = await db.rFQ.findUnique({
      where: { id: params.id },
      include: {
        client:      { select: { id: true, firstName: true, lastName: true, image: true } },
        product:     { select: { name: true, images: true, category: true } },
        attachments: true,
        quotes: {
          include: { vendor: { include: { user: { select: { firstName: true, lastName: true, image: true, location: true } } } } },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { quotes: true } },
      },
    } as any);
    if (!rfq) return apiError("Not found", 404);
    // Increment view count (non-blocking)
    db.rFQ.update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } }).catch(()=>{});
    return apiSuccess(rfq);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const rfq = await db.rFQ.findUnique({ where: { id: params.id } });
    if (!rfq) return apiError("Not found", 404);
    if (rfq.clientId !== user!.id && user!.role !== "ADMIN") return apiError("Not authorized", 403);
    const body = await req.json();
    const { status, ...rest } = body;
    const updated = await db.rFQ.update({ where: { id: params.id }, data: { ...rest, ...(status ? { status } : {}) } as any });
    return apiSuccess(updated);
  });
}

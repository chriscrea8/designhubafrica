import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    const contract = await db.contract.findUnique({
      where: { id: params.id },
      include: {
        project: {
          include: {
            milestones: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    });

    if (!contract) return apiError("Contract not found", 404);
    if (contract.clientId !== user!.id && contract.professionalId !== user!.id && user!.role !== "ADMIN") {
      return apiError("Access denied", 403);
    }

    const professional = await db.user.findUnique({ where: { id: contract.professionalId }, select: { firstName: true, lastName: true, email: true, image: true, location: true } });
    const client = await db.user.findUnique({ where: { id: contract.clientId }, select: { firstName: true, lastName: true, email: true, image: true, location: true } });

    return apiSuccess({ ...contract, professional, client });
  });
}

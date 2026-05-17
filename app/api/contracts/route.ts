import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    let where: any;
    if (user!.role === "ADMIN") {
      where = {};
    } else if (user!.role === "DESIGNER") {
      where = { professionalId: user!.id };
    } else {
      where = { clientId: user!.id };
    }

    const contracts = await db.contract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            id: true, title: true, status: true, progress: true,
            milestones: { select: { id: true, title: true, amount: true, status: true } },
          },
        },
      },
    });

    // Attach professional user info
    const enriched = await Promise.all(contracts.map(async (c) => {
      const professional = await db.user.findUnique({ where: { id: c.professionalId }, select: { firstName: true, lastName: true, image: true, email: true } });
      const client = await db.user.findUnique({ where: { id: c.clientId }, select: { firstName: true, lastName: true, image: true, email: true } });
      return { ...c, professional, client };
    }));

    return apiSuccess(enriched);
  });
}

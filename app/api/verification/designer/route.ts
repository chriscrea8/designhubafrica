import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.designerProfile.findUnique({
      where: { userId: user!.id },
      include: { verification: true, _count: { select: { portfolio: true } } },
    });
    if (!profile) return apiError("Not found", 404);
    return apiSuccess({ ...profile.verification, portfolioCount: profile._count?.portfolio || 0 });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.designerProfile.findUnique({
      where: { userId: user!.id },
      select: { id: true, userId: true },
    });
    if (!profile) return apiError("Not found", 404);

    const body = await req.json();
    const step = body.step || "IDENTITY_SUBMITTED";

    const v = await db.designerVerification.upsert({
      where: { designerId: profile.id },
      create: { designerId: profile.id, ...body, step },
      update: { ...body, step },
    });

    // When designer submits for final review — notify all admins
    if (step === "UNDER_REVIEW") {
      // Update designer profile approval status to PENDING
      await db.designerProfile.update({
        where: { id: profile.id },
        data: { approvalStatus: "PENDING" } as any,
      });

      const admins = await db.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      const designerUser = await db.user.findUnique({
        where: { id: user!.id },
        select: { firstName: true, lastName: true },
      });

      for (const admin of admins) {
        await db.notification.create({
          data: {
            userId: admin.id,
            type: "designer_verification",
            title: "Designer Submitted for Review",
            message: `${designerUser?.firstName} ${designerUser?.lastName} submitted their profile for verification`,
            link: "/designer-approvals",
          },
        }).catch(() => {});
      }
    }

    const count = await db.portfolioItem.count({ where: { designerId: profile.id } });
    return apiSuccess({ ...v, portfolioCount: count });
  });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const biz = await db.business.findUnique({ where: { id: params.id } });
    if (!biz || biz.ownerUserId !== user!.id) return apiError("Not authorized", 403);
    const verif = await db.businessVerification.findUnique({ where: { businessId: params.id } });
    return apiSuccess(verif || {});
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const biz = await db.business.findUnique({ where: { id: params.id } });
    if (!biz || biz.ownerUserId !== user!.id) return apiError("Not authorized", 403);
    const body = await req.json();
    const { submit, ...data } = body;

    const verif = await db.businessVerification.upsert({
      where: { businessId: params.id },
      create: { businessId: params.id, ...data, ...(submit ? { status: "PENDING", submittedAt: new Date() } : {}) } as any,
      update: { ...data, ...(submit ? { status: "PENDING", submittedAt: new Date() } : {}) } as any,
    });

    if (submit) {
      await db.business.update({ where: { id: params.id }, data: { verificationStatus: "PENDING" } as any });
      // Notify admins
      const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      for (const admin of admins) {
        await db.notification.create({ data: { userId: admin.id, type: "business_verification", title: "Business Verification Submitted", message: `${biz.businessName} has submitted for verification`, link: "/business-approvals" } }).catch(()=>{});
      }
    }
    return apiSuccess(verif);
  });
}

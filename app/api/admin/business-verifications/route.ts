import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "PENDING";
    const verifs = await db.businessVerification.findMany({
      where: status === "ALL" ? {} : { status },
      include: { business: { select: { id: true, businessName: true, businessType: true, slug: true, ownerUserId: true } } },
      orderBy: { submittedAt: "asc" },
    } as any);
    return apiSuccess(verifs);
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);
    const { verificationId, action, notes, level } = await req.json();

    const statusMap: Record<string,string> = { approve:"APPROVED", reject:"REJECTED", request_info:"RESUBMISSION_REQUIRED" };
    const newStatus = statusMap[action];
    if (!newStatus) return apiError("Invalid action", 400);

    const verif = await db.businessVerification.update({
      where: { id: verificationId },
      data: { status: newStatus, reviewedAt: new Date(), reviewedBy: user!.id, rejectionReason: notes||null, ...(level ? { verificationLevel: level } : {}) } as any,
    });

    // Update business verification fields
    const levelMap: Record<string,string> = { approve: level || "LEVEL_1_IDENTITY_VERIFIED" };
    await db.business.update({
      where: { id: verif.businessId },
      data: { verificationStatus: newStatus, ...(action === "approve" ? { verificationLevel: levelMap.approve } : {}) } as any,
    });

    // Audit log
    await db.verificationAuditLog.create({ data: { verificationId, adminId: user!.id, action, notes: notes||null } } as any);

    // Notify business owner
    const biz = await db.business.findUnique({ where: { id: verif.businessId }, select: { ownerUserId: true, businessName: true } });
    if (biz) {
      await db.notification.create({ data: { userId: biz.ownerUserId, type: "verification_update", title: action === "approve" ? "Verification Approved 🎉" : "Verification Update", message: action === "approve" ? `${biz.businessName} has been verified!` : `Your verification for ${biz.businessName}: ${notes||action}`, link: "/dashboard/business" } }).catch(()=>{});
    }
    return apiSuccess(verif);
  });
}

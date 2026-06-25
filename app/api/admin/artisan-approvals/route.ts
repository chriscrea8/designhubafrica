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
    const verifications = await db.artisanVerification.findMany({
      where: status !== "ALL" ? { status } : {},
      orderBy: { createdAt: "desc" },
      include: {
        artisan: {
          include: { user: { select: { id:true, firstName:true, lastName:true, email:true, createdAt:true } } },
        },
      },
    });
    return apiSuccess(verifications);
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);
    const { artisanId, action, rejectedReason } = await req.json();
    // action: approve | reject | suspend
    const statusMap: Record<string,string> = { approve:"VERIFIED", reject:"REJECTED", suspend:"SUSPENDED" };
    const status = statusMap[action];
    if (!status) return apiError("Invalid action", 400);

    const verification = await db.artisanVerification.update({
      where: { artisanId },
      data: { status, reviewedAt: new Date(), rejectedReason: rejectedReason||null },
    });

    // Update artisan profile approval status
    await db.artisanProfile.update({
      where: { id: artisanId },
      data: { approvalStatus: status } as any,
    });

    // Notify artisan
    const profile = await db.artisanProfile.findUnique({ where: { id: artisanId }, select: { userId: true } });
    if (profile) {
      const msgs: Record<string,string> = { VERIFIED:"Your artisan profile has been verified! You can now receive job requests.", REJECTED:`Your verification was not approved. Reason: ${rejectedReason||"See admin notes"}`, SUSPENDED:"Your artisan account has been suspended." };
      await db.notification.create({ data: { userId: profile.userId, type: "artisan_status", title: `Account ${status.charAt(0)+status.slice(1).toLowerCase()}`, message: msgs[status]||"", link: "/artisan-dashboard" } }).catch(()=>{});
    }

    return apiSuccess(verification);
  });
}

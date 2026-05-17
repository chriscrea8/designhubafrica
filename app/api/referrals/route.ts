import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

// GET — Get user's referral stats
export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    const dbUser = await db.user.findUnique({ where: { id: user!.id }, select: { referralCode: true } });
    const referrals = await db.referral.findMany({ where: { referrerId: user!.id }, orderBy: { createdAt: "desc" } });
    const completed = referrals.filter(r => r.status === "completed" || r.status === "rewarded");
    const totalRewards = referrals.reduce((sum, r) => sum + r.rewardAmount, 0);

    return apiSuccess({
      referralCode: dbUser?.referralCode || "",
      totalReferrals: referrals.length,
      completedReferrals: completed.length,
      totalRewards,
      referrals: referrals.slice(0, 20),
    });
  });
}

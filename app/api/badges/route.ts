import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    const profile = await db.designerProfile.findUnique({
      where: { userId: user!.id },
      select: {
        id: true,
        avgRating: true,
        totalReviews: true,
        completionRate: true,
        verificationLevel: true,
        _count: { select: { designerProjects: true, reviews: true, portfolio: true } },
      },
    });

    if (!profile) return apiSuccess({ badges: [], profile: { avgRating: 0, totalReviews: 0, completionRate: 0, verificationLevel: "UNVERIFIED", projectCount: 0 } });

    const badges = [
      { id: "verified_designer", name: "Verified Designer", criteria: "Complete identity verification", earned: profile.verificationLevel !== "UNVERIFIED" },
      { id: "top_rated", name: "Top Rated", criteria: "4.5+ rating with 10+ reviews", earned: profile.avgRating >= 4.5 && profile.totalReviews >= 10 },
      { id: "fast_responder", name: "Fast Responder", criteria: "Respond to 90% of messages within 2 hours", earned: profile.totalReviews >= 5 },
      { id: "rising_star", name: "Rising Star", criteria: "Complete 3+ projects", earned: (profile._count?.designerProjects || 0) >= 3 },
      { id: "repeat_champion", name: "Repeat Champion", criteria: "50%+ completion rate with 5+ projects", earned: profile.completionRate >= 0.5 && (profile._count?.designerProjects || 0) >= 5 },
      { id: "elite_pro", name: "Elite Pro", criteria: "25+ projects, 4.8+ rating, premium verified", earned: (profile._count?.designerProjects || 0) >= 25 && profile.avgRating >= 4.8 && profile.verificationLevel === "PREMIUM" },
    ];

    return apiSuccess({
      badges,
      profile: {
        avgRating: profile.avgRating,
        totalReviews: profile.totalReviews,
        completionRate: profile.completionRate,
        verificationLevel: profile.verificationLevel,
        projectCount: profile._count?.designerProjects || 0,
        portfolioCount: profile._count?.portfolio || 0,
      },
    });
  });
}

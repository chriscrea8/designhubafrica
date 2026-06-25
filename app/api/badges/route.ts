import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    const url = new URL(req.url);
    const targetDesignerId = url.searchParams.get("designerId");

    // Get the designer profile
    let profile;
    if (targetDesignerId) {
      profile = await db.designerProfile.findUnique({
        where: { id: targetDesignerId },
        select: {
          id: true, avgRating: true, totalReviews: true, completionRate: true,
          verificationLevel: true, approvalStatus: true,
          _count: { select: { designerProjects: true, reviews: true, portfolio: true } },
        },
      });
    } else {
      profile = await db.designerProfile.findUnique({
        where: { userId: user!.id },
        select: {
          id: true, avgRating: true, totalReviews: true, completionRate: true,
          verificationLevel: true, approvalStatus: true,
          _count: { select: { designerProjects: true, reviews: true, portfolio: true } },
        },
      });
    }

    if (!profile) return apiSuccess({ badges: [], stats: {} });

    const projectCount = profile._count?.designerProjects || 0;
    const reviewCount  = profile._count?.reviews || 0;
    const portfolioCount = profile._count?.portfolio || 0;

    // Count COMPLETED projects from real project statuses
    const completedProjects = await db.project.count({
      where: { designerId: profile.id, status: "COMPLETED" },
    }).catch(() => 0);

    // Calculate repeat clients (clients who hired this designer more than once)
    const projectClients = await db.project.findMany({
      where: { designerId: profile.id, status: "COMPLETED" },
      select: { clientId: true },
    }).catch(() => []);
    const clientCounts = projectClients.reduce((acc: Record<string,number>, p: any) => {
      acc[p.clientId] = (acc[p.clientId] || 0) + 1;
      return acc;
    }, {});
    const repeatClients = (Object.values(clientCounts) as number[]).filter(c => c > 1).length;

    const isVerified    = profile.verificationLevel !== "UNVERIFIED" && profile.verificationLevel !== null;
    const isApproved    = profile.approvalStatus === "APPROVED";
    const isTopRated    = profile.avgRating >= 4.5 && profile.totalReviews >= 5;
    const isRisingStar  = completedProjects >= 3;
    const isRepeat      = repeatClients >= 2;
    const isElitePro    = completedProjects >= 20 && profile.avgRating >= 4.8 && isVerified;

    const badges = [
      {
        id: "verified_designer",
        name: "Verified Designer",
        icon: "✓",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        description: "Identity and credentials verified by DesignHub Africa",
        earned: isVerified && isApproved,
        criteria: "Complete identity verification",
      },
      {
        id: "top_rated",
        name: "Top Rated",
        icon: "⭐",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        description: "Consistently rated 4.5+ by clients",
        earned: isTopRated,
        criteria: `4.5+ avg rating with 5+ reviews (currently ${profile.avgRating} avg, ${profile.totalReviews} reviews)`,
      },
      {
        id: "rising_star",
        name: "Rising Star",
        icon: "🌟",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        description: "Completed 3+ successful projects",
        earned: isRisingStar,
        criteria: `3+ completed projects (currently ${completedProjects})`,
      },
      {
        id: "repeat_champion",
        name: "Repeat Champion",
        icon: "🏆",
        color: "bg-terracotta-50 text-terracotta-700 border-terracotta-200",
        description: "Clients love coming back — 2+ repeat clients",
        earned: isRepeat,
        criteria: `2+ clients hired you more than once (currently ${repeatClients})`,
      },
      {
        id: "elite_pro",
        name: "Elite Pro",
        icon: "💎",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        description: "DesignHub Africa's top tier — 20+ projects, 4.8+ rating, verified",
        earned: isElitePro,
        criteria: "20+ projects, 4.8+ rating, verified status",
      },
    ];

    return apiSuccess({
      badges,
      stats: {
        avgRating: profile.avgRating,
        totalReviews: reviewCount,
        completedProjects,
        portfolioItems: portfolioCount,
        repeatClients,
        verificationLevel: profile.verificationLevel,
        approvalStatus: profile.approvalStatus,
      },
    });
  });
}

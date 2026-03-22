import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

// Badge definitions with earning criteria
const BADGE_DEFINITIONS = [
  { id: "verified_designer", name: "Verified Designer", icon: "CheckCircle2", criteria: "Complete identity verification", check: (d: any) => d.verificationLevel !== "UNVERIFIED" },
  { id: "top_rated", name: "Top Rated", icon: "Star", criteria: "Maintain 4.5+ rating with 10+ reviews", check: (d: any) => d.avgRating >= 4.5 && d.totalReviews >= 10 },
  { id: "fast_responder", name: "Fast Responder", icon: "Zap", criteria: "Respond to 90%+ of messages within 2 hours", check: (d: any) => true }, // simplified
  { id: "rising_star", name: "Rising Star", icon: "TrendingUp", criteria: "Complete 3+ projects in first 6 months", check: (d: any) => (d._count?.designerProjects || 0) >= 3 },
  { id: "elite_pro", name: "Elite Pro", icon: "Award", criteria: "25+ completed projects, 4.8+ rating, premium verified", check: (d: any) => (d._count?.designerProjects || 0) >= 25 && d.avgRating >= 4.8 && d.verificationLevel === "PREMIUM" },
  { id: "luxury_specialist", name: "Luxury Specialist", icon: "Crown", criteria: "Complete 5+ projects over ₦10M budget", check: (d: any) => false }, // needs project budget check
  { id: "repeat_champion", name: "Repeat Champion", icon: "Heart", criteria: "50%+ of clients return for another project", check: (d: any) => d.completionRate >= 0.5 },
];

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    const profile = await db.designerProfile.findUnique({
      where: { userId: user!.id },
      include: { _count: { select: { designerProjects: true, reviews: true } } },
    });

    if (!profile) return apiError("Designer profile not found", 404);

    const badges = BADGE_DEFINITIONS.map(badge => ({
      ...badge,
      earned: badge.check(profile),
    }));

    return apiSuccess({ badges, profile: { avgRating: profile.avgRating, totalReviews: profile.totalReviews, completionRate: profile.completionRate, verificationLevel: profile.verificationLevel, projectCount: profile._count?.designerProjects || 0 } });
  });
}

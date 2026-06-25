import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { page, limit, skip, search } = getSearchParams(req);
    const url = new URL(req.url);
    const category   = url.searchParams.get("category");
    const location   = url.searchParams.get("location");
    const minExp     = url.searchParams.get("minExp");
    const maxExp     = url.searchParams.get("maxExp");
    const minRating  = url.searchParams.get("minRating");
    const verified   = url.searchParams.get("verified");
    const available  = url.searchParams.get("available");

    const where: any = { approvalStatus: "APPROVED", user: { status: "ACTIVE" } };
    if (category) where.serviceCategory = category;
    if (minExp)   where.yearsExperience = { ...(where.yearsExperience||{}), gte: parseInt(minExp) };
    if (maxExp)   where.yearsExperience = { ...(where.yearsExperience||{}), lte: parseInt(maxExp) };
    if (minRating) where.avgRating = { gte: parseFloat(minRating) };
    if (available === "true") where.availabilityStatus = "AVAILABLE";
    if (verified === "true") {
      where.verification = { status: "VERIFIED" };
    }
    if (location) {
      where.workLocations = { has: location };
    }
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName:  { contains: search, mode: "insensitive" } } },
        { serviceCategory: { contains: search, mode: "insensitive" } },
        { specialties: { has: search } },
      ];
    }

    const [artisans, total] = await Promise.all([
      db.artisanProfile.findMany({
        where, skip, take: limit,
        orderBy: [{ avgRating: "desc" }, { totalReviews: "desc" }],
        include: {
          user:         { select: { id:true, firstName:true, lastName:true, image:true, location:true } },
          verification: { select: { status:true } },
          portfolio:    { take: 3, orderBy: { createdAt:"desc" }, select: { imageUrl:true } },
          _count:       { select: { artisanReviews:true, quotes:true } },
        },
      }),
      db.artisanProfile.count({ where }),
    ]);
    return paginatedResponse(artisans, total, page, limit);
  });
}

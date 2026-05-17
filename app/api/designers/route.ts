import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { page, limit, skip, search } = getSearchParams(req);
    const url = new URL(req.url);

    // Query params for filters
    const location    = url.searchParams.get("location");
    const style       = url.searchParams.get("style");
    const minExp      = url.searchParams.get("minExp");   // years experience
    const minRating   = url.searchParams.get("minRating"); // e.g. "4"
    const specialty   = url.searchParams.get("specialty");
    const sort        = url.searchParams.get("sort") || "rating"; // rating | experience | price_low | price_high

    const where: any = {
      approvalStatus: { in: ["APPROVED", "PENDING"] },
      user: { status: "ACTIVE" },
    };

    // Text search: name, location, specialty
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName:  { contains: search, mode: "insensitive" } } },
        { user: { location:  { contains: search, mode: "insensitive" } } },
        { specialties: { has: search } },  // exact specialty match
      ];
    }

    // Location filter
    if (location && location !== "All") {
      where.user = { ...where.user, location: { contains: location, mode: "insensitive" } };
    }

    // Specialty / style filter (stored in specialties array)
    if (specialty && specialty !== "All") {
      where.specialties = { has: specialty };
    }

    // Experience filter
    if (minExp) {
      where.yearsExperience = { gte: parseInt(minExp) };
    }

    // Rating filter
    if (minRating) {
      where.avgRating = { gte: parseFloat(minRating) };
    }

    // Sort
    const orderBy: any =
      sort === "experience"  ? { yearsExperience: "desc" } :
      sort === "price_low"   ? { hourlyRate: "asc" }       :
      sort === "price_high"  ? { hourlyRate: "desc" }      :
                               { avgRating: "desc" };       // default: top rated

    const [designers, total] = await Promise.all([
      db.designerProfile.findMany({
        where, skip, take: limit, orderBy,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, image: true, location: true, isVerified: true } },
          _count: { select: { reviews: true, designerProjects: true, portfolio: true } },
        },
      }),
      db.designerProfile.count({ where }),
    ]);

    return paginatedResponse(designers, total, page, limit);
  });
}

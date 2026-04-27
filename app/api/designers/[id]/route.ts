import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const designer = await db.designerProfile.findUnique({
      where: { id: params.id },
      select: {
        id: true, userId: true, specialties: true, hourlyRate: true, currency: true,
        yearsExperience: true, certifications: true, languages: true, designTools: true,
        isAvailable: true, responseTime: true, approvalStatus: true, verificationLevel: true,
        avgRating: true, totalReviews: true, completionRate: true,
        consultationPrice: true, meetingLink: true,
        companyName: true, companyRegNumber: true, isCompany: true, bio: true,
        user: { select: { id: true, firstName: true, lastName: true, image: true, location: true, isVerified: true, status: true } },
        portfolio: { select: { id: true, title: true, description: true, images: true, category: true, style: true, location: true, isFeatured: true }, orderBy: { createdAt: "desc" } },
        servicePackages: { select: { id: true, title: true, description: true, price: true, deliveryDays: true, isActive: true } },
        reviews: { select: { id: true, rating: true, comment: true, createdAt: true, author: { select: { firstName: true, lastName: true, image: true } } }, orderBy: { createdAt: "desc" }, take: 10 },
        _count: { select: { reviews: true, designerProjects: true } },
      },
    });
    if (!designer) return apiError("Designer not found", 404);
    return apiSuccess(designer);
  });
}

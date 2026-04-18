import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const q = new URL(req.url).searchParams.get("q");
    if (!q) return apiError("Query required", 400);
    const [designers, products] = await Promise.all([
      db.designerProfile.findMany({ where: { approvalStatus: "APPROVED", user: { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] } }, take: 5, include: { user: { select: { firstName: true, lastName: true, image: true, location: true } } } }),
      db.product.findMany({ where: { isApproved: true, name: { contains: q, mode: "insensitive" } }, take: 5 }),
    ]);
    return apiSuccess({ designers, products });
  });
}

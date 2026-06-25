import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

function makeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") + "-" + Math.random().toString(36).slice(2,6);
}

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const businesses = await db.business.findMany({
      where: { ownerUserId: user!.id },
      include: { members: { where: { userId: user!.id }, select: { role: true, status: true } }, _count: { select: { members: true, reviews: true } } },
    } as any);
    return apiSuccess(businesses);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { businessName, businessType, businessEmail, businessPhone, businessDescription, city, state, address, websiteUrl, yearEstablished } = await req.json();
    if (!businessName || !businessType) return apiError("businessName and businessType required", 400);
    const valid = ["DESIGN_FIRM","VENDOR","ARTISAN_COMPANY"];
    if (!valid.includes(businessType)) return apiError("Invalid businessType", 400);

    const biz = await db.business.create({
      data: { ownerUserId: user!.id, slug: makeSlug(businessName), businessName, businessType, businessEmail: businessEmail||null, businessPhone: businessPhone||null, businessDescription: businessDescription||null, city: city||null, state: state||null, address: address||null, websiteUrl: websiteUrl||null, yearEstablished: yearEstablished||null } as any,
    });
    // Add owner as OWNER member
    await db.businessMember.create({ data: { businessId: biz.id, userId: user!.id, role: "OWNER", status: "ACTIVE" } as any });
    // Log activity
    await db.notification.create({ data: { userId: user!.id, type: "business_created", title: "Business Profile Created", message: `${businessName} has been registered. Complete verification to unlock full features.`, link: `/dashboard/business` } }).catch(()=>{});
    return apiSuccess(biz, 201);
  });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.vendorProfile.findUnique({
      where: { userId: user!.id },
      include: { verification: true },
    });
    if (!profile) return apiError("Vendor profile not found", 404);
    return apiSuccess(profile);
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const { storeName, storeDescription, storeImage, businessAddress, businessPhone, cacNumber, cacDocUrl, category } = body;

    const updateData: any = {};
    if (storeName        !== undefined) updateData.storeName        = storeName;
    if (storeDescription !== undefined) updateData.storeDescription = storeDescription;
    if (storeImage       !== undefined) updateData.storeImage       = storeImage;
    if (businessAddress  !== undefined) updateData.businessAddress  = businessAddress;
    if (businessPhone    !== undefined) updateData.businessPhone    = businessPhone;
    if (cacNumber        !== undefined) updateData.cacNumber        = cacNumber;
    if (cacDocUrl        !== undefined) updateData.cacDocUrl        = cacDocUrl;
    if (category         !== undefined) updateData.category         = category;

    const createData: any = {
      userId: user!.id,
      storeName: storeName || "My Store",
      storeDescription: storeDescription || null,
      storeImage: storeImage || null,
      businessAddress: businessAddress || null,
      businessPhone: businessPhone || null,
      cacNumber: cacNumber || null,
      cacDocUrl: cacDocUrl || null,
      category: category || null,
    };

    const profile = await db.vendorProfile.upsert({
      where: { userId: user!.id },
      update: updateData,
      create: createData,
    });

    // If CAC doc uploaded, trigger verification workflow
    if (cacDocUrl) {
      const verificationData: any = {
        businessRegUrl: cacDocUrl,
        businessRegNumber: cacNumber || null,
        businessAddress: businessAddress || null,
        status: "PENDING",
      };
      await db.vendorVerification.upsert({
        where: { vendorId: profile.id },
        update: verificationData,
        create: { vendorId: profile.id, ...verificationData },
      });
      const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      for (const admin of admins) {
        await db.notification.create({
          data: { userId: admin.id, type: "vendor_verification", title: "Vendor Verification Request", message: `${storeName || "A vendor"} submitted CAC documents for verification`, link: "/vendor-approvals" },
        }).catch(() => {});
      }
    }

    return apiSuccess(profile);
  });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { governmentIdUrl, selfieUrl, addressProofUrl, address } = await req.json();
    if (!governmentIdUrl || !selfieUrl) return apiError("Government ID and selfie are required", 400);

    const profile = await db.artisanProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Artisan profile not found", 404);

    const verification = await db.artisanVerification.upsert({
      where: { artisanId: profile.id },
      update: { governmentIdUrl, selfieUrl, addressProofUrl: addressProofUrl||null, address: address||null, status: "PENDING", rejectedReason: null },
      create: { artisanId: profile.id, governmentIdUrl, selfieUrl, addressProofUrl: addressProofUrl||null, address: address||null, status: "PENDING" },
    });

    // Notify admins
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    for (const admin of admins) {
      await db.notification.create({ data: { userId: admin.id, type: "artisan_verification", title: "Artisan Verification Request", message: `An artisan submitted verification documents`, link: "/artisan-approvals" } }).catch(()=>{});
    }

    return apiSuccess(verification, 201);
  });
}

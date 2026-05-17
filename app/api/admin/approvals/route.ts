import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error } = await requireRole("ADMIN");
    if (error) return error;
    const [designers, vendors] = await Promise.all([
      db.designerProfile.findMany({ where: { approvalStatus: "PENDING" }, include: { user: { select: { id: true, firstName: true, lastName: true, email: true, location: true, createdAt: true } } } }),
      db.vendorProfile.findMany({ where: { approvalStatus: "PENDING" }, include: { user: { select: { id: true, firstName: true, lastName: true, email: true, location: true, createdAt: true } } } }),
    ]);
    return apiSuccess({ designers, vendors });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireRole("ADMIN");
    if (ae) return ae;
    const { type, profileId, action, reason } = await req.json();
    if (type === "designer") {
      await db.designerProfile.update({ where: { id: profileId }, data: { approvalStatus: action === "approve" ? "APPROVED" : "REJECTED", approvedAt: action === "approve" ? new Date() : null, rejectedReason: reason } });
      if (action === "approve") { const p = await db.designerProfile.findUnique({ where: { id: profileId }, select: { userId: true } }); if (p) await db.user.update({ where: { id: p.userId }, data: { isVerified: true } }); }
    } else if (type === "vendor") {
      await db.vendorProfile.update({ where: { id: profileId }, data: { approvalStatus: action === "approve" ? "APPROVED" : "REJECTED", approvedAt: action === "approve" ? new Date() : null, rejectedReason: reason } });
      if (action === "approve") { const p = await db.vendorProfile.findUnique({ where: { id: profileId }, select: { userId: true } }); if (p) await db.user.update({ where: { id: p.userId }, data: { isVerified: true } }); }
    }
    return apiSuccess({ profileId, action });
  });
}

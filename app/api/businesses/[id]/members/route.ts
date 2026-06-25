import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

const ROLES = ["OWNER","ADMIN","PROJECT_MANAGER","DESIGNER","ARCHITECT","ACCOUNT_MANAGER","VIEWER"];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    // Must be a member
    const membership = await db.businessMember.findFirst({ where: { businessId: params.id, userId: user!.id, status: "ACTIVE" } } as any);
    if (!membership && user!.role !== "ADMIN") return apiError("Not a member", 403);
    const members = await db.businessMember.findMany({
      where: { businessId: params.id },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, image: true } } },
      orderBy: { joinedAt: "asc" },
    } as any);
    return apiSuccess(members);
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const biz = await db.business.findUnique({ where: { id: params.id } });
    if (!biz) return apiError("Not found", 404);
    if (biz.ownerUserId !== user!.id) return apiError("Only owner can invite members", 403);

    const { email, role } = await req.json();
    if (!email || !role) return apiError("email and role required", 400);
    if (!ROLES.includes(role)) return apiError("Invalid role", 400);

    const invitee = await db.user.findUnique({ where: { email }, select: { id: true, firstName: true } });
    if (!invitee) return apiError("User with that email not found on DesignHub", 404);

    const existing = await db.businessMember.findFirst({ where: { businessId: params.id, userId: invitee.id } } as any);
    if (existing) return apiError("User is already a member", 400);

    const member = await db.businessMember.create({
      data: { businessId: params.id, userId: invitee.id, role, status: "ACTIVE", invitedBy: user!.id } as any,
    });
    await db.notification.create({ data: { userId: invitee.id, type: "business_invitation", title: `You've been added to ${biz.businessName}`, message: `You have been added as ${role.replace(/_/g," ")} at ${biz.businessName}`, link: `/dashboard/business` } }).catch(()=>{});
    return apiSuccess(member, 201);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { memberId } = await req.json();
    const biz = await db.business.findUnique({ where: { id: params.id } });
    if (!biz || biz.ownerUserId !== user!.id) return apiError("Not authorized", 403);
    await db.businessMember.delete({ where: { id: memberId } });
    return apiSuccess({ removed: true });
  });
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { updateUserSchema } from "@/lib/validations";
import { parseBody, apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const user = await db.user.findUnique({ where: { id: params.id }, select: { id: true, firstName: true, lastName: true, email: true, image: true, location: true, bio: true, role: true, isVerified: true, createdAt: true } });
    if (!user) return apiError("Not found", 404);
    return apiSuccess(user);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error: authError, user: me } = await requireAuth();
    if (authError) return authError;
    if (me!.id !== params.id && me!.role !== "ADMIN") return apiError("Forbidden", 403);
    const { data, error } = await parseBody(req, updateUserSchema);
    if (error) return error;
    const updated = await db.user.update({ where: { id: params.id }, data: data! });
    return apiSuccess(updated);
  });
}

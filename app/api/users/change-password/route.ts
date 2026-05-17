import { authLimiter } from "@/lib/services/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { hash, compare } from "bcryptjs";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { randomInt } from "crypto";

export async function POST(req: NextRequest) {
  const limited = authLimiter(req); if (limited) return limited;
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const { action, currentPassword, newPassword, code } = body;

    const dbUser = await db.user.findUnique({ where: { id: user!.id }, select: { id: true, email: true, password: true, firstName: true } });
    if (!dbUser) return apiError("User not found", 404);

    if (action === "request") {
      // Verify current password
      if (!currentPassword || !dbUser.password) return apiError("Current password required", 400);
      const valid = await compare(currentPassword, dbUser.password);
      if (!valid) return apiError("Current password is incorrect", 401);

      // Generate 6-digit code and store in DB as a token
      const otp = randomInt(100000, 999999).toString();
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await db.passwordResetToken.create({ data: { email: dbUser.email, token: otp, expires } });

      // Send via Resend
      sendPasswordResetEmail(dbUser.email, dbUser.firstName, otp).catch(e => console.error("[Email Error]", e));

      return apiSuccess({ sent: true, email: dbUser.email.replace(/(.{2}).+@/, "$1***@") });
    }

    if (action === "confirm") {
      if (!code || !newPassword) return apiError("Code and new password required", 400);
      if (newPassword.length < 8) return apiError("Password must be at least 8 characters", 400);

      const token = await db.passwordResetToken.findFirst({ where: { email: dbUser.email, token: code, expires: { gt: new Date() } } });
      if (!token) return apiError("Invalid or expired code", 400);

      await db.user.update({ where: { id: user!.id }, data: { password: await hash(newPassword, 12) } });
      await db.passwordResetToken.delete({ where: { id: token.id } });

      return apiSuccess({ changed: true });
    }

    return apiError("Invalid action", 400);
  });
}

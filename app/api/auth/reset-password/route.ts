import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { email, token, password } = await req.json();
    if (!email || !token || !password) return apiError("All fields required", 400);
    if (password.length < 8) return apiError("Password must be at least 8 characters", 400);

    const record = await db.verificationToken.findFirst({
      where: { identifier: email, token, expires: { gt: new Date() } },
    });
    if (!record) return apiError("Invalid or expired reset link", 400);

    await db.user.update({
      where: { email },
      data: { password: await hash(password, 12) },
    });

    // Delete used token
    await db.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    });

    return apiSuccess({ message: "Password reset successfully" });
  });
}

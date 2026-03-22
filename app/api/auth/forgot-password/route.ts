import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { email } = await req.json();
    if (!email) return apiError("Email required", 400);

    const user = await db.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration
    if (!user) return apiSuccess({ message: "If an account exists, a reset link has been sent." });

    // Create reset token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    // In production, send email via Resend
    // For now, log it (the token can be used at /reset-password?token=xxx&email=xxx)
    console.log(`[Password Reset] Email: ${email}, Token: ${token}`);

    try {
      const { Resend } = require("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      await resend.emails.send({
        from: process.env.FROM_EMAIL || "DesignHub Africa <onboarding@resend.dev>",
        to: email,
        subject: "Reset your password — DesignHub Africa",
        html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;">
          <h2>Reset Your Password</h2>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#ec5a1a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Reset Password</a>
          <p style="color:#666;font-size:13px;">If you didn't request this, ignore this email.</p>
        </div>`,
      });
    } catch (e) {
      console.error("[Email Error]", e);
    }

    return apiSuccess({ message: "If an account exists, a reset link has been sent." });
  });
}

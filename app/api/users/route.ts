import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { authLimiter } from "@/lib/services/rate-limit";
import { randomBytes } from "crypto";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const limited = authLimiter(req); if (limited) return limited;
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
      return NextResponse.json({ success: false, error: errors }, { status: 422 });
    }
    const data = parsed.data;
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });

    // Generate unique referral code using email prefix + random suffix for uniqueness
    const emailPrefix = data.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
    const randomPart = randomBytes(2).toString("hex").toUpperCase();
    let referralCode = `DH-${emailPrefix}${randomPart}`;
    // Ensure uniqueness
    const codeExists = await db.user.findFirst({ where: { referralCode } });
    if (codeExists) referralCode = `DH-${randomBytes(4).toString("hex").toUpperCase()}`;

    const user = await db.user.create({
      data: {
        firstName: data.firstName, lastName: data.lastName, email: data.email,
        password: await hash(data.password, 12), role: data.role as any,
        termsAcceptedAt: new Date(),
        termsVersion: "1.0",
        location: data.location || null, referralCode,
      } as any,
      select: { id: true, firstName: true, lastName: true, email: true, role: true, referralCode: true },
    });

    // Create role profiles — wrapped in try/catch so user registration doesn't fail
    if (data.role === "DESIGNER") {
      await db.designerProfile.create({
        data: { userId: user.id, specialties: [], certifications: [], languages: [], designTools: [] },
      }).catch((e: any) => console.error("[Profile Create Error]", e.message));
    }
    if (data.role === "ARTISAN") {
      await db.artisanProfile.create({
        data: { userId: user.id, serviceCategory: "general", specialties: [], certifications: [], languages: [], tools: [], workLocations: [] },
      }).catch((e: any) => console.error("[Profile Create Error]", e.message));
    }
    if (data.role === "VENDOR") {
      await db.vendorProfile.create({
        data: { userId: user.id, storeName: `${data.firstName}'s Store` },
      }).catch((e: any) => console.error("[Profile Create Error]", e.message));
    }

    // Track referral if ref code provided
    const refCode = (body as any).referralCode;
    if (refCode && refCode !== referralCode) {
      const referrer = await db.user.findFirst({ where: { referralCode: refCode }, select: { id: true } });
      if (referrer) {
        await db.referral.create({ data: { referrerId: referrer.id, referredId: user.id, referralCode: refCode, status: "completed", rewardAmount: 1000 } }).catch(() => {});
      }
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.firstName, user.role).catch(() => {});
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: any) {
    console.error("[Register Error]", error);
    return NextResponse.json({ success: false, error: "Registration failed. Please try again." }, { status: 500 });
  }
}

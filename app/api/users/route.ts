import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ success: false, error: errors }, { status: 422 });
    }

    const data = parsed.data;

    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });
    }

    // Generate unique referral code
    const referralCode = `DH-${randomBytes(3).toString("hex").toUpperCase()}`;

    const user = await db.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: await hash(data.password, 12),
        role: data.role as any,
        location: data.location || null,
        referralCode,
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, referralCode: true, createdAt: true },
    });

    // Create role-specific profiles
    if (data.role === "DESIGNER") {
      await db.designerProfile.create({ data: { userId: user.id, specialties: [], certifications: [], languages: [], designTools: [] } });
    }
    if (data.role === "ARTISAN") {
      await db.artisanProfile.create({ data: { userId: user.id, serviceCategory: "general", specialties: [], certifications: [], languages: [], tools: [], workLocations: [] } });
    }
    if (data.role === "VENDOR") {
      await db.vendorProfile.create({ data: { userId: user.id, storeName: `${data.firstName}'s Store` } });
    }

    // Track referral if ref code provided
    const refCode = (body as any).referralCode;
    if (refCode) {
      const referrer = await db.user.findFirst({ where: { referralCode: refCode } });
      if (referrer && referrer.id !== user.id) {
        await db.referral.create({ data: { referrerId: referrer.id, referredId: user.id, referralCode: refCode, status: "completed", rewardAmount: 1000 } }); // ₦1000 reward
      }
    }

    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    console.error("[Register Error]", error);
    return NextResponse.json({ success: false, error: "Registration failed. Please try again." }, { status: 500 });
  }
}

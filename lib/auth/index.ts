import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

declare module "next-auth" {
  interface Session { user: { id: string; email: string; name: string; image?: string; role: string; firstName: string; lastName: string; }; }
}
declare module "next-auth/jwt" {
  interface JWT { id: string; role: string; firstName: string; lastName: string; }
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? session.user : null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  return { error: null, user };
}

export async function requireRole(...roles: string[]) {
  const { error, user } = await requireAuth();
  if (error) return { error, user: null };
  if (!roles.includes(user!.role)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), user: null };
  return { error: null, user: user! };
}

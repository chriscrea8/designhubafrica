import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id } });
    if (!profile) return apiError("Designer profile not found", 404);
    const items = await db.portfolioItem.findMany({ where: { designerId: profile.id }, orderBy: { createdAt: "desc" } });
    return apiSuccess(items);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id } });
    if (!profile) return apiError("Designer profile not found", 404);
    const body = await req.json();
    const { title, description, category, style, location, images } = body;
    if (!title) return apiError("Title is required", 400);
    const item = await db.portfolioItem.create({ data: { designerId: profile.id, title, description: description || "", category: category || "General", style: style || "Modern", location: location || "", images: images || [] } });
    return apiSuccess(item, 201);
  });
}

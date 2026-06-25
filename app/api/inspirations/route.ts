import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";
import { uploadLimiter } from "@/lib/services/rate-limit";

function generateSlug(title: string, id: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + id.slice(-6);
}

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { page, limit, skip, search } = getSearchParams(req);
    const url = new URL(req.url);
    const roomType   = url.searchParams.get("roomType");
    const style      = url.searchParams.get("style");
    const designerId = url.searchParams.get("designerId");
    const featured   = url.searchParams.get("featured");
    const sort       = url.searchParams.get("sort") || "newest";
    const mine       = url.searchParams.get("mine");

    // Designer viewing their own
    if (mine === "true") {
      const { error, user } = await requireAuth();
      if (error) return error;
      const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
      if (!profile) return apiSuccess({ items: [], pagination: { total: 0, page, limit, totalPages: 0 } });
      const [items, total] = await Promise.all([
        db.inspiration.findMany({
          where: { designerId: profile.id, deletedAt: null },
          skip, take: limit, orderBy: { createdAt: "desc" },
          include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, designer: { include: { user: { select: { firstName: true, lastName: true } } } } },
        } as any),
        db.inspiration.count({ where: { designerId: profile.id, deletedAt: null } }),
      ]);
      return paginatedResponse(items, total, page, limit);
    }

    const where: any = { status: "PUBLISHED", deletedAt: null };
    if (roomType)   where.roomType   = roomType;
    if (style)      where.designStyle = style;
    if (designerId) where.designerId  = designerId;
    if (featured === "true") where.isFeatured = true;
    if (search) where.OR = [
      { title:           { contains: search, mode: "insensitive" } },
      { description:     { contains: search, mode: "insensitive" } },
      { projectLocation: { contains: search, mode: "insensitive" } },
      { designStyle:     { contains: search, mode: "insensitive" } },
      { designer: { user: { firstName: { contains: search, mode: "insensitive" } } } },
      { designer: { user: { lastName:  { contains: search, mode: "insensitive" } } } },
    ];

    const orderBy: any =
      sort === "most_saved" ? { saveCount: "desc" } :
      sort === "most_viewed" ? { viewCount: "desc" } :
      { createdAt: "desc" };

    const [items, total] = await Promise.all([
      db.inspiration.findMany({
        where, skip, take: limit, orderBy,
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 3 },
          designer: { include: { user: { select: { id: true, firstName: true, lastName: true, image: true } } } },
          _count: { select: { moodboardItems: true } },
        },
      } as any),
      db.inspiration.count({ where }),
    ]);
    return paginatedResponse(items, total, page, limit);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const limited = uploadLimiter(req);
    if (limited) return limited;
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "DESIGNER" && user!.role !== "ADMIN") return apiError("Designer account required", 403);
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Designer profile not found", 404);

    const body = await req.json();
    const { title, description, roomType, designStyle, budgetRange, projectLocation, projectSize, completionDate, featuredImage, images = [], status = "DRAFT" } = body;
    if (!title || !description || !roomType || !designStyle || !featuredImage) return apiError("title, description, roomType, designStyle, featuredImage required", 400);

    const id = Math.random().toString(36).slice(2, 10);
    const slug = generateSlug(title, id);

    const inspiration = await db.inspiration.create({
      data: {
        id,
        designerId: profile.id,
        title, description, slug, roomType, designStyle,
        budgetRange: budgetRange || null,
        projectLocation: projectLocation || null,
        projectSize: projectSize || null,
        completionDate: (completionDate && completionDate !== "") ? new Date(completionDate) : null,
        featuredImage,
        seoTitle: `${title} | DesignHub Africa`,
        seoDescription: description.slice(0, 160),
        status: status || "DRAFT",
      } as any,
    });

    // Create image records
    if (images.length > 0) {
      await db.inspirationImage.createMany({
        data: images.map((url: string, i: number) => ({ inspirationId: inspiration.id, imageUrl: url, sortOrder: i })),
      });
    }

    return apiSuccess(inspiration, 201);
  });
}

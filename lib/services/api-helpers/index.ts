import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

export function apiSuccess<T>(data: T, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
export function apiError(message: string, status = 400) { return NextResponse.json({ success: false, error: message }, { status }); }
export function apiValidationError(error: ZodError) {
  return NextResponse.json({ success: false, error: "Validation failed", details: error.errors.map((e) => ({ field: e.path.join("."), message: e.message })) }, { status: 422 });
}

export async function parseBody<T>(req: NextRequest, schema: ZodSchema<T>) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return { data: null, error: apiValidationError(parsed.error) };
    return { data: parsed.data, error: null };
  } catch { return { data: null, error: apiError("Invalid JSON body", 400) }; }
}

export function getSearchParams(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;
  const search = url.searchParams.get("search") || undefined;
  return { page, limit, skip, search };
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return apiSuccess({ items: data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total } });
}

export async function withErrorHandling(handler: () => Promise<NextResponse>) {
  try { return await handler(); } catch (error) { console.error("[API Error]", error); return apiError(error instanceof Error ? error.message : "Internal server error", 500); }
}

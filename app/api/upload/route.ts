import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadFile, generateUploadSignature } from "@/lib/upload";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error } = await requireAuth();
    if (error) return error;
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = (form.get("folder") as string) || "projects";
    if (!file) return apiError("No file", 400);
    if (file.size > 10 * 1024 * 1024) return apiError("Max 10MB", 400);
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadFile(buffer, folder);
    return apiSuccess(result, 201);
  });
}

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error } = await requireAuth();
    if (error) return error;
    const folder = new URL(req.url).searchParams.get("folder") || "projects";
    return apiSuccess(generateUploadSignature(folder));
  });
}

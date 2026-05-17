export function sanitizeText(input: string): string {
  return input.replace(/<[^>]*>/g, "").replace(/javascript:/gi, "").replace(/on\w+\s*=/gi, "").trim();
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg","image/png","image/webp","image/gif"];
export const ALLOWED_DOC_TYPES   = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
export const MAX_FILE_SIZE_MB    = 10;

export function validateUpload(file: File, types: string[] = ALLOWED_IMAGE_TYPES): string | null {
  if (!types.includes(file.type)) return `Invalid file type. Allowed: ${types.map(t => t.split("/")[1]).join(", ")}`;
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return `File too large. Maximum ${MAX_FILE_SIZE_MB}MB`;
  if (file.size === 0) return "File is empty";
  return null;
}

import { db } from "@/lib/db";

const PHONE_REGEX = /(?:\+?[\d\s\-().]{7,15})/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const SOCIAL_HANDLE_REGEX = /@[a-zA-Z0-9_.]{2,30}/g;
const WHATSAPP_REGEX = /(?:wa\.me|chat\.whatsapp\.com)[\/\w\-?=&.+]*/gi;
const TELEGRAM_REGEX = /(?:t\.me|telegram\.me)[\/\w\-?=&.+]*/gi;

const WORD_DIGITS: Record<string, string> = { zero:"0",one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9",oh:"0" };

const REDIRECT_PHRASES = [/message\s+me\s+on/i,/let'?s?\s+continue\s+on/i,/reach\s+me\s+(?:at|on)/i,/contact\s+me/i,/find\s+me\s+on/i,/my\s+(?:number|phone|whatsapp|telegram|insta)\s+is/i,/hit\s+me\s+up/i,/(?:off|outside)\s+(?:the\s+)?platform/i];

const PLACEHOLDER = "[Contact details removed — please use in-platform messaging]";

interface ModerationResult {
  originalContent: string;
  sanitizedContent: string;
  severity: "CLEAN" | "MILD" | "MODERATE" | "SEVERE";
  violations: string[];
  action: "passed" | "redacted" | "blocked";
  wasModified: boolean;
}

export function moderateMessage(content: string): ModerationResult {
  const violations: string[] = [];

  if (PHONE_REGEX.test(content)) violations.push("phone_number");
  if (EMAIL_REGEX.test(content)) violations.push("email");
  if (SOCIAL_HANDLE_REGEX.test(content)) violations.push("social_handle");
  if (WHATSAPP_REGEX.test(content)) violations.push("whatsapp_link");
  if (TELEGRAM_REGEX.test(content)) violations.push("telegram_link");
  if (REDIRECT_PHRASES.some((r) => r.test(content))) violations.push("redirect_phrase");

  // Word-number detection
  const words = content.toLowerCase().split(/\s+/);
  let digitRun = "";
  for (const w of words) { if (WORD_DIGITS[w]) digitRun += WORD_DIGITS[w]; else { if (digitRun.length >= 7) violations.push("word_number"); digitRun = ""; } }
  if (digitRun.length >= 7) violations.push("word_number");

  if (violations.length === 0) return { originalContent: content, sanitizedContent: content, severity: "CLEAN", violations: [], action: "passed", wasModified: false };

  const hasDirectContact = violations.some((v) => ["phone_number", "email", "whatsapp_link", "telegram_link"].includes(v));
  const hasObfuscated = violations.includes("word_number");

  let severity: ModerationResult["severity"];
  let action: ModerationResult["action"];

  if (hasObfuscated || (hasDirectContact && violations.includes("redirect_phrase"))) { severity = "SEVERE"; action = "blocked"; }
  else if (hasDirectContact) { severity = "MODERATE"; action = "blocked"; }
  else { severity = "MILD"; action = "redacted"; }

  let sanitized = content;
  if (action === "redacted") {
    sanitized = sanitized.replace(PHONE_REGEX, PLACEHOLDER).replace(EMAIL_REGEX, PLACEHOLDER).replace(SOCIAL_HANDLE_REGEX, PLACEHOLDER);
  }

  return { originalContent: content, sanitizedContent: action === "blocked" ? "" : sanitized, severity, violations, action, wasModified: true };
}

export async function processMessageModeration(params: { conversationId: string; senderId: string; content: string }) {
  // Check suspension
  const suspension = await db.userSuspension.findFirst({ where: { userId: params.senderId, type: "chat_suspended", isActive: true, endsAt: { gt: new Date() } } });
  if (suspension) return { allowed: false, content: "", moderation: { severity: "SEVERE", violations: [], action: "suspended" } as any, warning: "Chat privileges suspended." };

  const mod = moderateMessage(params.content);

  await db.messageModeration.create({ data: { conversationId: params.conversationId, senderId: params.senderId, originalContent: mod.originalContent, sanitizedContent: mod.sanitizedContent || null, severity: mod.severity, violations: mod.violations, action: mod.action, wasDelivered: mod.action !== "blocked" } });

  if (mod.severity !== "CLEAN") {
    await db.userStrike.create({ data: { userId: params.senderId, type: "messaging_violation", reason: `Detected: ${mod.violations.join(", ")}`, severity: mod.severity } });
    const count = await db.userStrike.count({ where: { userId: params.senderId, isActive: true } });
    if (count >= 3) await db.userSuspension.create({ data: { userId: params.senderId, type: "chat_suspended", reason: "Repeated messaging violations", endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
  }

  return {
    allowed: mod.action !== "blocked",
    content: mod.action === "blocked" ? "" : (mod.sanitizedContent || params.content),
    moderation: mod,
    warning: mod.action === "redacted" ? "Some contact details were removed." : mod.action === "blocked" ? "Message blocked — sharing contact info is not allowed." : undefined,
  };
}

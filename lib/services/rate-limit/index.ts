import { NextRequest, NextResponse } from "next/server";

const store = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions { windowMs?: number; max?: number; }

export function rateLimit(options: RateLimitOptions = {}) {
  const { windowMs = 60_000, max = 60 } = options;
  return function check(req: NextRequest): NextResponse | null {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const key = ip + ":" + new URL(req.url).pathname;
    const now = Date.now();
    const record = store.get(key);
    if (!record || now > record.resetAt) { store.set(key, { count: 1, resetAt: now + windowMs }); return null; }
    if (record.count >= max) return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429, headers: { "Retry-After": String(Math.ceil((record.resetAt - now) / 1000)) } });
    record.count++;
    return null;
  };
}

export const authLimiter   = rateLimit({ windowMs: 15 * 60_000, max: 10  });
export const uploadLimiter = rateLimit({ windowMs: 60_000,       max: 20  });
export const apiLimiter    = rateLimit({ windowMs: 60_000,       max: 100 });
export const strictLimiter = rateLimit({ windowMs: 60_000,       max: 5   });

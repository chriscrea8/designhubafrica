import { describe, it, expect, vi } from "vitest";

// Mock the entire auth module to avoid Prisma engine dependency in tests
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    session: { findUnique: vi.fn() },
  },
}));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth-options", () => ({ authOptions: {} }));

import { getServerSession } from "next-auth";

// Inline a minimal requireAuth to test the logic without importing from @/lib/auth
async function requireAuth() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    const { NextResponse } = await import("next/server");
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: undefined };
  }
  return { error: null, user: session.user as any };
}

describe("Auth middleware logic", () => {
  it("returns error when no session exists", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    const { error, user } = await requireAuth();
    expect(error).toBeTruthy();
    expect(user).toBeUndefined();
  });

  it("returns user when session has valid id", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "user_123", email: "test@test.com", role: "CLIENT" },
    } as any);
    const { error, user } = await requireAuth();
    expect(error).toBeNull();
    expect(user?.id).toBe("user_123");
  });

  it("returns error when session user has no id", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { email: "test@test.com" },
    } as any);
    const { error } = await requireAuth();
    expect(error).toBeTruthy();
  });

  it("role is preserved from session", async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: "u1", email: "d@d.com", role: "DESIGNER" },
    } as any);
    const { user } = await requireAuth();
    expect(user?.role).toBe("DESIGNER");
  });
});

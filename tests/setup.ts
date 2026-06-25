import { vi, beforeEach, afterEach } from "vitest";

// Mock Next.js internals
vi.mock("next/headers", () => ({ cookies: vi.fn(() => ({ get: vi.fn() })) }));
vi.mock("next/navigation", () => ({
  useRouter:      () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname:    () => "/",
  useSearchParams:() => new URLSearchParams(),
}));

// Mock Pusher (real-time) so tests don't need a live connection
vi.mock("pusher", () => ({ default: vi.fn().mockImplementation(() => ({ trigger: vi.fn() })) }));
vi.mock("pusher-js",() => ({ default: vi.fn().mockImplementation(() => ({ subscribe: vi.fn().mockReturnValue({ bind: vi.fn() }), disconnect: vi.fn() })) }));

// Global test db helper — used in integration tests
export { getTestDb, resetTestDb } from "./helpers/db";

import { PrismaClient } from "@prisma/client";

let _db: PrismaClient | null = null;

export function getTestDb(): PrismaClient {
  if (!_db) {
    _db = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL } },
      log: [],
    });
  }
  return _db;
}

// Fast reset: delete rows in dependency order, don't drop/recreate tables
export async function resetTestDb() {
  const db = getTestDb();
  const tables = [
    "ArtisanReview", "JobQuote", "JobRequest", "ArtisanPortfolio",
    "ArtisanVerification", "ConsultationBooking", "ConsultationPackage",
    "MilestoneInvoice", "Transaction", "CommissionConfig",
    "ProductBoost", "SavedProduct", "VendorSubscription",
    "Notification", "Message", "ConversationParticipant", "Conversation",
    "Review", "ArtisanReview", "Dispute", "Milestone", "Contract",
    "Proposal", "Project", "DesignerVerification", "PortfolioItem",
    "DesignerProfile", "ArtisanProfile", "VendorProfile",
    "User",
  ];
  for (const t of tables) {
    await (db as any)[t.charAt(0).toLowerCase() + t.slice(1)].deleteMany({}).catch(() => {});
  }
}

export async function createTestUser(db: PrismaClient, overrides: any = {}) {
  const bcrypt = await import("bcryptjs");
  return db.user.create({
    data: {
      firstName:  overrides.firstName  || "Test",
      lastName:   overrides.lastName   || "User",
      email:      overrides.email      || `test-${Date.now()}@example.com`,
      password:   await bcrypt.hash("password123", 10),
      role:       overrides.role       || "CLIENT",
      isVerified: true,
      status:     "ACTIVE",
      ...overrides,
    } as any,
  });
}

export async function createTestDesigner(db: PrismaClient, userOverrides: any = {}) {
  const user = await createTestUser(db, { ...userOverrides, role: "DESIGNER" });
  const profile = await db.designerProfile.create({
    data: { userId: user.id, specializations: [], isAvailable: true, approvalStatus: "APPROVED" } as any,
  });
  return { user, profile };
}

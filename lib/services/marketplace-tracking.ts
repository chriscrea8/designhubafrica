import { db } from "@/lib/db";

function genRef(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
}

export async function trackJourney(userId: string | null, eventType: string, entityType: string, entityId: string, metadata?: any) {
  try {
    await db.buyerJourneyEvent.create({
      data: { userId: userId||null, eventType, entityType, entityId, metadata: metadata||null } as any,
    });
  } catch { /* non-blocking */ }
}

export async function createLead(params: {
  sourceType: string;
  userId?: string;
  vendorId?: string;
  productId?: string;
  rfqId?: string;
  metadata?: any;
}) {
  try {
    await db.marketplaceLead.create({
      data: {
        leadNumber: genRef("LEAD"),
        sourceType: params.sourceType,
        userId:     params.userId    || null,
        vendorId:   params.vendorId  || null,
        productId:  params.productId || null,
        rfqId:      params.rfqId     || null,
        metadata:   params.metadata  || null,
      } as any,
    });
  } catch { /* non-blocking */ }
}

export async function saveRecentSearch(userId: string, query: string, category?: string) {
  try {
    await db.recentSearch.upsert({
      where: { userId_query: { userId, query } },
      create: { userId, query, category: category||null },
      update: { createdAt: new Date() },
    });
  } catch { /* non-blocking */ }
}

export function genRFQNumber() { return genRef("RFQ"); }
export function genQuoteNumber() { return genRef("QUO"); }

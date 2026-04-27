import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    // Get wallet balance from platform transactions
    const credits = await db.platformTransaction.aggregate({ where: { referenceId: user!.id, type: "WALLET_TOPUP" }, _sum: { amount: true } });
    const debits = await db.platformTransaction.aggregate({ where: { referenceId: user!.id, type: "WALLET_SPEND" }, _sum: { amount: true } });
    const balance = (credits._sum.amount || 0) - (debits._sum.amount || 0);
    const transactions = await db.platformTransaction.findMany({ where: { referenceId: user!.id }, orderBy: { createdAt: "desc" }, take: 20 });
    return apiSuccess({ balance, transactions });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { amount } = await req.json();
    if (!amount || amount < 100) return apiError("Minimum topup is ₦100", 400);

    const reference = `wallet_${user!.id.slice(-8)}_${Date.now()}`;
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user!.email, amount: amount * 100, reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://designhubafrica.vercel.app"}/wallet?funded=true`,
        metadata: { userId: user!.id, type: "wallet_topup" },
      }),
    });
    const json = await res.json();
    if (!json.status) return apiError(json.message || "Payment failed", 400);
    return apiSuccess({ authorizationUrl: json.data.authorization_url, reference: json.data.reference });
  });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "list") {
      try {
        const res = await fetch("https://api.paystack.co/bank?country=nigeria&perPage=100", { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }, next: { revalidate: 86400 } });
        const json = await res.json();
        if (json.status && json.data) return apiSuccess(json.data);
        return apiSuccess([]); // Fallback empty
      } catch (e) {
        console.error("[Bank List Error]", e);
        return apiSuccess([]); // Don't fail the page
      }
    }

    if (action === "verify") {
      const accountNumber = url.searchParams.get("account_number");
      const bankCode = url.searchParams.get("bank_code");
      if (!accountNumber || !bankCode) return apiError("account_number and bank_code required", 400);
      try {
        const res = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } });
        const json = await res.json();
        console.log("[Bank Resolve]", JSON.stringify(json));
        if (json.status && json.data) return apiSuccess({ accountName: json.data.account_name, accountNumber: json.data.account_number });
        return apiError(json.message || "Could not verify account", 400);
      } catch (e) {
        console.error("[Bank Verify Error]", e);
        return apiError("Verification service unavailable", 500);
      }
    }

    const bankDetail = await db.bankDetail.findUnique({ where: { userId: user!.id } });
    return apiSuccess(bankDetail);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { bankName, bankCode, accountNumber, accountName } = await req.json();
    if (!bankName || !bankCode || !accountNumber || !accountName) return apiError("All fields required", 400);
    if (accountNumber.length !== 10) return apiError("Account number must be 10 digits", 400);
    const detail = await db.bankDetail.upsert({ where: { userId: user!.id }, create: { userId: user!.id, bankName, bankCode, accountNumber, accountName }, update: { bankName, bankCode, accountNumber, accountName } });
    return apiSuccess(detail);
  });
}

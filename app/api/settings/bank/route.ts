import { NextRequest } from "next/server";
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
      // List Nigerian banks from Paystack
      const res = await fetch("https://api.paystack.co/bank?currency=NGN&perPage=100", {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      });
      const json = await res.json();
      return apiSuccess(json.data || []);
    }

    if (action === "verify") {
      const account = url.searchParams.get("account_number");
      const code    = url.searchParams.get("bank_code");
      if (!account || !code) return apiError("account_number and bank_code required", 400);
      const res = await fetch(`https://api.paystack.co/bank/resolve?account_number=${account}&bank_code=${code}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      });
      const json = await res.json();
      if (!json.status) return apiError(json.message || "Could not verify account", 400);
      return apiSuccess({ accountName: json.data.account_name, accountNumber: json.data.account_number });
    }

    // Get saved bank details
    const profile = await db.designerProfile.findUnique({
      where: { userId: user!.id },
      select: { bankName: true, bankCode: true, accountNumber: true, accountName: true } as any,
    });
    return apiSuccess(profile);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { bankName, bankCode, accountNumber, accountName } = await req.json();
    if (!bankName || !bankCode || !accountNumber || !accountName) return apiError("All bank fields required", 400);
    await db.designerProfile.update({
      where: { userId: user!.id },
      data: { bankName, bankCode, accountNumber, accountName } as any,
    });
    return apiSuccess({ saved: true });
  });
}

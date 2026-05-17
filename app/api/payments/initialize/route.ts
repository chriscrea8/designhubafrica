import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    const body = await req.json();
    const { amount, email, callbackUrl, orderId, milestoneId } = body;

    if (!amount || !email) return apiError("Amount and email required", 400);

    const reference = `dha_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const amountInKobo = Math.round(amount * 100); // Naira to kobo

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        reference,
        callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL || "https://designhubafrica.vercel.app"}/subscription`,
        metadata: { userId: user!.id, orderId, milestoneId, custom_fields: [] },
      }),
    });

    const json = await res.json();
    console.log("[Paystack Init]", JSON.stringify({ status: json.status, message: json.message, ref: reference }));

    if (!json.status) return apiError(json.message || "Payment initialization failed", 400);
    return apiSuccess({ authorizationUrl: json.data.authorization_url, reference: json.data.reference });
  });
}

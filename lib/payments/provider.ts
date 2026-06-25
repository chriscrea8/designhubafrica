// PaymentProvider abstraction — Design Hub Africa never holds funds
// All money movement is handled by the processor (Paystack)

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://designhubafrica.vercel.app";

export interface CheckoutOptions {
  email: string;
  amount: number; // kobo
  reference: string;
  callbackUrl: string;
  metadata: Record<string, any>;
  subaccountCode?: string;     // Paystack subaccount for split
  bearerType?: "account" | "subaccount"; // who bears fees
}

export interface SplitOptions {
  grossAmount: number;    // naira
  platformRate: number;   // e.g. 0.10 for 10%
}

export function calculateSplit(opts: SplitOptions) {
  const platformFee = Math.round(opts.grossAmount * opts.platformRate);
  const netAmount   = opts.grossAmount - platformFee;
  return { grossAmount: opts.grossAmount, platformFee, netAmount };
}

export async function createCheckout(opts: CheckoutOptions) {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: opts.email,
      amount: opts.amount,
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      metadata: opts.metadata,
      ...(opts.subaccountCode && {
        subaccount: opts.subaccountCode,
        bearer: opts.bearerType || "account",
      }),
    }),
  });
  const json = await res.json();
  if (!json.status) throw new Error(json.message || "Paystack initialization failed");
  return { authorizationUrl: json.data.authorization_url, reference: json.data.reference };
}

export async function verifyPayment(reference: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  const json = await res.json();
  if (!json.status) throw new Error("Verification failed");
  return {
    status:    json.data.status,        // success | failed | abandoned
    amount:    json.data.amount / 100,  // kobo → naira
    reference: json.data.reference,
    metadata:  json.data.metadata,
    paidAt:    json.data.paid_at,
  };
}

export async function verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
  const crypto = await import("crypto");
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || PAYSTACK_SECRET;
  const expected = crypto.createHmac("sha512", secret).update(payload).digest("hex");
  return expected === signature;
}

export function generateReference(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

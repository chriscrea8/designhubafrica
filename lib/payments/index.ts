const SECRET = process.env.PAYSTACK_SECRET_KEY!;

async function paystackFetch<T>(endpoint: string, options: RequestInit = {}): Promise<{ status: boolean; message: string; data: T }> {
  const res = await fetch(`https://api.paystack.co${endpoint}`, { ...options, headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json", ...options.headers } });
  return res.json();
}

export async function initializePayment(params: { email: string; amount: number; callbackUrl?: string; metadata?: Record<string, any> }) {
  const reference = `dha_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return paystackFetch<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ email: params.email, amount: params.amount * 100, reference, callback_url: params.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payments/callback`, metadata: params.metadata }),
  });
}

export async function verifyPayment(reference: string) {
  return paystackFetch<{ status: string; amount: number; currency: string; paid_at: string; metadata: Record<string, any> }>(`/transaction/verify/${reference}`);
}

export function validateWebhookSignature(body: string, signature: string): boolean {
  const { createHmac } = require("crypto");
  return createHmac("sha512", SECRET).update(body).digest("hex") === signature;
}

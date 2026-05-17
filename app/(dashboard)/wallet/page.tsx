"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, Plus, DollarSign, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency, cn } from "@/lib/utils";

function WalletContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [showFund, setShowFund] = useState(false);
  const [amount, setAmount] = useState("");
  const [funding, setFunding] = useState(false);
  const [walletData, setWalletData] = useState<any>({ balance: 0, transactions: [] });
  const [justFunded, setJustFunded] = useState(false);

  useEffect(() => {
    loadWallet();
    // Check if returning from Paystack
    const funded = searchParams?.get("funded");
    const ref = searchParams?.get("trxref") || searchParams?.get("reference");
    if (funded && ref) {
      // Verify payment (webhook might not have fired yet)
      fetch(`/api/payments/verify?reference=${ref}`).then(() => { setJustFunded(true); setTimeout(loadWallet, 2000); });
    }
  }, []);

  async function loadWallet() {
    const res = await fetch("/api/wallet");
    const json = await res.json();
    if (json.success) setWalletData(json.data);
  }

  async function fundWallet() {
    if (!amount || parseInt(amount) < 100) return;
    setFunding(true);
    const res = await fetch("/api/wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: parseInt(amount) }) });
    const json = await res.json();
    setFunding(false);
    if (json.success && json.data?.authorizationUrl) window.location.href = json.data.authorizationUrl;
    else alert("Payment initialization failed");
  }

  const { balance, transactions } = walletData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Wallet</h1><p className="text-sm text-muted-foreground mt-1">Your platform wallet balance</p></div><Button variant="terracotta" className="gap-2" onClick={() => setShowFund(!showFund)}><Plus className="h-4 w-4" />{showFund ? "Cancel" : "Fund Wallet"}</Button></div>

      {justFunded && <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200"><CheckCircle2 className="h-4 w-4 text-emerald-500" /><p className="text-sm text-emerald-700">Payment successful! Your wallet has been funded.</p></div>}

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-terracotta-500 to-terracotta-600 text-white border-0 col-span-2 sm:col-span-1">
          <CardContent className="p-6"><p className="text-white/70 text-sm mb-1">Available Balance</p><p className="text-3xl font-bold">{formatCurrency(balance)}</p></CardContent>
        </Card>
        <StatsCard title="Total Funded" value={formatCurrency(transactions.filter((t: any) => t.type === "WALLET_TOPUP").reduce((s: number, t: any) => s + t.amount, 0))} icon={<ArrowUpRight className="h-5 w-5" />} />
      </div>

      {showFund && <Card className="border-terracotta-200 bg-terracotta-50/20"><CardHeader><CardTitle className="text-base">Fund Wallet via Paystack</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">{[5000, 10000, 50000, 100000].map(a => <button key={a} onClick={() => setAmount(String(a))} className={cn("p-3 rounded-lg border text-center text-sm font-medium", parseInt(amount) === a ? "border-terracotta-500 bg-terracotta-50" : "border-border")}>{formatCurrency(a)}</button>)}</div>
        <div><label className="text-sm font-medium mb-1.5 block">Custom Amount (₦)</label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Min ₦100" /></div>
        <Button variant="terracotta" disabled={!amount || parseInt(amount) < 100 || funding} onClick={fundWallet} className="gap-2">{funding && <Loader2 className="h-4 w-4 animate-spin" />}<CreditCard className="h-4 w-4" />Pay {amount ? formatCurrency(parseInt(amount)) : ""} with Paystack</Button>
      </CardContent></Card>}

      <Card><CardHeader><CardTitle className="text-base">Transaction History</CardTitle></CardHeader><CardContent className="p-0">
        {transactions.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
        : transactions.map((t: any) => (
          <div key={t.id} className="flex items-center justify-between px-5 py-4 border-b last:border-0">
            <div><p className="text-sm font-medium">{t.description || t.type.replace("_", " ")}</p><p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p></div>
            <span className={cn("text-sm font-semibold", t.type === "WALLET_TOPUP" ? "text-emerald-600" : "text-red-500")}>{t.type === "WALLET_TOPUP" ? "+" : "-"}{formatCurrency(t.amount)}</span>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}

export default function WalletPage() {
  return <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>}><WalletContent /></Suspense>;
}

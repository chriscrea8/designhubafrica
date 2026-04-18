"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, Plus, DollarSign, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency, cn } from "@/lib/utils";

export default function WalletPage() {
  const { data: session } = useSession();
  const [showFund, setShowFund] = useState(false);
  const [amount, setAmount] = useState("");
  const [funding, setFunding] = useState(false);

  async function fundWallet() {
    if (!amount || parseInt(amount) < 1000) return;
    setFunding(true);
    const res = await fetch("/api/payments/initialize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: parseInt(amount), email: session?.user?.email, callbackUrl: `${window.location.origin}/wallet?funded=true` }) });
    const json = await res.json();
    setFunding(false);
    if (json.success && json.data?.authorizationUrl) window.location.href = json.data.authorizationUrl;
    else alert("Payment initialization failed");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Wallet</h1><p className="text-sm text-muted-foreground mt-1">Manage your funds</p></div><Button variant="terracotta" className="gap-2" onClick={() => setShowFund(!showFund)}><Plus className="h-4 w-4" />{showFund ? "Cancel" : "Fund Wallet"}</Button></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Balance" value={formatCurrency(0)} icon={<Wallet className="h-5 w-5" />} />
        <StatsCard title="In Escrow" value={formatCurrency(0)} icon={<DollarSign className="h-5 w-5" />} />
        <StatsCard title="Total Spent" value={formatCurrency(0)} icon={<ArrowUpRight className="h-5 w-5" />} />
        <StatsCard title="Refunds" value={formatCurrency(0)} icon={<ArrowDownLeft className="h-5 w-5" />} />
      </div>
      {showFund && <Card className="border-terracotta-200 bg-terracotta-50/20"><CardHeader><CardTitle className="text-base">Fund Wallet</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">{[500000, 1000000, 2000000, 5000000].map(a => <button key={a} onClick={() => setAmount(String(a))} className={cn("p-3 rounded-lg border text-center text-sm font-medium", parseInt(amount) === a ? "border-terracotta-500 bg-terracotta-50" : "border-border")}>{formatCurrency(a)}</button>)}</div>
        <div><label className="text-sm font-medium mb-1.5 block">Custom Amount</label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Min ₦1,000" /></div>
        <Button variant="terracotta" disabled={!amount || parseInt(amount) < 1000 || funding} onClick={fundWallet} className="gap-2">{funding && <Loader2 className="h-4 w-4 animate-spin" />}<CreditCard className="h-4 w-4" />Pay with Paystack</Button>
      </CardContent></Card>}
      <Card><CardHeader><CardTitle className="text-base">Transaction History</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground text-center py-6">No transactions yet</p></CardContent></Card>
    </div>
  );
}

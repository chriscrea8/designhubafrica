"use client";
import React, { useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, Plus, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Separator, Input } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency, cn } from "@/lib/utils";

export default function WalletPage() {
  const [showFund, setShowFund] = useState(false);
  const [amount, setAmount] = useState("");
  const balance = 3500000; const escrowHeld = 5000000; const totalSpent = 8500000;

  const transactions = [
    { id: "t1", desc: "Escrow deposit — Lekki Penthouse", amount: -3500000, type: "escrow", date: "2025-02-10" },
    { id: "t2", desc: "Milestone released — Concept Phase", amount: -1500000, type: "release", date: "2025-02-15" },
    { id: "t3", desc: "Wallet top-up", amount: 5000000, type: "topup", date: "2025-02-08" },
    { id: "t4", desc: "Subscription — Pro plan", amount: -15000, type: "subscription", date: "2025-03-01" },
    { id: "t5", desc: "Refund — Dispute #127", amount: 250000, type: "refund", date: "2025-03-05" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Wallet</h1><p className="text-sm text-muted-foreground mt-1">Manage your funds</p></div><Button variant="terracotta" className="gap-2" onClick={() => setShowFund(!showFund)}><Plus className="h-4 w-4" />Fund Wallet</Button></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Balance" value={formatCurrency(balance)} icon={<Wallet className="h-5 w-5" />} />
        <StatsCard title="In Escrow" value={formatCurrency(escrowHeld)} icon={<DollarSign className="h-5 w-5" />} />
        <StatsCard title="Total Spent" value={formatCurrency(totalSpent)} icon={<ArrowUpRight className="h-5 w-5" />} />
        <StatsCard title="Refunds" value={formatCurrency(250000)} icon={<ArrowDownLeft className="h-5 w-5" />} />
      </div>

      {showFund && <Card className="border-terracotta-200 bg-terracotta-50/20"><CardHeader><CardTitle className="text-base">Fund Wallet</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">{[500000, 1000000, 2000000, 5000000].map(a => <button key={a} onClick={() => setAmount(String(a))} className={cn("p-3 rounded-lg border text-center text-sm font-medium", parseInt(amount) === a ? "border-terracotta-500 bg-terracotta-50" : "border-border")}>{formatCurrency(a)}</button>)}</div>
        <div><label className="text-sm font-medium mb-1.5 block">Custom Amount</label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" /></div>
        <Button variant="terracotta" disabled={!amount} className="gap-2"><CreditCard className="h-4 w-4" />Pay with Paystack</Button>
      </CardContent></Card>}

      <Card><CardHeader><CardTitle className="text-base">Transaction History</CardTitle></CardHeader><CardContent className="p-0">
        {transactions.map(t => (
          <div key={t.id} className="flex items-center justify-between px-5 py-4 border-b last:border-0">
            <div className="flex items-center gap-3"><div className={cn("h-8 w-8 rounded-full flex items-center justify-center", t.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500")}>{t.amount > 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}</div><div><p className="text-sm font-medium">{t.desc}</p><p className="text-xs text-muted-foreground">{t.date}</p></div></div>
            <span className={cn("text-sm font-semibold", t.amount > 0 ? "text-emerald-600" : "text-red-500")}>{t.amount > 0 ? "+" : ""}{formatCurrency(Math.abs(t.amount))}</span>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}

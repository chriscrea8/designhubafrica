"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DollarSign, ArrowUpRight, ArrowDownLeft, Wallet, Loader2, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Separator } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import Link from "next/link";

export default function EarningsPage() {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bank, setBank] = useState<any>(null);
  const [loadingBank, setLoadingBank] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);

  const earnings = [
    { id: "e1", description: "Concept & Mood Board — Lekki Penthouse", amount: 1425000, status: "available", date: "2025-02-15", type: "milestone" },
    { id: "e2", description: "Kitchen Layout — Abuja Villa", amount: 760000, status: "available", date: "2025-03-05", type: "milestone" },
    { id: "e3", description: "Withdrawal to GTBank", amount: -500000, status: "withdrawn", date: "2025-03-01", type: "withdrawal" },
  ];
  const available = 2185000;

  useEffect(() => {
    fetch("/api/bank").then(r => r.json()).then(res => { if (res.success && res.data) setBank(res.data); setLoadingBank(false); }).catch(() => setLoadingBank(false));
  }, []);

  async function handleWithdraw() {
    const amt = parseInt(withdrawAmount);
    if (!amt || amt < 1000) { alert("Minimum withdrawal is ₦1,000"); return; }
    if (amt > available) { alert("Insufficient balance"); return; }
    if (!bank) { alert("Please set up your bank account in Settings first"); return; }
    setWithdrawing(true);
    // In production this would call a payout API
    setTimeout(() => { setWithdrawing(false); setWithdrawn(true); setShowWithdraw(false); setWithdrawAmount(""); setTimeout(() => setWithdrawn(false), 5000); }, 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Earnings</h1><p className="text-sm text-muted-foreground mt-1">Track income and withdraw</p></div>
        <Button variant="terracotta" className="gap-2" onClick={() => setShowWithdraw(!showWithdraw)}><Wallet className="h-4 w-4" />{showWithdraw ? "Cancel" : "Withdraw"}</Button>
      </div>

      {withdrawn && <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200"><CheckCircle2 className="h-4 w-4 text-emerald-500" /><p className="text-sm text-emerald-700">Withdrawal request submitted! Funds will arrive within 24 hours.</p></div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Available" value={formatCurrency(available)} icon={<Wallet className="h-5 w-5" />} />
        <StatsCard title="Pending" value={formatCurrency(1900000)} icon={<DollarSign className="h-5 w-5" />} />
        <StatsCard title="Total Earned" value={formatCurrency(4585000)} change={18} changeLabel="vs last month" icon={<ArrowUpRight className="h-5 w-5" />} />
        <StatsCard title="Withdrawn" value={formatCurrency(500000)} icon={<ArrowDownLeft className="h-5 w-5" />} />
      </div>

      {showWithdraw && (
        <Card className="border-terracotta-200 bg-terracotta-50/30"><CardHeader><CardTitle className="text-base">Withdraw Funds</CardTitle></CardHeader><CardContent className="space-y-4">
          {/* Saved bank details */}
          {loadingBank ? <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Loading bank details...</span></div>
          : bank ? (
            <div className="p-3 rounded-lg bg-white border">
              <div className="flex items-center gap-3"><CreditCard className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm font-medium">{bank.bankName}</p><p className="text-xs text-muted-foreground">{bank.accountNumber} • {bank.accountName}</p></div></div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200"><AlertCircle className="h-4 w-4 text-amber-600" /><p className="text-sm text-amber-700">No bank account saved. <Link href="/designer-settings" className="font-semibold underline">Add bank details in Settings</Link></p></div>
          )}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Amount (NGN)</label>
            <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Minimum ₦1,000" />
            <p className="text-xs text-muted-foreground mt-1">Available: {formatCurrency(available)} • Minimum: ₦1,000</p>
          </div>
          <Button variant="terracotta" onClick={handleWithdraw} disabled={!bank || !withdrawAmount || parseInt(withdrawAmount) < 1000 || withdrawing} className="gap-2">{withdrawing && <Loader2 className="h-4 w-4 animate-spin" />}Withdraw {withdrawAmount && parseInt(withdrawAmount) >= 1000 ? formatCurrency(parseInt(withdrawAmount)) : ""}</Button>
        </CardContent></Card>
      )}

      <Card><CardHeader><CardTitle className="text-base">Transaction History</CardTitle></CardHeader><CardContent className="p-0">
        {earnings.map(e => (
          <div key={e.id} className="flex items-center justify-between px-5 py-4 border-b last:border-0">
            <div className="flex items-center gap-3">
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", e.type === "withdrawal" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600")}>{e.type === "withdrawal" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}</div>
              <div><p className="text-sm font-medium">{e.description}</p><p className="text-xs text-muted-foreground">{formatDate(e.date)}</p></div>
            </div>
            <div className="text-right"><p className={cn("text-sm font-semibold", e.amount < 0 ? "text-red-500" : "text-emerald-600")}>{e.amount < 0 ? "-" : "+"}{formatCurrency(Math.abs(e.amount))}</p><Badge variant={e.status === "available" ? "success" : "secondary"} className="text-[10px]">{e.status}</Badge></div>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}

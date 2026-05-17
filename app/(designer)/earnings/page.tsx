"use client";
import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle2, Loader2, AlertCircle, Banknote, ArrowDownToLine, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export default function EarningsPage() {
  const [earnings,  setEarnings]  = useState<any[]>([]);
  const [payouts,   setPayouts]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [amount,    setAmount]    = useState("");
  const [requesting, setRequesting] = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [eRes, pRes] = await Promise.all([
      fetch("/api/earnings").then(r => r.json()).catch(() => ({ data: [] })),
      fetch("/api/payouts").then(r => r.json()).catch(() => ({ data: [] })),
    ]);
    if (eRes.success) setEarnings(eRes.data || []);
    if (pRes.success) setPayouts(pRes.data || []);
    setLoading(false);
  }

  const available  = earnings.filter(e => e.status === "available").reduce((s: number, e: any) => s + e.amount, 0);
  const withdrawn  = earnings.filter(e => e.status === "withdrawn").reduce((s: number, e: any) => s + e.amount, 0);
  const total      = earnings.reduce((s: number, e: any) => s + e.amount, 0);

  async function requestPayout() {
    const amt = parseInt(amount);
    if (!amt || amt < 1000) { setError("Minimum payout is ₦1,000"); return; }
    if (amt > available) { setError(`Cannot exceed available balance of ${formatCurrency(available)}`); return; }
    setRequesting(true); setError(""); setSuccess("");
    const res = await fetch("/api/payouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: amt }) });
    const json = await res.json();
    setRequesting(false);
    if (json.success) { setSuccess(`Payout of ${formatCurrency(amt)} initiated! Ref: ${json.data?.reference}`); setAmount(""); load(); }
    else setError(json.error || "Payout failed. Check your bank details.");
  }

  const statusStyle: Record<string, string> = {
    available: "bg-emerald-50 text-emerald-700",
    withdrawn: "bg-gray-100 text-gray-600",
    pending:   "bg-yellow-50 text-yellow-700",
    processing:"bg-blue-50 text-blue-700",
    completed: "bg-emerald-50 text-emerald-700",
    failed:    "bg-red-50 text-red-700",
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Earnings & Payouts</h1><p className="text-sm text-muted-foreground mt-1">Track your milestone payments and request payouts</p></div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-terracotta-500 to-terracotta-600 border-0 text-white">
          <CardContent className="p-5"><p className="text-white/70 text-xs mb-1">Available</p><p className="text-2xl font-bold">{formatCurrency(available)}</p></CardContent>
        </Card>
        <StatsCard title="Total Earned" value={formatCurrency(total)} icon={<TrendingUp className="h-5 w-5" />} />
        <StatsCard title="Withdrawn"    value={formatCurrency(withdrawn)} icon={<ArrowDownToLine className="h-5 w-5" />} />
        <StatsCard title="Transactions" value={earnings.length}           icon={<Banknote className="h-5 w-5" />} />
      </div>

      {/* Payout Request */}
      {available >= 1000 && (
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-600" />Request Payout</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Available: <strong className="text-emerald-600">{formatCurrency(available)}</strong></p>
            <div className="flex gap-3 flex-wrap">
              {[5000, 10000, 25000, 50000].filter(v => v <= available).map(v => (
                <button key={v} onClick={() => setAmount(String(v))} className={cn("px-3 py-1.5 rounded-lg border text-sm font-medium transition-all", amount === String(v) ? "border-terracotta-500 bg-terracotta-50 text-terracotta-600" : "border-border text-muted-foreground hover:border-foreground/30")}>{formatCurrency(v)}</button>
              ))}
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Custom amount" className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-36" />
            </div>
            {error   && <p className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle className="h-4 w-4" />{error}</p>}
            {success && <p className="text-sm text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" />{success}</p>}
            <Button variant="terracotta" onClick={requestPayout} disabled={requesting || !amount} className="gap-2">
              {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
              {requesting ? "Processing..." : `Withdraw ${amount ? formatCurrency(parseInt(amount) || 0) : ""}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Earnings History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Earnings History</CardTitle><button onClick={load} className="text-muted-foreground hover:text-foreground"><RefreshCw className="h-4 w-4" /></button></CardHeader>
        <CardContent className="p-0">
          {earnings.length === 0
            ? <p className="text-sm text-muted-foreground text-center py-8">No earnings yet. Complete milestones to earn.</p>
            : earnings.map(e => (
                <div key={e.id} className="flex items-center justify-between px-5 py-4 border-b last:border-0 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", e.status === "available" ? "bg-emerald-100" : "bg-gray-100")}>
                      {e.status === "available" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <ArrowDownToLine className="h-4 w-4 text-gray-500" />}
                    </div>
                    <div className="min-w-0"><p className="text-sm font-medium line-clamp-1">{e.description}</p><p className="text-xs text-muted-foreground">{formatDate(e.createdAt)}</p></div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-emerald-600">+{formatCurrency(e.amount)}</span>
                    <Badge className={cn("text-[10px]", statusStyle[e.status] || "")}>{e.status}</Badge>
                  </div>
                </div>
              ))}
        </CardContent>
      </Card>

      {/* Payout History */}
      {payouts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Payout History</CardTitle></CardHeader>
          <CardContent className="p-0">
            {payouts.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4 border-b last:border-0 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{p.description || "Payout"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.reference || "—"} · {formatDate(p.createdAt)}</p>
                  {p.failureReason && <p className="text-xs text-red-500 mt-0.5">{p.failureReason}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold">{formatCurrency(p.amount)}</span>
                  <Badge className={cn("text-[10px]", statusStyle[p.status] || "")}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export default function AdminFinancialPage() {
  const [data,    setData]    = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/financial").then(r => r.json()).catch(() => ({})),
      fetch("/api/payouts").then(r => r.json()).catch(() => ({})),
    ]).then(([fin, pay]) => {
      if (fin.success) setData(fin.data);
      if (pay.success) setPayouts(pay.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  const stats = data || {};

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Financial Oversight</h1><p className="text-sm text-muted-foreground mt-1">Platform revenue, escrow, and payout tracking</p></div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-terracotta-500 to-terracotta-600 border-0 text-white">
          <CardContent className="p-5"><p className="text-white/70 text-xs mb-1">Total Revenue (GMV)</p><p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue || 0)}</p></CardContent>
        </Card>
        <StatsCard title="Platform Commission" value={formatCurrency(stats.totalCommission || 0)} icon={<DollarSign className="h-5 w-5" />} />
        <StatsCard title="Escrow Balance" value={formatCurrency(stats.escrowBalance || 0)} icon={<Shield className="h-5 w-5" />} />
        <StatsCard title="Total Payouts" value={formatCurrency(stats.totalPayouts || 0)} icon={<ArrowUpRight className="h-5 w-5" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payment Logs */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Transactions</CardTitle></CardHeader>
          <CardContent className="p-0">
            {(stats.recentTransactions || []).length === 0
              ? <p className="text-sm text-muted-foreground text-center py-6">No transactions yet</p>
              : (stats.recentTransactions || []).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3 border-b last:border-0 gap-3">
                    <div>
                      <p className="text-sm font-medium">{t.type?.replace(/_/g," ")}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                    </div>
                    <span className={cn("text-sm font-bold", ["DEPOSIT","COMMISSION"].includes(t.type) ? "text-emerald-600" : "text-gray-700")}>
                      {["DEPOSIT","COMMISSION"].includes(t.type) ? "+" : "-"}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader><CardTitle className="text-base">Payout History</CardTitle></CardHeader>
          <CardContent className="p-0">
            {payouts.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-6">No payouts yet</p>
              : payouts.slice(0, 10).map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 border-b last:border-0 gap-3">
                    <div>
                      <p className="text-sm font-medium">{p.description || "Designer Payout"}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.reference?.slice(-10) || "—"} · {formatDate(p.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(p.amount)}</p>
                      <Badge className={cn("text-[10px]", p.status === "completed" ? "bg-emerald-50 text-emerald-700" : p.status === "failed" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700")}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

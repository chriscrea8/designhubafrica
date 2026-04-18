"use client";
import React, { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { Card, CardContent, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export default function InvoicesPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(res => {
      if (res.success) setProjects(res.data?.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Extract milestones from projects as "invoices"
  const invoices = projects.flatMap(p => (p.milestones || []).map((ms: any) => ({ ...ms, projectTitle: p.title })));

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Payment History</h1><p className="text-sm text-muted-foreground mt-1">Milestone payments for your projects</p></div>
      {invoices.length === 0 ? <EmptyState icon={<FileText className="h-12 w-12" />} title="No payments yet" description="Payments will appear here when you fund project milestones" /> : (
        <Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/30"><th className="text-left font-medium px-5 py-3">Project</th><th className="text-left font-medium px-5 py-3">Milestone</th><th className="text-left font-medium px-5 py-3">Amount</th><th className="text-left font-medium px-5 py-3">Status</th><th className="text-left font-medium px-5 py-3">Date</th></tr></thead>
          <tbody>{invoices.map((inv: any) => (
            <tr key={inv.id} className="border-b last:border-0 hover:bg-accent/30"><td className="px-5 py-3">{inv.projectTitle}</td><td className="px-5 py-3">{inv.title}</td><td className="px-5 py-3 font-medium">{formatCurrency(inv.amount)}</td><td className="px-5 py-3"><Badge variant={inv.status === "paid" ? "success" : inv.status === "in_progress" ? "warning" : "secondary"} className="text-[10px] capitalize">{inv.status}</Badge></td><td className="px-5 py-3 text-muted-foreground">{inv.paidAt ? formatDate(inv.paidAt) : "—"}</td></tr>
          ))}</tbody>
        </table></div></CardContent></Card>
      )}
    </div>
  );
}

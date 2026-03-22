"use client";
import React from "react";
import { FileText, Download, Eye } from "lucide-react";
import { Card, CardContent, Button, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

export default function InvoicesPage() {
  const invoices = [
    { id: "inv-001", project: "Lekki Penthouse Redesign", amount: 1500000, status: "paid", date: "2025-02-15", milestone: "Concept & Mood Board" },
    { id: "inv-002", project: "Lekki Penthouse Redesign", amount: 2000000, status: "pending", date: "2025-03-10", milestone: "3D Visualization" },
    { id: "inv-003", project: "Abuja Villa Kitchen", amount: 800000, status: "paid", date: "2025-02-20", milestone: "Kitchen Layout" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Invoices</h1>
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/30"><th className="text-left font-medium px-5 py-3">Invoice</th><th className="text-left font-medium px-5 py-3">Project</th><th className="text-left font-medium px-5 py-3">Milestone</th><th className="text-left font-medium px-5 py-3">Amount</th><th className="text-left font-medium px-5 py-3">Status</th><th className="text-left font-medium px-5 py-3">Date</th><th className="px-5 py-3"></th></tr></thead>
            <tbody>{invoices.map(inv => (
              <tr key={inv.id} className="border-b last:border-0 hover:bg-accent/30"><td className="px-5 py-3 font-mono text-xs">{inv.id}</td><td className="px-5 py-3">{inv.project}</td><td className="px-5 py-3 text-muted-foreground">{inv.milestone}</td><td className="px-5 py-3 font-medium">{formatCurrency(inv.amount)}</td><td className="px-5 py-3"><Badge variant={inv.status === "paid" ? "success" : "warning"} className="text-[10px] capitalize">{inv.status}</Badge></td><td className="px-5 py-3 text-muted-foreground">{inv.date}</td><td className="px-5 py-3"><Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /></Button></td></tr>
            ))}</tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  );
}

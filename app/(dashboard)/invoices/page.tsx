"use client";
import React, { useEffect, useState } from "react";
import { FileText, Download, ExternalLink } from "lucide-react";
import { Card, CardContent, Button, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices?role=client").then(r => r.json()).then(res => {
      if (res.success) setInvoices(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statusColors: any = { DRAFT: "bg-gray-100 text-gray-600", SENT: "bg-blue-50 text-blue-700", PAID: "bg-emerald-50 text-emerald-700" };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Invoices</h1><p className="text-sm text-muted-foreground mt-1">Invoices sent to you by designers</p></div>
      {invoices.length === 0
        ? <EmptyState icon={<FileText className="h-12 w-12" />} title="No invoices yet" description="Invoices from designers will appear here" />
        : <div className="space-y-3">{invoices.map(inv => (
            <Card key={inv.id}><CardContent className="p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold">{inv.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">From: {inv.designer?.user?.firstName} {inv.designer?.user?.lastName}</p>
                {inv.project && <p className="text-xs text-muted-foreground">Project: {inv.project.title}</p>}
                <p className="text-lg font-bold mt-1">{formatCurrency(inv.totalAmount)}</p>
                {inv.dueDate && <p className="text-xs text-muted-foreground">Due: {formatDate(inv.dueDate)}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn("text-[10px]", statusColors[inv.status])}>{inv.status}</Badge>
                <Button variant="outline" size="sm" onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, "_blank")} className="gap-1">
                  <Download className="h-3 w-3" />Download
                </Button>
              </div>
            </CardContent></Card>
          ))}</div>
      }
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { FileText, Download, ExternalLink, Calendar } from "lucide-react";
import { Card, CardContent, Button, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT:  "bg-blue-50 text-blue-700",
  PAID:  "bg-emerald-50 text-emerald-700",
};

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch("/api/invoices?role=client").then(r => r.json()).then(res => {
      if (res.success) setInvoices(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Invoices</h1><p className="text-sm text-muted-foreground mt-1">Invoices received from designers</p></div>

      {invoices.length === 0 ? (
        <EmptyState icon={<FileText className="h-12 w-12" />} title="No invoices yet" description="Invoices from designers will appear here" />
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <Card key={inv.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{inv.title}</h3>
                    <Badge className={cn("text-[10px]", STATUS_STYLE[inv.status] || "")}>{inv.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    From: {inv.designer?.user?.firstName} {inv.designer?.user?.lastName}
                    {inv.project && ` · ${inv.project.title}`}
                  </p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-base font-bold">{formatCurrency(inv.totalAmount)}</span>
                    {inv.dueDate && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />Due {formatDate(inv.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, "_blank")} className="gap-1.5">
                    <Download className="h-3 w-3" />Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

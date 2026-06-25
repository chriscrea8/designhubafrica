"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Clock, CheckCircle2, XCircle, MessageSquare, ChevronRight } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  SUBMITTED:"bg-blue-50 text-blue-700", QUOTED:"bg-amber-50 text-amber-700",
  ACCEPTED:"bg-emerald-50 text-emerald-700", DECLINED:"bg-red-50 text-red-700",
  EXPIRED:"bg-gray-100 text-gray-500", CLOSED:"bg-gray-100 text-gray-500",
};

export default function RFQListPage() {
  const [rfqs,    setRFQs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rfq?mine=true").then(r=>r.json()).then(res => {
      if (res.success) setRFQs(res.data?.items || []);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">My RFQs</h1><p className="text-sm text-muted-foreground mt-1">Request quotes from verified vendors</p></div>
        <Button variant="terracotta" asChild className="gap-2"><Link href="/rfq/new"><Plus className="h-4 w-4"/>New Request</Link></Button>
      </div>

      {rfqs.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
          <p className="font-semibold text-lg">No quote requests yet</p>
          <p className="text-sm text-muted-foreground mt-1">Send RFQs to get pricing from multiple vendors at once</p>
          <Button variant="terracotta" className="mt-4" asChild><Link href="/rfq/new">Create Your First RFQ</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rfqs.map((r:any) => (
            <Link href={`/rfq/${r.id}`} key={r.id}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold">{r.title}</p>
                      <Badge className={cn("text-[10px]", STATUS_STYLE[r.status]||"")}>{r.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{r.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="font-mono text-[11px]">{r.rfqNumber}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3"/>{r._count?.quotes || 0} quotes</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{formatDate(r.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1"/>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

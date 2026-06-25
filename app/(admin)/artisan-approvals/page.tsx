"use client";
import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, ShieldOff, Loader2, Eye } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = { PENDING:"bg-amber-50 text-amber-700", VERIFIED:"bg-emerald-50 text-emerald-700", REJECTED:"bg-red-50 text-red-700", SUSPENDED:"bg-gray-100 text-gray-600" };

export default function ArtisanApprovalsPage() {
  const [items, setItems]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("PENDING");
  const [acting, setActing]     = useState<string|null>(null);

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/artisan-approvals?status=${filter}`).then(r=>r.json()).catch(()=>({}));
    if (res.success) setItems(res.data||[]);
    setLoading(false);
  }

  async function act(artisanId: string, action: string) {
    let reason = "";
    if (action === "reject") { reason = prompt("Reason for rejection:")||""; if (!reason) return; }
    setActing(artisanId);
    await fetch("/api/admin/artisan-approvals", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ artisanId, action, rejectedReason:reason }) });
    setActing(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Artisan Verifications</h1><p className="text-sm text-muted-foreground mt-1">Review and approve artisan identity submissions</p></div>
      <div className="flex gap-2 flex-wrap">
        {["PENDING","VERIFIED","REJECTED","SUSPENDED","ALL"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} className={cn("px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize",filter===s?"bg-terracotta-500 text-white border-terracotta-500":"border-border text-muted-foreground hover:border-foreground/40")}>{s.toLowerCase()}</button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-terracotta-500"/></div>
      : items.length===0 ? <p className="text-center text-muted-foreground py-10">No {filter.toLowerCase()} verifications</p>
      : <div className="space-y-4">
          {items.map((item:any)=>(
            <Card key={item.id}><CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{item.artisan?.user?.firstName} {item.artisan?.user?.lastName}</p>
                    <Badge className={cn("text-[10px]",STATUS_STYLE[item.status]||"")}>{item.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.artisan?.user?.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Trade: <strong>{item.artisan?.serviceCategory}</strong> · Submitted {formatDate(item.createdAt)}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {item.governmentIdUrl && <a href={item.governmentIdUrl} target="_blank" className="flex items-center gap-2 p-3 rounded-lg border text-sm hover:bg-accent"><Eye className="h-4 w-4 shrink-0"/>Government ID</a>}
                {item.selfieUrl && <a href={item.selfieUrl} target="_blank" className="flex items-center gap-2 p-3 rounded-lg border text-sm hover:bg-accent"><Eye className="h-4 w-4 shrink-0"/>Selfie</a>}
                {item.addressProofUrl && <a href={item.addressProofUrl} target="_blank" className="flex items-center gap-2 p-3 rounded-lg border text-sm hover:bg-accent"><Eye className="h-4 w-4 shrink-0"/>Address Proof</a>}
              </div>
              {item.address && <p className="text-sm text-muted-foreground">Address: {item.address}</p>}
              {item.rejectedReason && <div className="p-3 rounded-lg bg-red-50 border border-red-200"><p className="text-xs text-red-700">Rejection reason: {item.rejectedReason}</p></div>}
              {item.status==="PENDING" && (
                <div className="flex gap-2">
                  {acting===item.artisanId ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/> : (<>
                    <Button variant="terracotta" size="sm" onClick={()=>act(item.artisanId,"approve")} className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5"/>Approve</Button>
                    <Button variant="outline" size="sm" onClick={()=>act(item.artisanId,"reject")} className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50"><XCircle className="h-3.5 w-3.5"/>Reject</Button>
                    <Button variant="outline" size="sm" onClick={()=>act(item.artisanId,"suspend")} className="gap-1.5 text-gray-500"><ShieldOff className="h-3.5 w-3.5"/>Suspend</Button>
                  </>)}
                </div>
              )}
            </CardContent></Card>
          ))}
        </div>}
    </div>
  );
}

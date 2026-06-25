"use client";
import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, Eye, Loader2, ExternalLink, Shield } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  PENDING:"bg-amber-50 text-amber-700", APPROVED:"bg-emerald-50 text-emerald-700",
  REJECTED:"bg-red-50 text-red-700", RESUBMISSION_REQUIRED:"bg-orange-50 text-orange-700",
};
const LEVELS = ["LEVEL_1_IDENTITY_VERIFIED","LEVEL_2_BUSINESS_VERIFIED","LEVEL_3_ADDRESS_VERIFIED","LEVEL_4_PREMIUM_VERIFIED"];

export default function BusinessApprovalsPage() {
  const [verifs,  setVerifs]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("PENDING");
  const [acting,  setActing]  = useState<string|null>(null);
  const [modal,   setModal]   = useState<any>(null);
  const [notes,   setNotes]   = useState("");
  const [level,   setLevel]   = useState("LEVEL_2_BUSINESS_VERIFIED");

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/business-verifications?status=${filter}`).then(r=>r.json()).catch(()=>({}));
    if (res.success) setVerifs(res.data||[]);
    setLoading(false);
  }

  async function act(verificationId: string, action: string) {
    setActing(verificationId+action);
    await fetch("/api/admin/business-verifications", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ verificationId, action, notes, level }) });
    setActing(null); setModal(null); setNotes(""); load();
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Business Verifications</h1><p className="text-sm text-muted-foreground mt-1">Review and approve business verification submissions</p></div>

      <div className="flex gap-2 flex-wrap">
        {["PENDING","APPROVED","REJECTED","RESUBMISSION_REQUIRED","ALL"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} className={cn("px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize", filter===s?"bg-terracotta-500 text-white border-terracotta-500":"border-border text-muted-foreground hover:border-foreground/40")}>
            {s.replace(/_/g," ").toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-terracotta-500"/></div>
      : verifs.length === 0 ? <p className="text-center text-muted-foreground py-10">No {filter.toLowerCase()} submissions</p>
      : <div className="space-y-4">
          {verifs.map(v=>(
            <Card key={v.id}><CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{v.business?.businessName}</h3>
                    <Badge className={cn("text-[10px]", STATUS_STYLE[v.status]||"")}>{v.status}</Badge>
                    <span className="text-xs text-muted-foreground capitalize">{v.business?.businessType?.replace(/_/g," ").toLowerCase()}</span>
                  </div>
                  {v.submittedAt && <p className="text-xs text-muted-foreground">Submitted {formatDate(v.submittedAt)}</p>}
                  {v.rejectionReason && <p className="text-xs text-red-500 mt-1">{v.rejectionReason}</p>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={()=>setModal(v)} className="gap-1.5"><Eye className="h-3.5 w-3.5"/>Review</Button>
                  <a href={`/businesses/${v.business?.slug}`} target="_blank"><Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5"/>Profile</Button></a>
                </div>
              </div>

              {/* Document links */}
              <div className="flex gap-3 mt-3 flex-wrap text-xs">
                {v.ownerIdFrontUrl && <a href={v.ownerIdFrontUrl} target="_blank" className="text-terracotta-500 hover:underline">ID Front</a>}
                {v.ownerIdBackUrl  && <a href={v.ownerIdBackUrl}  target="_blank" className="text-terracotta-500 hover:underline">ID Back</a>}
                {v.ownerSelfieUrl  && <a href={v.ownerSelfieUrl}  target="_blank" className="text-terracotta-500 hover:underline">Selfie</a>}
                {v.cacCertificateUrl && <a href={v.cacCertificateUrl} target="_blank" className="text-terracotta-500 hover:underline">CAC Certificate</a>}
                {v.utilityBillUrl  && <a href={v.utilityBillUrl}  target="_blank" className="text-terracotta-500 hover:underline">Utility Bill</a>}
                {v.storefrontImages?.map((u:string,i:number)=><a key={i} href={u} target="_blank" className="text-terracotta-500 hover:underline">Storefront {i+1}</a>)}
              </div>
            </CardContent></Card>
          ))}
        </div>}

      {/* Review modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setModal(null)}>
          <div className="bg-background rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold mb-4">Review: {modal.business?.businessName}</h3>
            <div className="space-y-3">
              <div><label className="text-sm font-medium mb-1.5 block">Verification Level to Grant</label>
                <select value={level} onChange={e=>setLevel(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {LEVELS.map(l=><option key={l} value={l}>{l.replace(/_/g," ")}</option>)}
                </select></div>
              <div><label className="text-sm font-medium mb-1.5 block">Notes <span className="text-muted-foreground font-normal">(required for reject/request)</span></label>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Reason for decision…"/></div>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button variant="terracotta" size="sm" onClick={()=>act(modal.id,"approve")} disabled={!!acting} className="gap-1.5">
                {acting===modal.id+"approve"?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<CheckCircle2 className="h-3.5 w-3.5"/>}Approve
              </Button>
              <Button variant="outline" size="sm" onClick={()=>act(modal.id,"request_info")} disabled={!!acting} className="gap-1.5 text-amber-600 border-amber-200">
                {acting===modal.id+"request_info"?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Info className="h-3.5 w-3.5"/>}Request Info
              </Button>
              <Button variant="outline" size="sm" onClick={()=>act(modal.id,"reject")} disabled={!!acting||!notes} className="gap-1.5 text-red-500 border-red-200">
                {acting===modal.id+"reject"?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<XCircle className="h-3.5 w-3.5"/>}Reject
              </Button>
              <Button variant="outline" size="sm" onClick={()=>setModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

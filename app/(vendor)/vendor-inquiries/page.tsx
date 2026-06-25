"use client";
import React, { useEffect, useState } from "react";
import { MessageSquare, CheckCircle2, X, Loader2, Package } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  OPEN:"bg-amber-50 text-amber-700", RESPONDED:"bg-emerald-50 text-emerald-700", CLOSED:"bg-gray-100 text-gray-500"
};

export default function VendorInquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("OPEN");
  const [replyModal,setReplyModal]= useState<any>(null);
  const [reply,     setReply]     = useState("");
  const [sending,   setSending]   = useState(false);

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/vendor-inquiries${filter !== "ALL" ? `?status=${filter}` : ""}`).then(r=>r.json()).catch(()=>({}));
    if (res.success) setInquiries(res.data||[]);
    setLoading(false);
  }

  async function respond() {
    if (!reply.trim()) return;
    setSending(true);
    await fetch(`/api/vendor-inquiries/${replyModal.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ response: reply, status:"RESPONDED" }) });
    setSending(false); setReplyModal(null); setReply(""); load();
  }

  async function close(id: string) {
    await fetch(`/api/vendor-inquiries/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ status:"CLOSED" }) });
    load();
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Product Inquiries</h1><p className="text-sm text-muted-foreground mt-1">Respond to potential buyers about your products</p></div>

      <div className="flex gap-2 flex-wrap">
        {["OPEN","RESPONDED","CLOSED","ALL"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} className={cn("px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize", filter===s?"bg-terracotta-500 text-white border-terracotta-500":"border-border text-muted-foreground hover:border-foreground/40")}>{s.toLowerCase()}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-terracotta-500"/></div>
      : inquiries.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
          <p className="font-semibold">No {filter.toLowerCase()} inquiries</p>
          <p className="text-sm text-muted-foreground mt-1">Inquiries from interested buyers will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq:any)=>(
            <Card key={inq.id} className={cn(inq.status==="OPEN"?"border-amber-200 bg-amber-50/5":"")}><CardContent className="p-5">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="h-10 w-10 rounded-full bg-terracotta-100 flex items-center justify-center font-bold text-terracotta-600 shrink-0">{inq.user?.firstName?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-sm">{inq.user?.firstName} {inq.user?.lastName}</p>
                    <Badge className={cn("text-[10px]", STATUS_STYLE[inq.status]||"")}>{inq.status}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(inq.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Package className="h-3 w-3 shrink-0"/>{inq.product?.name}
                  </div>
                  <p className="text-sm bg-muted/40 rounded-lg p-3">{inq.message}</p>
                  {inq.response && <div className="mt-2"><p className="text-xs font-semibold text-muted-foreground mb-1">Your reply:</p><p className="text-sm bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">{inq.response}</p></div>}
                </div>
              </div>
              {inq.status === "OPEN" && (
                <div className="flex gap-2 mt-3">
                  <Button variant="terracotta" size="sm" onClick={()=>{setReplyModal(inq);setReply("");}} className="gap-1.5"><MessageSquare className="h-3.5 w-3.5"/>Reply</Button>
                  <Button variant="outline" size="sm" onClick={()=>close(inq.id)} className="gap-1.5 text-gray-500"><X className="h-3.5 w-3.5"/>Close</Button>
                </div>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}

      {/* Reply modal */}
      {replyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setReplyModal(null)}>
          <div className="bg-background rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold mb-1">Reply to Inquiry</h3>
            <p className="text-sm text-muted-foreground mb-1">From: {replyModal.user?.firstName} {replyModal.user?.lastName}</p>
            <p className="text-xs bg-muted/40 rounded-lg p-2 mb-3 text-muted-foreground">{replyModal.message}</p>
            <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={4} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Hi! Thanks for your interest. This product is available…"/>
            <div className="flex gap-2 mt-4">
              <Button variant="terracotta" className="flex-1" onClick={respond} disabled={sending||!reply.trim()}>
                {sending&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}Send Reply
              </Button>
              <Button variant="outline" onClick={()=>setReplyModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

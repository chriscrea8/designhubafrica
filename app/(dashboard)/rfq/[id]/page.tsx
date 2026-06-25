"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Bookmark, BookmarkCheck, Star, Clock, Package, MapPin, Loader2, Calendar } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

const STATUS_STYLE: Record<string,string> = {
  SUBMITTED:"bg-blue-50 text-blue-700", QUOTED:"bg-amber-50 text-amber-700",
  ACCEPTED:"bg-emerald-50 text-emerald-700", DECLINED:"bg-red-50 text-red-700",
};

function RFQDetailContent() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session } = useSession();
  const [rfq,       setRFQ]       = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [acting,    setActing]    = useState<string|null>(null);
  const [savedQuotes, setSavedQuotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    fetch(`/api/rfq/${id}`).then(r=>r.json()).then(res => {
      if (res.success) setRFQ(res.data);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [id]);

  const userId = (session?.user as any)?.id;
  const isOwner = rfq?.clientId === userId;

  async function actOnQuote(quoteId: string, action: "accept" | "decline") {
    setActing(quoteId + action);
    await fetch(`/api/rfq/${id}/quotes/${quoteId}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action }) });
    setActing(null);
    // Reload
    const res = await fetch(`/api/rfq/${id}`).then(r=>r.json());
    if (res.success) setRFQ(res.data);
  }

  async function toggleSaveQuote(quoteId: string) {
    const method = savedQuotes.has(quoteId) ? "DELETE" : "POST";
    await fetch("/api/marketplace/saved-quotes", { method, headers:{"Content-Type":"application/json"}, body:JSON.stringify({ quoteId }) });
    setSavedQuotes(prev => { const n = new Set(prev); n.has(quoteId) ? n.delete(quoteId) : n.add(quoteId); return n; });
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;
  if (!rfq) return <div className="text-center py-12 text-muted-foreground">RFQ not found</div>;

  const quotes = rfq.quotes || [];
  const accepted = quotes.find((q: any) => q.status === "ACCEPTED");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/rfq" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5"/></Link>
        <div className="flex-1"><h1 className="text-xl font-bold">{rfq.title}</h1><p className="text-xs font-mono text-muted-foreground">{rfq.rfqNumber}</p></div>
        <Badge className={cn("text-xs", STATUS_STYLE[rfq.status]||"")}>{rfq.status}</Badge>
      </div>

      {/* RFQ details */}
      <Card><CardContent className="p-5 space-y-3">
        <p className="text-muted-foreground text-sm leading-relaxed">{rfq.description}</p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm pt-2 border-t">
          {rfq.quantity         && <div><span className="text-muted-foreground">Quantity: </span>{rfq.quantity}</div>}
          {rfq.budgetMin        && <div><span className="text-muted-foreground">Budget: </span>{formatCurrency(rfq.budgetMin)}{rfq.budgetMax && ` – ${formatCurrency(rfq.budgetMax)}`}</div>}
          {rfq.deliveryLocation && <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-muted-foreground"/>{rfq.deliveryLocation}</div>}
          {rfq.requiredDate     && <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-muted-foreground"/>Required by {formatDate(rfq.requiredDate)}</div>}
        </div>
        {rfq.product && <div className="flex items-center gap-2 pt-2 border-t text-sm"><Package className="h-4 w-4 text-terracotta-500"/><span className="text-muted-foreground">Product: </span>{rfq.product.name}</div>}
      </CardContent></Card>

      {/* Quotes */}
      <div>
        <h2 className="font-bold mb-3">Quotes Received ({quotes.length})</h2>
        {quotes.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-xl">Waiting for vendors to respond…</p>
        ) : (
          <div className="space-y-3">
            {quotes.map((q: any) => {
              const vUser = q.vendor?.user;
              const isAccepted = q.status === "ACCEPTED";
              const isDeclined = q.status === "DECLINED";
              return (
                <Card key={q.id} className={cn(isAccepted && "border-emerald-300 bg-emerald-50/10")}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-12 w-12 rounded-xl bg-terracotta-100 flex items-center justify-center font-bold text-terracotta-600 shrink-0">{vUser?.firstName?.[0]||"V"}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{vUser?.firstName} {vUser?.lastName}</p>
                          {q.vendor?.approvalStatus === "APPROVED" && <Badge className="bg-emerald-50 text-emerald-700 text-[10px]">Verified</Badge>}
                          {isAccepted && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">✓ Accepted</Badge>}
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                          {q.estimatedPriceMin && <span className="font-bold text-foreground">{formatCurrency(q.estimatedPriceMin)}{q.estimatedPriceMax && ` – ${formatCurrency(q.estimatedPriceMax)}`}</span>}
                          {q.estimatedDelivery && <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{q.estimatedDelivery}</span>}
                          {q.validUntil && <span>Valid until {formatDate(q.validUntil)}</span>}
                        </div>
                      </div>
                      <button onClick={() => toggleSaveQuote(q.id)} title="Save quote" className="text-muted-foreground hover:text-terracotta-500 transition-colors shrink-0">
                        {savedQuotes.has(q.id) ? <BookmarkCheck className="h-5 w-5 text-terracotta-500"/> : <Bookmark className="h-5 w-5"/>}
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{q.message}</p>
                    {isOwner && !accepted && !isDeclined && q.status === "SUBMITTED" && (
                      <div className="flex gap-2 mt-3">
                        <Button variant="terracotta" size="sm" onClick={() => actOnQuote(q.id, "accept")} disabled={!!acting} className="gap-1.5">
                          {acting===q.id+"accept"?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<CheckCircle2 className="h-3.5 w-3.5"/>}Accept Quote
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => actOnQuote(q.id, "decline")} disabled={!!acting} className="gap-1.5 text-red-500 border-red-200">
                          <XCircle className="h-3.5 w-3.5"/>Decline
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RFQDetailPage() {
  return <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><RFQDetailContent/></Suspense>;
}

"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, DollarSign, Clock, Hammer, User, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

function JobRequestDetail() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [job,     setJob]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quoting, setQuoting] = useState(false);
  const [form,    setForm]    = useState({ amount:"", timeline:"", notes:"" });
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/job-requests/${params.id}`).then(r=>r.json()).then(res => {
      if (res.success) setJob(res.data);
      else router.push("/job-requests");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params?.id]);

  async function submitQuote() {
    if (!form.amount || !form.timeline) return;
    setSaving(true);
    const res = await fetch(`/api/job-requests/${params.id}/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(form.amount), timeline: form.timeline, notes: form.notes }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) { setQuoting(false); setJob((prev: any) => ({ ...prev, quotes: [...(prev.quotes||[]), json.data] })); }
  }

  const userId = (session?.user as any)?.id;
  const isOwner = job?.clientId === userId;
  const isArtisan = (session?.user as any)?.role === "ARTISAN";
  const myQuote = job?.quotes?.find((q: any) => q.artisan?.userId === userId);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;
  if (!job) return null;

  const STATUS_STYLE: Record<string,string> = { OPEN:"bg-emerald-50 text-emerald-700", IN_PROGRESS:"bg-blue-50 text-blue-700", COMPLETED:"bg-gray-100 text-gray-600", CANCELLED:"bg-red-50 text-red-700" };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/job-requests" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5"/></Link>
        <div className="flex-1"><h1 className="text-xl font-bold">{job.title}</h1></div>
        <Badge className={cn("text-xs", STATUS_STYLE[job.status]||"")}>{job.status}</Badge>
      </div>

      <Card><CardContent className="p-5 space-y-4">
        <p className="text-muted-foreground leading-relaxed">{job.description}</p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><Hammer className="h-4 w-4 text-terracotta-500 shrink-0"/><span className="capitalize">{job.category?.replace(/_/g," ").toLowerCase()}</span></div>
          {job.location && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-terracotta-500 shrink-0"/>{job.location}</div>}
          {job.budget && <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-4 w-4 text-terracotta-500 shrink-0"/>Budget: {formatCurrency(job.budget)}</div>}
          {job.deadline && <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4 text-terracotta-500 shrink-0"/>Deadline: {formatDate(job.deadline)}</div>}
          {job.duration && <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 text-terracotta-500 shrink-0"/>Duration: {job.duration}</div>}
        </div>
      </CardContent></Card>

      {/* Quotes */}
      {(isOwner || (job.quotes?.length > 0)) && (
        <div>
          <h2 className="font-semibold mb-3">Quotes ({job.quotes?.length || 0})</h2>
          <div className="space-y-3">
            {job.quotes?.map((q: any) => (
              <Card key={q.id}><CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-terracotta-100 flex items-center justify-center font-bold text-terracotta-600 shrink-0">{q.artisan?.user?.firstName?.[0]||"A"}</div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{q.artisan?.user?.firstName} {q.artisan?.user?.lastName}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="font-bold text-foreground">{formatCurrency(q.amount)}</span>
                    <span>{q.timeline}</span>
                  </div>
                  {q.notes && <p className="text-xs text-muted-foreground mt-1">{q.notes}</p>}
                </div>
                {isOwner && q.status === "PENDING" && (
                  <Button size="sm" variant="terracotta" className="gap-1.5 shrink-0" onClick={async () => {
                    await fetch(`/api/job-requests/${params.id}/quotes/${q.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"accept" }) });
                    window.location.reload();
                  }}><CheckCircle2 className="h-3.5 w-3.5"/>Accept</Button>
                )}
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}

      {/* Submit quote (artisans only) */}
      {isArtisan && !isOwner && job.status === "OPEN" && !myQuote && (
        <Card className="border-terracotta-200">
          <CardContent className="p-5">
            {!quoting ? (
              <Button variant="terracotta" onClick={() => setQuoting(true)} className="w-full gap-2"><Send className="h-4 w-4"/>Submit Quote</Button>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold">Submit Your Quote</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="text-sm font-medium mb-1.5 block">Your Price (₦)</label><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="50000" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
                  <div><label className="text-sm font-medium mb-1.5 block">Timeline</label><input value={form.timeline} onChange={e=>setForm({...form,timeline:e.target.value})} placeholder="e.g. 3 days" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
                </div>
                <div><label className="text-sm font-medium mb-1.5 block">Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe your approach…"/></div>
                <div className="flex gap-2">
                  <Button variant="terracotta" onClick={submitQuote} disabled={saving||!form.amount||!form.timeline} className="gap-2">{saving&&<Loader2 className="h-4 w-4 animate-spin"/>}Submit</Button>
                  <Button variant="outline" onClick={()=>setQuoting(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function JobRequestPage() {
  return <Suspense fallback={<div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><JobRequestDetail/></Suspense>;
}

"use client";
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, DollarSign, MessageSquare, AlertTriangle, MapPin, Star, XCircle, Loader2, Upload, CreditCard, Lock, Unlock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Progress, Separator } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const msColors: Record<string, string> = { paid: "bg-emerald-100 text-emerald-700", approved: "bg-emerald-50 text-emerald-600", released: "bg-emerald-50 text-emerald-600", submitted: "bg-blue-50 text-blue-600", completed: "bg-blue-50 text-blue-600", in_progress: "bg-amber-50 text-amber-600", pending: "bg-gray-100 text-gray-400" };

export default function ProjectDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const id = params?.id as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("milestones");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [revisionModal, setRevisionModal] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const funded = searchParams?.get("funded");
  const trxref = searchParams?.get("trxref") || searchParams?.get("reference");

  // Verify payment on return from Paystack
  useEffect(() => {
    if (trxref && id) {
      fetch(`/api/payments/verify?reference=${trxref}`).then(r => r.json()).then(() => {
        // Reload project to get updated milestone statuses
        setTimeout(() => loadProject(), 2000);
      }).catch(() => {});
    }
  }, [trxref, id]);

  async function loadProject() {
    const res = await fetch(`/api/projects/${id}`); const json = await res.json();
    if (json.success) setProject(json.data);
    setLoading(false);
  }
  useEffect(() => { if (id) loadProject(); }, [id]);

  async function fundMilestone(milestoneId: string) {
    setActionLoading(`fund-${milestoneId}`);
    const res = await fetch("/api/escrow/fund", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id, milestoneId }) });
    const json = await res.json();
    setActionLoading(null);
    if (json.success && json.data?.authorizationUrl) window.location.href = json.data.authorizationUrl;
    else alert(json.error || "Payment failed");
  }

  async function approveMilestone(milestoneId: string) {
    if (!confirm("Approve this milestone and release funds to the designer?")) return;
    setActionLoading(`approve-${milestoneId}`);
    const res = await fetch(`/api/milestones/${milestoneId}/approve`, { method: "POST" });
    const json = await res.json();
    setActionLoading(null);
    if (json.success) { alert(`Released ${formatCurrency(json.data.payout)} to designer. Commission: ${formatCurrency(json.data.commission)}`); loadProject(); }
    else alert(json.error || "Approval failed");
  }

  async function rejectMilestone(milestoneId: string) {
    const reason = prompt("Why are you requesting a revision?");
    if (!reason) return;
    setActionLoading(`reject-${milestoneId}`);
    await fetch(`/api/milestones/${milestoneId}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
    setActionLoading(null);
    loadProject();
  }

  async function submitReview() {
    if (!project?.designerId) return;
    await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ designerId: project.designerId, projectId: id, ...reviewForm, qualityRating: reviewForm.rating, communicationRating: reviewForm.rating, timelinessRating: reviewForm.rating, professionalismRating: reviewForm.rating }) });
    setShowReview(false); alert("Review submitted!");
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;
  if (!project) return <div className="text-center py-16"><h2 className="text-xl font-bold">Project not found</h2><Link href="/projects" className="text-sm text-terracotta-500 mt-2 inline-block">Back</Link></div>;

  const milestones = project.milestones || [];
  const escrow = project.escrowAccount;
  const proposals = project.proposals || [];
  const designer = project.designer;
  const isClient = project.clientId === session?.user?.id;
  const completedMs = milestones.filter((m: any) => ["paid", "approved", "released"].includes(m.status)).length;

  return (
    <div className="space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Projects</Link>

      {funded && <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200"><CheckCircle2 className="h-4 w-4 text-emerald-500" /><p className="text-sm text-emerald-700">Payment successful! Escrow has been funded.</p></div>}

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div><div className="flex items-center gap-3 flex-wrap"><h1 className="text-2xl font-bold">{project.title}</h1><Badge className={cn("capitalize", project.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700" : project.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : project.status === "OPEN" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700")}>{(project.status || "draft").replace("_", " ")}</Badge></div><div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">{project.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{project.location}</span>}<span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{formatCurrency(project.budgetMin)} – {formatCurrency(project.budgetMax)}</span></div></div>
        {isClient && project.status === "COMPLETED" && !showReview && <Button variant="terracotta" size="sm" onClick={() => setShowReview(true)} className="gap-2"><Star className="h-4 w-4" />Leave Review</Button>}
      </div>

      <Card><CardContent className="p-5"><div className="flex items-center justify-between mb-3"><span className="text-sm font-medium">Progress</span><span className="text-sm font-bold text-terracotta-500">{project.progress}%</span></div><Progress value={project.progress} className="h-3" /><p className="text-xs text-muted-foreground mt-2">{completedMs} of {milestones.length} milestones complete</p></CardContent></Card>

      {showReview && <Card className="border-terracotta-200"><CardHeader><CardTitle className="text-base">Rate Designer</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex gap-1">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setReviewForm(p => ({...p, rating: s}))}><Star className={cn("h-6 w-6", s <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} /></button>)}</div><textarea value={reviewForm.comment} onChange={e => setReviewForm(p => ({...p, comment: e.target.value}))} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Your experience..." /><div className="flex gap-2"><Button variant="terracotta" onClick={submitReview}>Submit</Button><Button variant="outline" onClick={() => setShowReview(false)}>Cancel</Button></div></CardContent></Card>}

      <div className="flex gap-1 border-b">{[{ id: "milestones", label: `Milestones (${milestones.length})` }, { id: "overview", label: "Overview" }, { id: "proposals", label: `Proposals (${proposals.length})` }].map(t => <button key={t.id} onClick={() => setTab(t.id)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap", tab === t.id ? "border-terracotta-500 text-foreground" : "border-transparent text-muted-foreground")}>{t.label}</button>)}</div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {tab === "overview" && <Card><CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p></CardContent></Card>}

          {tab === "milestones" && <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Milestone Tracker</CardTitle><p className="text-sm text-muted-foreground">Fund milestones to start work. Approve to release payment.</p></CardHeader><CardContent className="p-0">
            {milestones.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No milestones set up yet</div>
            : milestones.map((ms: any, i: number) => (
              <div key={ms.id} className={cn("px-5 py-4 border-b last:border-0", ms.status === "paid" && "bg-emerald-50/30")}>
                <div className="flex items-start gap-4">
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", msColors[ms.status] || msColors.pending)}>{["paid","approved","released"].includes(ms.status) ? "✓" : i + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between"><h4 className="font-semibold text-sm">{ms.title}</h4><Badge className={cn("text-[10px] capitalize", msColors[ms.status])}>{ms.status.replace("_", " ")}</Badge></div>
                    {ms.description && <p className="text-xs text-muted-foreground mt-1">{ms.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{formatCurrency(ms.amount)}</span>{ms.dueDate && <span>Due: {formatDate(ms.dueDate)}</span>}{ms.paidAt && <span className="text-emerald-600">Paid: {formatDate(ms.paidAt)}</span>}</div>

                    {/* Action Buttons */}
                    {isClient && ms.status === "pending" && (
                      <Button variant="terracotta" size="sm" className="mt-3 gap-1.5" onClick={() => fundMilestone(ms.id)} disabled={actionLoading === `fund-${ms.id}`}>
                        {actionLoading === `fund-${ms.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}Fund Milestone — {formatCurrency(ms.amount)}
                      </Button>
                    )}
                    {isClient && ["submitted", "completed"].includes(ms.status) && (
                      <div className="flex gap-2 mt-3">
                        <Button variant="terracotta" size="sm" className="gap-1.5" onClick={() => approveMilestone(ms.id)} disabled={!!actionLoading}>{actionLoading === `approve-${ms.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}Approve & Release Funds</Button>
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => rejectMilestone(ms.id)} disabled={!!actionLoading}><XCircle className="h-3 w-3" />Request Revision</Button>
                      </div>
                    )}
                    {ms.status === "in_progress" && <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><Clock className="h-3 w-3" />Work in progress — funded and locked in escrow</p>}
                    {ms.status === "paid" && <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Funds released to designer</p>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent></Card>}

          {tab === "proposals" && <Card><CardHeader><CardTitle className="text-base">Proposals ({proposals.length})</CardTitle></CardHeader><CardContent className="p-0">
            {proposals.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No proposals yet. Designers will submit proposals once they see your project.</div>
            : proposals.map((p: any) => {
              const ms = p.milestones ? JSON.parse(p.milestones) : [];
              return (
              <div key={p.id} className="px-5 py-5 border-b last:border-0">
                <div className="flex items-start gap-3">
                  <Avatar fallback={`${p.designer?.user?.firstName?.[0] || ""}${p.designer?.user?.lastName?.[0] || ""}`} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div><h4 className="font-semibold">{p.designer?.user?.firstName} {p.designer?.user?.lastName}</h4><p className="text-xs text-muted-foreground">{p.designer?.user?.location}</p></div>
                      <Badge className={cn("text-[10px] capitalize", p.status === "accepted" ? "bg-emerald-50 text-emerald-700" : p.status === "rejected" ? "bg-red-50 text-red-700" : p.status === "revision_requested" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700")}>{p.status.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{p.coverLetter}</p>
                    <div className="flex gap-4 mt-2 text-sm"><span className="font-bold">{formatCurrency(p.proposedRate)}</span><span className="text-muted-foreground">{p.deliveryDays} days delivery</span></div>

                    {/* Milestone Breakdown */}
                    {ms.length > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-muted/30 border">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Payment Milestones</p>
                        <div className="space-y-2">{ms.map((m: any, i: number) => (
                          <div key={i} className="flex items-start justify-between text-sm">
                            <div className="flex-1"><p className="font-medium">{m.title}</p><p className="text-xs text-muted-foreground">{m.deliverable}</p></div>
                            <div className="text-right shrink-0 ml-4"><p className="font-semibold">{formatCurrency(m.amount)}</p><p className="text-[10px] text-muted-foreground">{m.durationDays} days</p></div>
                          </div>
                        ))}</div>
                        <Separator className="my-2" />
                        <div className="flex justify-between text-sm font-bold"><span>Total</span><span>{formatCurrency(p.proposedRate)}</span></div>
                      </div>
                    )}

                    {/* Client Notes (revision feedback) */}
                    {p.clientNotes && <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200"><p className="text-xs font-medium text-amber-800">Client Feedback:</p><p className="text-xs text-amber-700 mt-1">{p.clientNotes}</p></div>}

                    {/* Action Buttons */}
                    {isClient && p.status === "pending" && (
                      <div className="flex gap-2 mt-4">
                        <Button variant="terracotta" size="sm" onClick={async () => { if (!confirm("Accept this proposal? This will assign the designer and create milestones.")) return; setActionLoading(`accept-${p.id}`); const r = await fetch(`/api/proposals/${p.id}/accept`, { method: "POST" }); const j = await r.json(); setActionLoading(null); if (j.success) { alert(`Proposal accepted! ${j.data.milestonesCreated} milestones created.`); loadProject(); } else alert(j.error); }} disabled={!!actionLoading} className="gap-1.5">{actionLoading === `accept-${p.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}Accept Proposal</Button>
                        <Button variant="outline" size="sm" onClick={() => { setRevisionModal(p.id); setRevisionNotes(""); }} disabled={!!actionLoading}>Request Changes</Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={async () => { if (!confirm("Reject this proposal?")) return; await fetch(`/api/proposals/${p.id}/reject`, { method: "POST" }); loadProject(); }}>Reject</Button>
                      </div>
                    )}
                    {p.status === "accepted" && <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Accepted — Milestones created</p>}
                  </div>
                </div>
              </div>);
            })}
          </CardContent></Card>}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {designer && <Card><CardHeader><CardTitle className="text-base">Designer</CardTitle></CardHeader><CardContent><div className="flex items-center gap-3"><Avatar fallback={`${designer.user?.firstName?.[0] || ""}${designer.user?.lastName?.[0] || ""}`} size="lg" /><div><p className="font-semibold">{designer.user?.firstName} {designer.user?.lastName}</p><p className="text-xs text-muted-foreground">{designer.user?.location}</p><div className="flex items-center gap-1 mt-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="text-xs">{designer.avgRating} ({designer.totalReviews})</span></div></div></div><Button variant="terracotta" className="w-full mt-4 gap-2" size="sm" asChild><Link href="/messages"><MessageSquare className="h-3.5 w-3.5" />Message Designer</Link></Button></CardContent></Card>}

          <Card><CardHeader><CardTitle className="text-base flex items-center gap-2">{escrow?.isLocked ? <Lock className="h-4 w-4 text-red-500" /> : <DollarSign className="h-4 w-4" />}Escrow Account</CardTitle></CardHeader><CardContent className="space-y-3">
            {escrow ? (<>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Balance Held</span><span className="font-bold text-lg">{formatCurrency(escrow.balance)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge variant={escrow.isLocked ? "destructive" : "success"} className="text-[10px]">{escrow.isLocked ? "Locked (Dispute)" : "Active"}</Badge></div>
              <Separator />
              <p className="text-xs font-medium">Recent Transactions</p>
              {(escrow.transactions || []).slice(0, 5).map((tx: any) => (
                <div key={tx.id} className="flex justify-between text-xs"><span className="text-muted-foreground truncate flex-1 mr-2">{tx.description || tx.type.replace("_", " ")}</span><span className={cn("font-medium", tx.type === "REFUND" ? "text-red-500" : tx.type === "COMMISSION" ? "text-amber-600" : "text-emerald-600")}>{formatCurrency(tx.amount)}</span></div>
              ))}
            </>) : (<p className="text-sm text-muted-foreground">No escrow account yet. Fund a milestone to create one.</p>)}
          </CardContent></Card>

          {isClient && <Card><CardContent className="p-4 space-y-2"><Button variant="outline" className="w-full" size="sm" onClick={() => alert("Dispute filing coming soon")}><AlertTriangle className="h-3.5 w-3.5 mr-2" />Open Dispute</Button></CardContent></Card>}
        </div>
      </div>

      {/* Revision Request Modal */}
      {revisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setRevisionModal(null)}>
          <div className="bg-background rounded-xl border shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Request Changes</h3>
            <p className="text-sm text-muted-foreground mb-4">Describe what you would like the designer to change in their proposal.</p>
            <textarea value={revisionNotes} onChange={e => setRevisionNotes(e.target.value)} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="e.g. Please reduce the upfront payment to 30% and add more detail to the execution milestone..." />
            <p className="text-xs text-muted-foreground mt-1">{revisionNotes.length} characters (min 10)</p>
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" onClick={() => setRevisionModal(null)}>Cancel</Button>
              <Button variant="terracotta" disabled={revisionNotes.length < 10 || !!actionLoading} onClick={async () => { setActionLoading(`revise-${revisionModal}`); await fetch(`/api/proposals/${revisionModal}/revise`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: revisionNotes }) }); setActionLoading(null); setRevisionModal(null); loadProject(); }} className="gap-1.5">{actionLoading?.startsWith("revise") ? <Loader2 className="h-3 w-3 animate-spin" /> : null}Send Feedback</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

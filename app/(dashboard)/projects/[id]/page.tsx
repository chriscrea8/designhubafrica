"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, AlertTriangle, Star, Clock, DollarSign, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress, Separator } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const MS_STATUS_STYLE: Record<string,string> = {
  pending:"bg-gray-100 text-gray-600", in_progress:"bg-blue-50 text-blue-700",
  submitted:"bg-amber-50 text-amber-700", approved:"bg-emerald-50 text-emerald-700",
  paid:"bg-emerald-100 text-emerald-800", disputed:"bg-red-50 text-red-700",
};
const PROPOSAL_STATUS_STYLE: Record<string,string> = {
  pending:"bg-amber-50 text-amber-700", accepted:"bg-emerald-50 text-emerald-700",
  rejected:"bg-red-50 text-red-700", revised:"bg-blue-50 text-blue-700",
};

function ProjectDetailContent() {
  const params  = useParams();
  const id      = params?.id as string;
  const { data: session } = useSession();
  const [project,       setProject]       = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState("milestones");
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [revisionModal, setRevisionModal] = useState<string|null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [showReview,    setShowReview]    = useState(false);
  const [reviewForm,    setReviewForm]    = useState<any>({ rating:0, comment:"", qualityRating:0, communicationRating:0, timelinessRating:0, professionalismRating:0 });

  useEffect(() => { if (id) loadProject(); }, [id]);

  async function loadProject() {
    const res = await fetch(`/api/projects/${id}`).then(r=>r.json()).catch(()=>({}));
    if (res.success) setProject(res.data);
    setLoading(false);
  }

  const userId = (session?.user as any)?.id;
  const isClient = project?.clientId === userId;
  const isDesigner = project?.designer?.user?.id === userId;
  const milestones = project?.milestones || [];
  const proposals  = project?.proposals  || [];
  const completedMs = milestones.filter((m: any) => ["approved","paid"].includes(m.status)).length;

  async function approveMilestone(msId: string) {
    setActionLoading(msId);
    await fetch(`/api/milestones/${msId}/approve`, { method:"POST" });
    setActionLoading(null); loadProject();
  }
  async function submitMilestone(msId: string) {
    setActionLoading(msId);
    await fetch(`/api/milestones/${msId}/submit`, { method:"POST" });
    setActionLoading(null); loadProject();
  }
  async function acceptProposal(proposalId: string) {
    if (!confirm("Accept this proposal? This will create a contract and milestones.")) return;
    setActionLoading(proposalId);
    const res = await fetch(`/api/proposals/${proposalId}/accept`, { method:"POST" });
    const json = await res.json();
    setActionLoading(null);
    if (json.success) loadProject();
    else alert(json.error || "Failed to accept proposal");
  }
  async function rejectProposal(proposalId: string) {
    setActionLoading(proposalId);
    await fetch(`/api/proposals/${proposalId}/reject`, { method:"POST" });
    setActionLoading(null); loadProject();
  }
  async function submitReview() {
    if (!reviewForm.rating) { alert("Please select a rating"); return; }
    const res = await fetch("/api/reviews", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ designerId: project.designerId, projectId: id, ...reviewForm }) });
    const json = await res.json();
    if (json.success) { setShowReview(false); alert("Review submitted!"); }
    else alert(json.error || "Failed");
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;
  if (!project) return <div className="text-center py-16 text-muted-foreground">Project not found</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/projects" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5"/></Link>
        <div className="flex-1"><h1 className="text-xl font-bold">{project.title}</h1><p className="text-sm text-muted-foreground mt-0.5">{project.location}</p></div>
        <Badge className={cn("text-xs", project.status==="COMPLETED"?"bg-emerald-50 text-emerald-700":project.status==="IN_PROGRESS"?"bg-blue-50 text-blue-700":"bg-amber-50 text-amber-700")}>{project.status?.replace(/_/g," ")}</Badge>
      </div>

      {/* Progress */}
      {milestones.length > 0 && <Card><CardContent className="p-5">
        <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Progress</span><span className="text-sm font-bold text-terracotta-500">{project.progress || 0}%</span></div>
        <Progress value={project.progress || 0} className="h-2"/>
        <p className="text-xs text-muted-foreground mt-2">{completedMs} of {milestones.length} milestones complete</p>
      </CardContent></Card>}

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {[{ id:"milestones", label:`Milestones (${milestones.length})` }, { id:"proposals", label:`Proposals (${proposals.length})` }, { id:"overview", label:"Overview" }].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors", tab===t.id?"border-terracotta-500 text-foreground":"border-transparent text-muted-foreground hover:text-foreground")}>{t.label}</button>
        ))}
      </div>

      {/* ── Milestones Tab ── */}
      {tab === "milestones" && (
        <div className="space-y-3">
          {milestones.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No milestones yet — accept a proposal to create milestones.</p>
          ) : milestones.map((ms: any) => (
            <Card key={ms.id}><CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{ms.title}</h3>
                    <Badge className={cn("text-[10px]", MS_STATUS_STYLE[ms.status]||"")}>{ms.status?.replace(/_/g," ")}</Badge>
                  </div>
                  {ms.description && <p className="text-sm text-muted-foreground mt-1">{ms.description}</p>}
                  <p className="font-bold text-lg mt-2">{formatCurrency(ms.amount)}</p>
                </div>
              </div>
              {/* Client actions */}
              {isClient && ms.status === "submitted" && (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="terracotta" size="sm" onClick={()=>approveMilestone(ms.id)} disabled={!!actionLoading} className="gap-1.5">
                    {actionLoading===ms.id?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<CheckCircle2 className="h-3.5 w-3.5"/>}Approve & Pay
                  </Button>
                  <Button variant="outline" size="sm" onClick={()=>{setRevisionModal(ms.id);setRevisionNotes("");}} className="gap-1.5"><XCircle className="h-3.5 w-3.5"/>Request Changes</Button>
                </div>
              )}
              {/* Designer actions */}
              {isDesigner && ms.status === "in_progress" && (
                <div className="mt-4 pt-4 border-t">
                  <Button variant="terracotta" size="sm" onClick={()=>submitMilestone(ms.id)} disabled={!!actionLoading} className="gap-1.5">
                    {actionLoading===ms.id?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<CheckCircle2 className="h-3.5 w-3.5"/>}Submit for Review
                  </Button>
                </div>
              )}
            </CardContent></Card>
          ))}
          {isClient && project.status === "COMPLETED" && (
            <Button variant="terracotta" className="w-full gap-2" onClick={()=>setShowReview(true)}><Star className="h-4 w-4"/>Leave a Review</Button>
          )}
        </div>
      )}

      {/* ── Proposals Tab ── */}
      {tab === "proposals" && (
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No proposals received yet.</p>
          ) : proposals.map((p: any) => {
            const dUser = p.designer?.user;
            return (
              <Card key={p.id}><CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-terracotta-100 flex items-center justify-center font-bold text-terracotta-600 shrink-0">{dUser?.firstName?.[0]||"D"}</div>
                    <div>
                      <p className="font-semibold">{dUser?.firstName} {dUser?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{dUser?.location}</p>
                    </div>
                  </div>
                  <Badge className={cn("text-xs", PROPOSAL_STATUS_STYLE[p.status]||"")}>{p.status}</Badge>
                </div>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div><p className="text-muted-foreground text-xs">Proposed Rate</p><p className="font-bold">{formatCurrency(p.proposedRate||0)}</p></div>
                  <div><p className="text-muted-foreground text-xs">Timeline</p><p className="font-medium">{p.timeline||"—"}</p></div>
                  <div><p className="text-muted-foreground text-xs">Submitted</p><p className="font-medium">{formatDate(p.createdAt)}</p></div>
                </div>
                {p.coverLetter && <div className="p-3 rounded-lg bg-muted/40 text-sm"><p className="text-muted-foreground leading-relaxed">{p.coverLetter}</p></div>}
                {(() => { try { const ms = typeof p.milestones === "string" ? JSON.parse(p.milestones) : (Array.isArray(p.milestones) ? p.milestones : []); return ms?.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Milestones</p>
                    <div className="space-y-1">
                      {ms.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                          <span>{item.title}</span>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null; } catch { return null; } })()}
                {isClient && p.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <Button variant="terracotta" size="sm" onClick={()=>acceptProposal(p.id)} disabled={!!actionLoading} className="gap-1.5">
                      {actionLoading===p.id?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<CheckCircle2 className="h-3.5 w-3.5"/>}Accept Proposal
                    </Button>
                    <Button variant="outline" size="sm" onClick={()=>{setRevisionModal(p.id);setRevisionNotes("");}} className="gap-1.5">Request Changes</Button>
                    <Button variant="outline" size="sm" onClick={()=>rejectProposal(p.id)} disabled={!!actionLoading} className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50"><XCircle className="h-3.5 w-3.5"/>Decline</Button>
                  </div>
                )}
              </CardContent></Card>
            );
          })}
        </div>
      )}

      {/* ── Overview Tab ── */}
      {tab === "overview" && (
        <div className="space-y-4">
          <Card><CardContent className="p-5 space-y-3 text-sm">
            {project.description && <p className="text-muted-foreground">{project.description}</p>}
            <Separator />
            <div className="grid sm:grid-cols-2 gap-3">
              {project.budgetMin && <div><p className="text-xs text-muted-foreground">Budget</p><p className="font-medium">{formatCurrency(project.budgetMin)} – {formatCurrency(project.budgetMax)}</p></div>}
              {project.style    && <div><p className="text-xs text-muted-foreground">Style</p><p className="font-medium">{project.style}</p></div>}
              {project.rooms    && <div><p className="text-xs text-muted-foreground">Rooms</p><p className="font-medium">{Array.isArray(project.rooms)?project.rooms.join(", "):project.rooms}</p></div>}
              {project.timeline && <div><p className="text-xs text-muted-foreground">Timeline</p><p className="font-medium">{project.timeline}</p></div>}
            </div>
          </CardContent></Card>
          {isClient && (
            <div className="flex gap-2">
              <Link href={`/messages?projectId=${id}`} className="flex-1"><Button variant="outline" className="w-full gap-2"><FileText className="h-4 w-4"/>Open Messages</Button></Link>
              <Button variant="outline" className="flex-1 gap-2 text-red-500 border-red-200 hover:bg-red-50" onClick={()=>alert("Dispute filing — contact support")}><AlertTriangle className="h-4 w-4"/>Open Dispute</Button>
            </div>
          )}
        </div>
      )}

      {/* Revision Modal */}
      {revisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setRevisionModal(null)}>
          <div className="bg-background rounded-xl border shadow-xl w-full max-w-md p-6" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Request Changes</h3>
            <p className="text-sm text-muted-foreground mb-4">Describe what you would like changed.</p>
            <textarea value={revisionNotes} onChange={e=>setRevisionNotes(e.target.value)} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="e.g. Please adjust the first milestone amount…"/>
            <p className="text-xs text-muted-foreground mt-1">{revisionNotes.length} chars (min 10)</p>
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" onClick={()=>setRevisionModal(null)}>Cancel</Button>
              <Button variant="terracotta" disabled={revisionNotes.length<10||!!actionLoading} onClick={async()=>{
                setActionLoading(revisionModal);
                await fetch(`/api/proposals/${revisionModal}/revise`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes:revisionNotes})});
                setActionLoading(null); setRevisionModal(null); loadProject();
              }}>Send Feedback</Button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setShowReview(false)}>
          <div className="bg-background rounded-xl border shadow-xl w-full max-w-md p-6" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-2 block">Overall Rating</label>
                <div className="flex gap-1">{[1,2,3,4,5].map(s=><button key={s} onClick={()=>setReviewForm({...reviewForm,rating:s})} className={cn("h-9 w-9 rounded-lg border-2 text-lg transition-all",s<=reviewForm.rating?"border-amber-400 bg-amber-50":"border-border")}>{s<=reviewForm.rating?"⭐":"☆"}</button>)}</div>
              </div>
              <textarea value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Share your experience…"/>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" onClick={()=>setShowReview(false)}>Cancel</Button>
              <Button variant="terracotta" onClick={submitReview} disabled={!reviewForm.rating||reviewForm.comment.length<10}>Submit Review</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectDetailPage() {
  return <Suspense fallback={<div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><ProjectDetailContent/></Suspense>;
}

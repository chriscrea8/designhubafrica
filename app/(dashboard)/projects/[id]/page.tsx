"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, Clock, DollarSign, MessageSquare, AlertTriangle, MapPin, Calendar, Upload, Star, XCircle, Loader2, Send, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Progress, Separator, Input } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const milestoneColors: Record<string, string> = { paid: "bg-emerald-50 text-emerald-600", completed: "bg-blue-50 text-blue-600", in_progress: "bg-amber-50 text-amber-600", pending: "bg-gray-50 text-gray-400" };

export default function ProjectDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const id = params?.id as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [approvingMilestone, setApprovingMilestone] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [showReview, setShowReview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadProject() {
    const res = await fetch(`/api/projects/${id}`); const json = await res.json();
    if (json.success) setProject(json.data);
    setLoading(false);
  }

  useEffect(() => { if (id) loadProject(); }, [id]);

  async function approveMilestone(milestoneId: string) {
    setApprovingMilestone(milestoneId);
    await fetch(`/api/escrow/release`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id, milestoneId }) });
    await loadProject();
    setApprovingMilestone(null);
  }

  async function submitReview() {
    if (!project?.designerId) return;
    await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ designerId: project.designerId, projectId: id, rating: reviewForm.rating, comment: reviewForm.comment, qualityRating: reviewForm.rating, communicationRating: reviewForm.rating, timelinessRating: reviewForm.rating, professionalismRating: reviewForm.rating }) });
    setShowReview(false);
    alert("Review submitted!");
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;
  if (!project) return <div className="text-center py-16"><h2 className="text-xl font-bold">Project not found</h2><Link href="/projects" className="text-sm text-terracotta-500 mt-2 inline-block">Back</Link></div>;

  const milestones = project.milestones || [];
  const escrow = project.escrowAccount;
  const proposals = project.proposals || [];
  const designer = project.designer;
  const completedMs = milestones.filter((m: any) => ["paid", "completed"].includes(m.status)).length;
  const isClient = project.clientId === session?.user?.id;
  const tabs = [{ id: "overview", label: "Overview" }, { id: "milestones", label: `Milestones (${milestones.length})` }, { id: "proposals", label: `Proposals (${proposals.length})` }, { id: "files", label: "Files" }];

  return (
    <div className="space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Projects</Link>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div><div className="flex items-center gap-3 flex-wrap"><h1 className="text-2xl font-bold">{project.title}</h1><Badge className={cn("capitalize", project.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700" : project.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : project.status === "OPEN" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-700")}>{(project.status || "draft").replace("_", " ")}</Badge></div><div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">{project.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{project.location}</span>}<span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{formatCurrency(project.budgetMin)} – {formatCurrency(project.budgetMax)}</span><span>{project.roomType} • {project.style}</span></div></div>
        {isClient && project.status === "COMPLETED" && !showReview && <Button variant="terracotta" size="sm" onClick={() => setShowReview(true)} className="gap-2"><Star className="h-4 w-4" />Leave Review</Button>}
      </div>

      {/* Progress */}
      <Card><CardContent className="p-5"><div className="flex items-center justify-between mb-3"><span className="text-sm font-medium">Progress</span><span className="text-sm font-bold text-terracotta-500">{project.progress}%</span></div><Progress value={project.progress} className="h-3" /><p className="text-xs text-muted-foreground mt-2">{completedMs} of {milestones.length} milestones complete</p></CardContent></Card>

      {/* Review Form */}
      {showReview && <Card className="border-terracotta-200"><CardHeader><CardTitle className="text-base">Rate Your Designer</CardTitle></CardHeader><CardContent className="space-y-4">
        <div><label className="text-sm font-medium mb-2 block">Rating</label><div className="flex gap-1">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setReviewForm(p => ({...p, rating: s}))} className="p-1"><Star className={cn("h-6 w-6", s <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} /></button>)}</div></div>
        <div><label className="text-sm font-medium mb-1.5 block">Comment</label><textarea value={reviewForm.comment} onChange={e => setReviewForm(p => ({...p, comment: e.target.value}))} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Share your experience..." /></div>
        <div className="flex gap-2"><Button variant="terracotta" onClick={submitReview}>Submit Review</Button><Button variant="outline" onClick={() => setShowReview(false)}>Cancel</Button></div>
      </CardContent></Card>}

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">{tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap", tab === t.id ? "border-terracotta-500 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t.label}</button>)}</div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {tab === "overview" && <Card><CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.description}</p>{project.images?.length > 0 && <div className="grid grid-cols-3 gap-2 mt-4">{project.images.map((img: string, i: number) => <img key={i} src={img} alt="" className="rounded-lg aspect-square object-cover" />)}</div>}</CardContent></Card>}

          {tab === "milestones" && <Card><CardHeader><CardTitle className="text-base">Milestones</CardTitle></CardHeader><CardContent className="p-0">
            {milestones.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No milestones yet</div>
            : milestones.map((ms: any, i: number) => (
              <div key={ms.id} className="flex items-start gap-4 px-5 py-4 border-b last:border-0">
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", milestoneColors[ms.status] || milestoneColors.pending)}>{["paid","completed"].includes(ms.status) ? "✓" : i + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between"><h4 className="font-semibold text-sm">{ms.title}</h4><Badge className={cn("text-[10px] capitalize", ms.status === "paid" ? "bg-emerald-50 text-emerald-700" : ms.status === "in_progress" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500")}>{ms.status}</Badge></div>
                  {ms.description && <p className="text-xs text-muted-foreground mt-1">{ms.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">{formatCurrency(ms.amount)}</span>{ms.dueDate && <span>Due: {formatDate(ms.dueDate)}</span>}</div>
                  {/* Approve/Reject buttons for client */}
                  {isClient && ms.status === "completed" && (
                    <div className="flex gap-2 mt-3">
                      <Button variant="terracotta" size="sm" onClick={() => approveMilestone(ms.id)} disabled={approvingMilestone === ms.id} className="gap-1.5">{approvingMilestone === ms.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}Approve & Release Funds</Button>
                      <Button variant="outline" size="sm" className="gap-1.5"><XCircle className="h-3 w-3" />Request Revision</Button>
                    </div>
                  )}
                  {isClient && ms.status === "in_progress" && <p className="text-xs text-amber-600 mt-2">Designer is working on this milestone</p>}
                </div>
              </div>
            ))}
          </CardContent></Card>}

          {tab === "proposals" && <Card><CardHeader><CardTitle className="text-base">Proposals</CardTitle></CardHeader><CardContent className="p-0">
            {proposals.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No proposals yet. Designers will submit proposals once they see your project.</div>
            : proposals.map((p: any) => (
              <div key={p.id} className="px-5 py-4 border-b last:border-0">
                <div className="flex items-start gap-3">
                  <Avatar fallback={`${p.designer?.user?.firstName?.[0] || ""}${p.designer?.user?.lastName?.[0] || ""}`} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between"><h4 className="font-semibold text-sm">{p.designer?.user?.firstName} {p.designer?.user?.lastName}</h4><Badge className="text-[10px] capitalize">{p.status}</Badge></div>
                    <p className="text-sm text-muted-foreground mt-1">{p.coverLetter}</p>
                    <div className="flex gap-4 mt-2 text-xs"><span className="font-medium">{formatCurrency(p.proposedRate)}</span><span className="text-muted-foreground">{p.deliveryDays} days</span></div>
                    {isClient && p.status === "pending" && <div className="flex gap-2 mt-3"><Button variant="terracotta" size="sm">Accept Proposal</Button><Button variant="outline" size="sm">Decline</Button></div>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent></Card>}

          {tab === "files" && <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-base">Project Files</CardTitle><div><input ref={fileRef} type="file" multiple className="hidden" /><Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-2"><Upload className="h-3.5 w-3.5" />Upload</Button></div></CardHeader><CardContent>
            <div className="p-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-xl"><Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" /><p>Drag files here or click Upload</p><p className="text-xs mt-1">Design plans, 3D renders, material lists, contracts</p></div>
          </CardContent></Card>}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {designer && <Card><CardHeader><CardTitle className="text-base">Designer</CardTitle></CardHeader><CardContent><div className="flex items-center gap-3"><Avatar fallback={`${designer.user?.firstName?.[0] || ""}${designer.user?.lastName?.[0] || ""}`} size="lg" /><div><p className="font-semibold">{designer.user?.firstName} {designer.user?.lastName}</p><p className="text-xs text-muted-foreground">{designer.user?.location}</p><div className="flex items-center gap-1 mt-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="text-xs font-medium">{designer.avgRating} ({designer.totalReviews})</span></div></div></div><Button variant="outline" className="w-full mt-4 gap-2" size="sm"><MessageSquare className="h-3.5 w-3.5" />Message Designer</Button></CardContent></Card>}

          {escrow && <Card><CardHeader><CardTitle className="text-base">Escrow</CardTitle></CardHeader><CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Balance</span><span className="font-bold">{formatCurrency(escrow.balance)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Status</span><Badge variant={escrow.isLocked ? "destructive" : "success"} className="text-[10px]">{escrow.isLocked ? "Locked" : "Active"}</Badge></div>
            {escrow.transactions?.slice(0, 3).map((tx: any) => <div key={tx.id} className="flex justify-between text-xs"><span className="text-muted-foreground">{tx.description?.slice(0, 25)}</span><span className="font-medium">{formatCurrency(tx.amount)}</span></div>)}
          </CardContent></Card>}

          {isClient && project.status === "OPEN" && <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground text-center">Waiting for designer proposals…</p></CardContent></Card>}
          {isClient && <Card><CardContent className="p-4 space-y-2"><Button variant="outline" className="w-full" size="sm"><AlertTriangle className="h-3.5 w-3.5 mr-2" />Open Dispute</Button></CardContent></Card>}
        </div>
      </div>
    </div>
  );
}

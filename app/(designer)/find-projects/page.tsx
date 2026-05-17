"use client";
import React, { useEffect, useState } from "react";
import { Search, MapPin, DollarSign, Clock, Calendar, ChevronDown, Loader2, AlertCircle, CheckCircle2, Plus, Trash2, X, Eye } from "lucide-react";
import { Card, CardContent, Button, Badge, Input, EmptyState, Separator } from "@/components/ui";
import { formatCurrency, formatRelativeTime, cn } from "@/lib/utils";

interface Milestone { title: string; deliverable: string; amount: string; durationDays: string; }
const emptyMs = (): Milestone => ({ title: "", deliverable: "", amount: "", durationDays: "" });

export default function FindProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [applying, setApplying] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([emptyMs(), emptyMs()]);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects?status=OPEN&limit=50").then(r => r.json()),
      fetch("/api/designers/my-proposals").then(r => r.json()), // Get only THIS designer's proposals
    ]).then(([openRes, myProposalsRes]) => {
      setProjects(openRes.data?.items || []);
      // Build set of project IDs this specific designer has applied to
      const myProposals = myProposalsRes.success ? (myProposalsRes.data || []) : [];
      const applied = new Set<string>(myProposals.map((p: any) => p.projectId));
      setAppliedIds(applied);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [success]); // Refetch after successful submission

  function addMilestone() { setMilestones(prev => [...prev, emptyMs()]); }
  function removeMilestone(i: number) { if (milestones.length <= 2) return; setMilestones(prev => prev.filter((_, j) => j !== i)); }
  function updateMilestone(i: number, field: keyof Milestone, value: string) { setMilestones(prev => prev.map((m, j) => j === i ? { ...m, [field]: value } : m)); }

  const totalAmount = milestones.reduce((sum, m) => sum + (parseInt(m.amount) || 0), 0);
  const firstPct = milestones.length > 0 && totalAmount > 0 ? ((parseInt(milestones[0].amount) || 0) / totalAmount * 100) : 0;
  const lastPct = milestones.length > 0 && totalAmount > 0 ? ((parseInt(milestones[milestones.length - 1].amount) || 0) / totalAmount * 100) : 0;

  function resetForm() { setCoverLetter(""); setDeliveryDays(""); setMilestones([emptyMs(), emptyMs()]); setError(""); }

  async function submitProposal(projectId: string) {
    setError(""); setSuccess("");
    const parsed = milestones.map(m => ({ title: m.title, deliverable: m.deliverable, amount: parseInt(m.amount) || 0, durationDays: parseInt(m.durationDays) || 0 }));
    setSubmitting(true);
    const res = await fetch(`/api/projects/${projectId}/proposals`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverLetter, proposedRate: totalAmount, deliveryDays: parseInt(deliveryDays) || 0, milestones: parsed }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (json.success) { setSuccess("Proposal submitted! The client will be notified."); setApplying(null); resetForm(); setAppliedIds(prev => new Set(prev).add(projectId)); }
    else setError(json.error || "Submission failed");
  }

  const filtered = search ? projects.filter(p => (p.title + p.description + p.location + p.style).toLowerCase().includes(search.toLowerCase())) : projects;

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Find Projects</h1><p className="text-sm text-muted-foreground mt-1">Browse open client projects and submit proposals</p></div>
      {success && <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700"><CheckCircle2 className="h-4 w-4" />{success}</div>}
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
      <p className="text-sm text-muted-foreground">{filtered.length} open project{filtered.length !== 1 ? "s" : ""}</p>

      {filtered.length === 0 ? <EmptyState icon={<Search className="h-12 w-12" />} title="No open projects" description="Check back later" /> : (
        <div className="space-y-4">{filtered.map(project => {
          const hasApplied = appliedIds.has(project.id);
          return (
          <Card key={project.id} className={cn(project.urgency === "high" && "border-l-4 border-l-red-400", hasApplied && "opacity-75")}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    {project.urgency === "high" && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                    {hasApplied && <Badge variant="success" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" />Applied</Badge>}
                    <Badge variant="secondary" className="text-[10px]">{project.roomType}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{project.style}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{project.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                    {project.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.location}</span>}
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrency(project.budgetMin)} – {formatCurrency(project.budgetMax)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatRelativeTime(project.createdAt)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{project._count?.proposals || 0} proposals</span>
                  </div>
                  {project.client && <p className="text-xs text-muted-foreground mt-2">Posted by {project.client.firstName} {project.client.lastName}</p>}
                </div>
                {hasApplied ? (
                  <Badge variant="success" className="shrink-0 gap-1.5 px-3 py-1.5"><CheckCircle2 className="h-4 w-4" />Applied</Badge>
                ) : (
                  <Button variant={applying === project.id ? "outline" : "terracotta"} size="sm" onClick={() => { if (applying === project.id) { setApplying(null); resetForm(); } else { setApplying(project.id); setError(""); } }} className="gap-2 shrink-0">
                    {applying === project.id ? <><X className="h-4 w-4" />Cancel</> : <><ChevronDown className="h-4 w-4" />Apply</>}
                  </Button>
                )}
              </div>

              {applying === project.id && !hasApplied && (
                <div className="mt-6 pt-6 border-t space-y-5">
                  <h4 className="font-semibold">Submit Your Proposal</h4>
                  {error && <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 text-red-700 text-sm"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
                  <div><label className="text-sm font-medium mb-1.5 block">Cover Letter <span className="text-muted-foreground">(min 50 chars)</span></label><textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Explain your approach and why you're the right fit..." /><p className="text-xs text-muted-foreground mt-1">{coverLetter.length}/50</p></div>
                  <div><label className="text-sm font-medium mb-1.5 block">Timeline (days)</label><Input type="number" value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)} placeholder="e.g. 30" className="w-32" /></div>
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between mb-3"><div><h4 className="text-sm font-semibold">Payment Milestones</h4><p className="text-xs text-muted-foreground">Min 2 milestones. First ≤40%, last ≥20%</p></div><Button variant="outline" size="sm" onClick={addMilestone} className="gap-1.5"><Plus className="h-3 w-3" />Add</Button></div>
                    <div className="space-y-3">{milestones.map((ms, i) => (
                      <Card key={i} className="bg-muted/30"><CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold text-muted-foreground">Milestone {i + 1}{i === 0 ? " (Upfront)" : i === milestones.length - 1 ? " (Final)" : ""}</span>{milestones.length > 2 && <button onClick={() => removeMilestone(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>}</div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          <div><label className="text-xs mb-1 block">Title</label><Input value={ms.title} onChange={e => updateMilestone(i, "title", e.target.value)} placeholder="e.g. 3D Render — Living Room" /></div>
                          <div className="grid grid-cols-2 gap-2"><div><label className="text-xs mb-1 block">Amount (₦)</label><Input type="number" value={ms.amount} onChange={e => updateMilestone(i, "amount", e.target.value)} /></div><div><label className="text-xs mb-1 block">Days</label><Input type="number" value={ms.durationDays} onChange={e => updateMilestone(i, "durationDays", e.target.value)} /></div></div>
                        </div>
                        <div className="mt-2"><label className="text-xs mb-1 block">Deliverable</label><Input value={ms.deliverable} onChange={e => updateMilestone(i, "deliverable", e.target.value)} placeholder="What client receives" /></div>
                      </CardContent></Card>
                    ))}</div>
                    <div className="mt-3 p-3 rounded-lg border bg-background">
                      <div className="flex justify-between font-semibold text-sm mb-1"><span>Total</span><span>{formatCurrency(totalAmount)}</span></div>
                      {firstPct > 40 && <p className="text-xs text-red-500">⚠ First milestone exceeds 40% ({Math.round(firstPct)}%)</p>}
                      {lastPct < 20 && totalAmount > 0 && <p className="text-xs text-red-500">⚠ Platform rule: Final milestone must be at least 20% of total (₦{Math.round(totalAmount * 0.2).toLocaleString()} minimum). This protects clients by ensuring you have incentive to complete the project. Current: {Math.round(lastPct)}%</p>}
                    </div>
                  </div>
                  <Button variant="terracotta" onClick={() => submitProposal(project.id)} disabled={submitting} className="gap-2">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{submitting ? "Submitting..." : "Submit Proposal"}</Button>
                </div>
              )}
            </CardContent>
          </Card>);
        })}</div>
      )}
    </div>
  );
}

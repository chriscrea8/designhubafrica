"use client";
import React, { useEffect, useState } from "react";
import { FileText, Clock, CheckCircle2, XCircle, AlertTriangle, Edit, Loader2, Plus, Trash2, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, EmptyState, Input, Separator } from "@/components/ui";
import { formatCurrency, formatRelativeTime, cn } from "@/lib/utils";

interface Milestone { title: string; deliverable: string; amount: string; durationDays: string; }

export default function MyProposalsPage() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit form
  const [coverLetter, setCoverLetter] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => { loadProposals(); }, []);

  async function loadProposals() {
    // Fetch all projects and extract proposals belonging to this designer
    const res = await fetch("/api/projects?limit=100");
    const json = await res.json();
    if (json.success) {
      const allProjects = json.data?.items || [];
      const myProposals: any[] = [];
      for (const p of allProjects) {
        const propRes = await fetch(`/api/projects/${p.id}/proposals`);
        const propJson = await propRes.json();
        if (propJson.success) {
          propJson.data?.forEach((prop: any) => {
            myProposals.push({ ...prop, project: p });
          });
        }
      }
      setProposals(myProposals);
    }
    setLoading(false);
  }

  function startEdit(proposal: any) {
    const ms = proposal.milestones ? JSON.parse(proposal.milestones) : [];
    setCoverLetter(proposal.coverLetter);
    setDeliveryDays(String(proposal.deliveryDays));
    setMilestones(ms.map((m: any) => ({ title: m.title, deliverable: m.deliverable, amount: String(m.amount), durationDays: String(m.durationDays || "") })));
    setEditing(proposal.id);
    setError("");
  }

  function addMilestone() { setMilestones(prev => [...prev, { title: "", deliverable: "", amount: "", durationDays: "" }]); }
  function removeMilestone(i: number) { if (milestones.length <= 2) return; setMilestones(prev => prev.filter((_, j) => j !== i)); }
  function updateMilestone(i: number, field: keyof Milestone, value: string) { setMilestones(prev => prev.map((m, j) => j === i ? { ...m, [field]: value } : m)); }
  const totalAmount = milestones.reduce((sum, m) => sum + (parseInt(m.amount) || 0), 0);

  async function resubmit(projectId: string) {
    setError("");
    const parsed = milestones.map(m => ({ title: m.title, deliverable: m.deliverable, amount: parseInt(m.amount) || 0, durationDays: parseInt(m.durationDays) || 0 }));
    setSubmitting(true);
    const res = await fetch(`/api/projects/${projectId}/proposals`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverLetter, proposedRate: totalAmount, deliveryDays: parseInt(deliveryDays) || 0, milestones: parsed }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (json.success) { setEditing(null); loadProposals(); }
    else setError(json.error || "Resubmission failed");
  }

  const statusIcon: Record<string, any> = { pending: Clock, accepted: CheckCircle2, rejected: XCircle, revision_requested: AlertTriangle };
  const statusColor: Record<string, string> = { pending: "bg-blue-50 text-blue-700", accepted: "bg-emerald-50 text-emerald-700", rejected: "bg-red-50 text-red-700", revision_requested: "bg-amber-50 text-amber-700" };

  const counts = { pending: proposals.filter(p => p.status === "pending").length, accepted: proposals.filter(p => p.status === "accepted").length, rejected: proposals.filter(p => p.status === "rejected").length, revision: proposals.filter(p => p.status === "revision_requested").length };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Proposals</h1>

      <div className="grid grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-blue-600">{counts.pending}</p><p className="text-[10px] text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-emerald-600">{counts.accepted}</p><p className="text-[10px] text-muted-foreground">Accepted</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-amber-600">{counts.revision}</p><p className="text-[10px] text-muted-foreground">Revision</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-red-500">{counts.rejected}</p><p className="text-[10px] text-muted-foreground">Rejected</p></CardContent></Card>
      </div>

      {proposals.length === 0 ? <EmptyState icon={<FileText className="h-12 w-12" />} title="No proposals yet" description="Browse open projects to submit your first proposal" action={<Button variant="terracotta" asChild><a href="/find-projects">Find Projects</a></Button>} /> : (
        <div className="space-y-4">{proposals.map(p => {
          const Icon = statusIcon[p.status] || Clock;
          const ms = p.milestones ? JSON.parse(p.milestones) : [];
          const isEditing = editing === p.id;
          return (
            <Card key={p.id} className={cn(p.status === "revision_requested" && "border-amber-300 border-l-4")}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{p.project?.title || "Project"}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.project?.location} • {p.project?.roomType} • {p.project?.style}</p>
                    <div className="flex items-center gap-3 mt-2 text-sm"><span className="font-bold">{formatCurrency(p.proposedRate)}</span><span className="text-muted-foreground">{p.deliveryDays} days</span><span className="text-xs text-muted-foreground">{formatRelativeTime(p.createdAt)}</span></div>
                  </div>
                  <Badge className={cn("text-[10px] capitalize gap-1", statusColor[p.status])}><Icon className="h-3 w-3" />{p.status.replace("_", " ")}</Badge>
                </div>

                {/* Client revision feedback */}
                {p.status === "revision_requested" && p.clientNotes && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs font-semibold text-amber-800 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Client requested changes:</p>
                    <p className="text-sm text-amber-700 mt-1">{p.clientNotes}</p>
                    {!isEditing && <Button variant="terracotta" size="sm" className="mt-3 gap-1.5" onClick={() => startEdit(p)}><Edit className="h-3 w-3" />Edit & Resubmit</Button>}
                  </div>
                )}

                {/* Milestone breakdown */}
                {!isEditing && ms.length > 0 && (
                  <div className="mt-3 text-xs text-muted-foreground space-y-1">{ms.map((m: any, i: number) => <div key={i} className="flex justify-between"><span>{m.title}</span><span>{formatCurrency(m.amount)}</span></div>)}</div>
                )}

                {/* Edit form */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <h4 className="text-sm font-semibold">Edit Proposal</h4>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <div><label className="text-xs font-medium mb-1 block">Cover Letter</label><textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" /></div>
                    <div><label className="text-xs font-medium mb-1 block">Timeline (days)</label><Input type="number" value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)} className="w-32" /></div>
                    <Separator />
                    <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold">Milestones</span><Button variant="outline" size="sm" onClick={addMilestone}><Plus className="h-3 w-3" /></Button></div>
                    {milestones.map((ms, i) => (
                      <Card key={i} className="bg-muted/30"><CardContent className="p-3">
                        <div className="flex justify-between mb-1"><span className="text-[10px] font-semibold text-muted-foreground">Milestone {i + 1}</span>{milestones.length > 2 && <button onClick={() => removeMilestone(i)}><Trash2 className="h-3 w-3 text-red-400" /></button>}</div>
                        <div className="grid grid-cols-2 gap-2"><Input value={ms.title} onChange={e => updateMilestone(i, "title", e.target.value)} placeholder="Title" /><Input type="number" value={ms.amount} onChange={e => updateMilestone(i, "amount", e.target.value)} placeholder="Amount" /></div>
                        <Input value={ms.deliverable} onChange={e => updateMilestone(i, "deliverable", e.target.value)} placeholder="Deliverable" className="mt-2" />
                      </CardContent></Card>
                    ))}
                    <div className="flex justify-between text-sm font-semibold"><span>Total</span><span>{formatCurrency(totalAmount)}</span></div>
                    <div className="flex gap-2"><Button variant="terracotta" onClick={() => resubmit(p.projectId)} disabled={submitting} className="gap-1.5">{submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}Resubmit</Button><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}</div>
      )}
    </div>
  );
}

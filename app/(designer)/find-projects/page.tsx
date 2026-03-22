"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, MapPin, DollarSign, Clock, Calendar, ChevronRight, Loader2, AlertCircle, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, EmptyState, Separator } from "@/components/ui";
import { formatCurrency, formatDate, formatRelativeTime, cn } from "@/lib/utils";

export default function FindProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [applying, setApplying] = useState<string | null>(null);
  const [proposal, setProposal] = useState({ coverLetter: "", proposedRate: "", deliveryDays: "" });
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(res => {
      // Show all OPEN projects (not just user's own)
      const allProjects = res.data?.items || [];
      setProjects(allProjects.filter((p: any) => p.status === "OPEN"));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function submitProposal(projectId: string) {
    if (!proposal.coverLetter || proposal.coverLetter.length < 50) { setSubmitError("Cover letter must be at least 50 characters"); return; }
    if (!proposal.proposedRate || !proposal.deliveryDays) { setSubmitError("Rate and delivery days are required"); return; }
    setSubmitError(""); setSubmitSuccess("");
    const res = await fetch(`/api/projects/${projectId}/proposals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, coverLetter: proposal.coverLetter, proposedRate: parseInt(proposal.proposedRate), deliveryDays: parseInt(proposal.deliveryDays), currency: "NGN" }) });
    const json = await res.json();
    if (json.success) { setSubmitSuccess("Proposal submitted successfully!"); setApplying(null); setProposal({ coverLetter: "", proposedRate: "", deliveryDays: "" }); }
    else setSubmitError(json.error || "Failed to submit");
  }

  const filtered = search ? projects.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()) || p.location?.toLowerCase().includes(search.toLowerCase())) : projects;

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Find Projects</h1><p className="text-sm text-muted-foreground mt-1">Browse open client projects and submit proposals</p></div>

      {submitSuccess && <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700"><AlertCircle className="h-4 w-4" />{submitSuccess}</div>}

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by project title, description, or location..." className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>

      <p className="text-sm text-muted-foreground">{filtered.length} open project{filtered.length !== 1 ? "s" : ""} available</p>

      {filtered.length === 0 ? (
        <EmptyState icon={<Search className="h-12 w-12" />} title="No open projects right now" description="Check back later for new project opportunities" />
      ) : (
        <div className="space-y-4">{filtered.map(project => (
          <Card key={project.id} className={cn(project.urgency === "high" && "border-l-4 border-l-red-400")}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    {project.urgency === "high" && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                    <Badge variant="secondary" className="text-[10px]">{project.roomType}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{project.style}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{project.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                    {project.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.location}</span>}
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrency(project.budgetMin)} – {formatCurrency(project.budgetMax)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Posted {formatRelativeTime(project.createdAt)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{project._count?.proposals || 0} proposals</span>
                  </div>
                  {project.client && <p className="text-xs text-muted-foreground mt-2">Client: {project.client.firstName} {project.client.lastName}</p>}
                </div>
                <div className="shrink-0">
                  {applying === project.id ? (
                    <Button variant="outline" size="sm" onClick={() => setApplying(null)}>Cancel</Button>
                  ) : (
                    <Button variant="terracotta" size="sm" onClick={() => { setApplying(project.id); setSubmitError(""); }} className="gap-2"><ChevronRight className="h-4 w-4" />Apply Now</Button>
                  )}
                </div>
              </div>

              {/* Proposal form */}
              {applying === project.id && (
                <div className="mt-4 pt-4 border-t space-y-4">
                  <h4 className="font-semibold text-sm">Submit Your Proposal</h4>
                  {submitError && <div className="flex items-center gap-2 p-2 rounded bg-red-50 text-red-700 text-xs"><AlertCircle className="h-3 w-3" />{submitError}</div>}
                  <div><label className="text-xs font-medium mb-1 block">Cover Letter (min 50 chars)</label><textarea value={proposal.coverLetter} onChange={e => setProposal({...proposal, coverLetter: e.target.value})} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Explain why you're the best fit for this project. Describe your approach, relevant experience, and what makes you stand out..." /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium mb-1 block">Proposed Rate (NGN)</label><Input type="number" value={proposal.proposedRate} onChange={e => setProposal({...proposal, proposedRate: e.target.value})} placeholder="e.g. 5000000" /></div>
                    <div><label className="text-xs font-medium mb-1 block">Delivery Days</label><Input type="number" value={proposal.deliveryDays} onChange={e => setProposal({...proposal, deliveryDays: e.target.value})} placeholder="e.g. 30" /></div>
                  </div>
                  <Button variant="terracotta" onClick={() => submitProposal(project.id)} className="gap-2">Submit Proposal</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}</div>
      )}
    </div>
  );
}

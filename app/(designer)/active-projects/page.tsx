"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FolderKanban, Clock, CheckCircle2, CreditCard, MapPin, DollarSign, ChevronRight, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress, EmptyState, Avatar, Separator } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const msColors: Record<string, string> = { paid: "text-emerald-600", approved: "text-emerald-600", submitted: "text-blue-600", completed: "text-blue-600", in_progress: "text-amber-600", pending: "text-gray-400" };

export default function ActiveProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    // Fetch projects assigned to this designer (non-OPEN status)
    fetch("/api/projects").then(r => r.json()).then(res => {
      if (res.success) {
        const items = res.data?.items || [];
        setProjects(items.filter((p: any) => ["IN_PROGRESS", "REVIEW", "COMPLETED"].includes(p.status)));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Active Projects</h1>
      <p className="text-sm text-muted-foreground">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>

      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-12 w-12" />} title="No active projects" description="Submit proposals on open projects to get started" action={<Button variant="terracotta" asChild><Link href="/find-projects">Find Projects</Link></Button>} />
      ) : (
        <div className="space-y-4">{projects.map(project => {
          const milestones = project.milestones || [];
          const paidCount = milestones.filter((m: any) => m.status === "paid").length;
          const progress = milestones.length > 0 ? Math.round((paidCount / milestones.length) * 100) : project.progress || 0;
          const isExpanded = expanded === project.id;

          return (
            <Card key={project.id}>
              <CardContent className="p-5">
                {/* Project Header */}
                <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : project.id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{project.title}</h3>
                      <Badge className={cn("text-[10px] capitalize", project.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700" : project.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700")}>{project.status.replace("_", " ")}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      {project.client && <span>Client: {project.client.firstName} {project.client.lastName}</span>}
                      {project.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.location}</span>}
                      <span>{project.roomType} • {project.style}</span>
                    </div>
                  </div>
                  <ChevronRight className={cn("h-5 w-5 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-90")} />
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5"><span className="text-muted-foreground">Progress</span><span className="font-semibold">{progress}%</span></div>
                  <Progress value={progress} className="h-2.5" />
                  <p className="text-[10px] text-muted-foreground mt-1">{paidCount} of {milestones.length} milestones completed</p>
                </div>

                {/* Expanded: Milestones + Actions */}
                {isExpanded && milestones.length > 0 && (
                  <div className="mt-5 pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-3">Milestones</h4>
                    <div className="space-y-3">
                      {milestones.map((ms: any, i: number) => (
                        <div key={ms.id} className="flex items-start gap-3">
                          <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border", ["paid", "approved"].includes(ms.status) ? "bg-emerald-100 border-emerald-300 text-emerald-700" : ms.status === "in_progress" ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-gray-100 border-gray-200 text-gray-400")}>
                            {["paid", "approved"].includes(ms.status) ? "✓" : i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{ms.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold">{formatCurrency(ms.amount)}</span>
                                <Badge className={cn("text-[10px] capitalize", ms.status === "paid" ? "bg-emerald-50 text-emerald-700" : ms.status === "in_progress" ? "bg-amber-50 text-amber-700" : ms.status === "submitted" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500")}>{ms.status.replace("_", " ")}</Badge>
                              </div>
                            </div>
                            {ms.description && <p className="text-xs text-muted-foreground mt-0.5">{ms.description}</p>}
                            {ms.status === "in_progress" && (
                              <Button variant="terracotta" size="sm" className="mt-2 gap-1.5" onClick={async (e) => { e.stopPropagation(); await fetch(`/api/milestones/${ms.id}/submit`, { method: "POST" }); window.location.reload(); }}>
                                <CheckCircle2 className="h-3 w-3" />Submit for Approval
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="gap-1.5"><Link href={`/projects/${project.id}`}><FolderKanban className="h-3.5 w-3.5" />Full View</Link></Button>
                      <Button variant="outline" size="sm" asChild className="gap-1.5"><Link href="/client-messages"><MessageSquare className="h-3.5 w-3.5" />Message Client</Link></Button>
                    </div>
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

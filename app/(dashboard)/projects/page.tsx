"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderKanban, Search } from "lucide-react";
import { Card, CardContent, Button, Badge, Progress, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate, getStatusColor, cn } from "@/lib/utils";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(res => {
      if (res.success) setProjects(res.data?.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? projects : projects.filter(p => p.status === filter);
  const statuses = ["ALL", "DRAFT", "OPEN", "IN_PROGRESS", "REVIEW", "COMPLETED"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold">My Projects</h1><p className="text-sm text-muted-foreground mt-1">Manage and track your design projects</p></div>
        <Button variant="terracotta" className="gap-2" asChild><Link href="/projects/new"><Plus className="h-4 w-4" /> New Project</Link></Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors", filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>{s === "ALL" ? "All" : s.replace("_", " ")}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-12 w-12" />} title="No projects found" description={filter === "ALL" ? "Start by creating your first design project" : `No ${filter.toLowerCase().replace("_", " ")} projects`} action={<Button variant="terracotta" className="gap-2"><Plus className="h-4 w-4" /> Create Project</Button>} />
      ) : (
        <div className="space-y-4">
          {filtered.map(project => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{project.title}</h3>
                        <Badge className={cn("text-[10px] capitalize", getStatusColor(project.status?.toLowerCase()))}>{(project.status || "draft").replace("_", " ")}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{project.roomType} • {project.style}</span>
                        <span>{formatCurrency(project.budgetMin || 0)} – {formatCurrency(project.budgetMax || 0)}</span>
                        {project.location && <span>{project.location}</span>}
                        {project.viewCount > 0 && <span className="flex items-center gap-1">👁 {project.viewCount} views</span>}
                        {project._count?.proposals > 0 && <span>{project._count.proposals} proposals</span>}
                      </div>
                    </div>
                    <div className="w-32 shrink-0">
                      <div className="flex justify-between text-xs mb-1"><span>Progress</span><span className="font-medium">{project.progress || 0}%</span></div>
                      <Progress value={project.progress || 0} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

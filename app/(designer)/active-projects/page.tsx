"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FolderKanban, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, Button, Badge, Progress, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export default function ActiveProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(res => {
      if (res.success) setProjects(res.data?.items?.filter((p: any) => ["IN_PROGRESS", "REVIEW"].includes(p.status)) || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Active Projects</h1>
      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-12 w-12" />} title="No active projects" description="Accept proposals to start working on projects" />
      ) : (
        <div className="space-y-4">{projects.map(project => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div><h3 className="font-semibold">{project.title}</h3><p className="text-xs text-muted-foreground mt-0.5">{project.client?.firstName} {project.client?.lastName} • {project.location}</p></div>
                  <Badge className={cn("text-[10px] capitalize", project.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700")}>{project.status.replace("_", " ")}</Badge>
                </div>
                <div className="flex justify-between text-xs mb-2"><span className="text-muted-foreground">Progress</span><span className="font-medium">{project.progress}%</span></div>
                <Progress value={project.progress} className="h-2" />
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>{project.roomType} • {project.style}</span>
                  <span>{formatCurrency(project.budgetMin)} – {formatCurrency(project.budgetMax)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}</div>
      )}
    </div>
  );
}

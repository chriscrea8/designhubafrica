"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FileText, Clock, CheckCircle2, XCircle, Eye, MapPin, DollarSign } from "lucide-react";
import { Card, CardContent, Button, Badge, EmptyState, Avatar, Progress } from "@/components/ui";
import { formatCurrency, formatDate, formatRelativeTime, cn } from "@/lib/utils";

export default function ProposalsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch open projects to show available + own proposals
    fetch("/api/projects?status=OPEN").then(r => r.json()).then(res => {
      if (res.success) setProjects(res.data?.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Proposals</h1><p className="text-sm text-muted-foreground mt-1">Browse open projects and submit proposals</p></div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">3</p><p className="text-xs text-muted-foreground mt-1">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">5</p><p className="text-xs text-muted-foreground mt-1">Accepted</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-500">1</p><p className="text-xs text-muted-foreground mt-1">Declined</p></CardContent></Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Open Projects — Submit a Proposal</h2>
        {projects.length === 0 ? (
          <EmptyState icon={<FileText className="h-12 w-12" />} title="No open projects right now" description="Check back later for new project opportunities" />
        ) : (
          <div className="space-y-4">{projects.map(project => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.location || "Remote"}</span>
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrency(project.budgetMin)} – {formatCurrency(project.budgetMax)}</span>
                      <Badge variant="secondary" className="text-[10px]">{project.roomType}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{project.style}</Badge>
                      {project.urgency === "high" && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                    </div>
                  </div>
                  <Button variant="terracotta" size="sm">Submit Proposal</Button>
                </div>
              </CardContent>
            </Card>
          ))}</div>
        )}
      </div>
    </div>
  );
}

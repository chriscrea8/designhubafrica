"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, Clock, DollarSign, User, Calendar, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Separator } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-red-50 text-red-700",
  DISPUTED: "bg-amber-50 text-amber-700",
  DRAFT: "bg-gray-100 text-gray-600",
};

const msColors: Record<string, string> = {
  paid: "text-emerald-600", approved: "text-emerald-600",
  submitted: "text-blue-600", in_progress: "text-amber-600", pending: "text-gray-400",
};

function ContractContent() {
  const params = useParams();
  const { data: session } = useSession();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetch(`/api/contracts/${params.id}`).then(r => r.json()).then(res => {
        if (res.success) setContract(res.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [params?.id]);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;
  if (!contract) return <div className="text-center py-16"><h2 className="text-xl font-bold">Contract not found</h2><Link href="/projects" className="text-sm text-terracotta-500 mt-2 inline-block">Back to Projects</Link></div>;

  const isClient = contract.clientId === session?.user?.id;
  const milestones = contract.project?.milestones || [];
  const paid = milestones.filter((m: any) => m.status === "paid").length;
  const totalMs = milestones.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Projects</Link>

      {/* Contract Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">Contract</h1>
            <Badge className={cn("text-[10px]", statusColors[contract.status] || "bg-gray-100")}>{contract.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">#{contract.id.slice(-8).toUpperCase()} · {contract.project?.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Created {formatDate(contract.createdAt)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 shrink-0"><FileText className="h-4 w-4" />Print</Button>
      </div>

      {/* Parties */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card><CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Client</p>
          <div className="flex items-center gap-3">
            <Avatar fallback={`${contract.client?.firstName?.[0] || ""}${contract.client?.lastName?.[0] || ""}`} size="md" />
            <div><p className="font-semibold">{contract.client?.firstName} {contract.client?.lastName}</p><p className="text-xs text-muted-foreground">{contract.client?.email}</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Designer</p>
          <div className="flex items-center gap-3">
            <Avatar fallback={`${contract.professional?.firstName?.[0] || ""}${contract.professional?.lastName?.[0] || ""}`} size="md" />
            <div><p className="font-semibold">{contract.professional?.firstName} {contract.professional?.lastName}</p><p className="text-xs text-muted-foreground">{contract.professional?.email}</p></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Financial Summary */}
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Financial Summary</CardTitle></CardHeader><CardContent>
        <div className="grid sm:grid-cols-3 gap-6">
          <div><p className="text-sm text-muted-foreground">Total Contract Value</p><p className="text-2xl font-bold mt-1">{formatCurrency(contract.totalAmount)}</p></div>
          <div><p className="text-sm text-muted-foreground">Platform Commission</p><p className="text-2xl font-bold mt-1 text-amber-600">{Math.round(contract.commissionRate * 100)}%</p></div>
          <div><p className="text-sm text-muted-foreground">Designer Receives</p><p className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(Math.round(contract.totalAmount * (1 - contract.commissionRate)))}</p></div>
        </div>
      </CardContent></Card>

      {/* Milestone Schedule */}
      <Card><CardHeader><CardTitle className="text-base">Payment Schedule ({paid}/{totalMs} milestones paid)</CardTitle></CardHeader><CardContent className="p-0">
        {milestones.length === 0 ? <div className="p-6 text-center text-sm text-muted-foreground">No milestones yet</div>
        : milestones.map((ms: any, i: number) => (
          <div key={ms.id} className="flex items-center gap-4 px-5 py-4 border-b last:border-0">
            <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border", ["paid","approved"].includes(ms.status) ? "bg-emerald-100 border-emerald-300 text-emerald-700" : ms.status === "in_progress" ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-gray-100 border-gray-200 text-gray-400")}>
              {["paid","approved"].includes(ms.status) ? "✓" : i + 1}
            </div>
            <div className="flex-1"><p className="text-sm font-medium">{ms.title}</p></div>
            <div className="text-right"><p className="text-sm font-semibold">{formatCurrency(ms.amount)}</p><Badge className={cn("text-[10px] capitalize", ms.status === "paid" ? "bg-emerald-50 text-emerald-700" : ms.status === "in_progress" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500")}>{ms.status.replace("_"," ")}</Badge></div>
          </div>
        ))}
      </CardContent></Card>

      {/* Terms */}
      <Card><CardHeader><CardTitle className="text-base">Contract Terms</CardTitle></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>• All payments are held in escrow by DesignHub Africa and released only upon client approval of each milestone.</p>
        <p>• A platform commission of {Math.round(contract.commissionRate * 100)}% applies to all payments released.</p>
        <p>• Disputes are handled through the DesignHub Africa dispute resolution process.</p>
        <p>• Both parties agree to keep all communication on the platform until project completion.</p>
      </CardContent></Card>

      <div className="flex gap-3">
        <Button variant="terracotta" asChild><Link href={`/projects/${contract.projectId}`}>View Project</Link></Button>
        <Button variant="outline" asChild><Link href="/messages">Message {isClient ? "Designer" : "Client"}</Link></Button>
      </div>
    </div>
  );
}

export default function ContractPage() {
  return <Suspense fallback={<div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>}><ContractContent /></Suspense>;
}

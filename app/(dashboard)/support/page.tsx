"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { HelpCircle, MessageSquare, Send, Loader2, CheckCircle2, AlertTriangle, CreditCard, Shield, Users, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Separator } from "@/components/ui";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "payment", label: "Payment Issues", icon: CreditCard, desc: "Escrow, refunds, wallet, payouts" },
  { id: "dispute", label: "Disputes", icon: AlertTriangle, desc: "Project disputes, disagreements" },
  { id: "account", label: "Account & Profile", icon: Users, desc: "Settings, verification, login" },
  { id: "project", label: "Project Issues", icon: Package, desc: "Milestones, proposals, timeline" },
  { id: "safety", label: "Trust & Safety", icon: Shield, desc: "Report abuse, scam, harassment" },
  { id: "general", label: "General Support", icon: HelpCircle, desc: "Other questions or feedback" },
];

export default function SupportPage() {
  const { data: session } = useSession();
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submitTicket() {
    if (!message || !category) return;
    setSubmitting(true);
    // Create support notification (in production, this would create a support ticket)
    await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: "admin", type: "support_ticket", title: `Support: ${CATEGORIES.find(c => c.id === category)?.label}`, message: `From ${session?.user?.email}: ${message}` }) }).catch(() => {});
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) return (
    <div className="max-w-lg mx-auto text-center py-16 space-y-4">
      <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"><CheckCircle2 className="h-8 w-8 text-emerald-500" /></div>
      <h2 className="text-xl font-bold">Support Ticket Submitted</h2>
      <p className="text-muted-foreground">We'll get back to you within 24 hours via email at {session?.user?.email}.</p>
      <Button variant="outline" onClick={() => { setSubmitted(false); setCategory(null); setMessage(""); }}>Submit Another</Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold">Support</h1><p className="text-sm text-muted-foreground mt-1">How can we help you?</p></div>

      {!category ? (
        <div className="grid sm:grid-cols-2 gap-3">{CATEGORIES.map(cat => (
          <Card key={cat.id} className="cursor-pointer hover:border-terracotta-300 hover:shadow-sm transition-all" onClick={() => setCategory(cat.id)}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-terracotta-50 flex items-center justify-center shrink-0"><cat.icon className="h-5 w-5 text-terracotta-500" /></div>
              <div><h3 className="font-semibold text-sm">{cat.label}</h3><p className="text-xs text-muted-foreground mt-0.5">{cat.desc}</p></div>
            </CardContent>
          </Card>
        ))}</div>
      ) : (
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2">{(() => { const C = CATEGORIES.find(c => c.id === category); return C ? <><C.icon className="h-4 w-4" />{C.label}</> : null; })()}</CardTitle><p className="text-sm text-muted-foreground">Describe your issue in detail</p></CardHeader><CardContent className="space-y-4">
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Tell us what happened..." />
          <div className="flex gap-2">
            <Button variant="terracotta" onClick={submitTicket} disabled={!message || submitting} className="gap-2">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Submit Ticket</Button>
            <Button variant="outline" onClick={() => setCategory(null)}>Back</Button>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}

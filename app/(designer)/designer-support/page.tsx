"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { HelpCircle, MessageSquare, Send, Loader2, CheckCircle2, AlertTriangle, CreditCard, Shield, Users, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "payment", label: "Payment Issues", icon: CreditCard, desc: "Escrow, refunds, wallet, payouts", color: "text-blue-500 bg-blue-50" },
  { id: "dispute", label: "Disputes", icon: AlertTriangle, desc: "Project disputes, disagreements", color: "text-red-500 bg-red-50" },
  { id: "account", label: "Account & Profile", icon: Users, desc: "Settings, verification, login", color: "text-purple-500 bg-purple-50" },
  { id: "project", label: "Project Issues", icon: Package, desc: "Milestones, proposals, timeline", color: "text-amber-500 bg-amber-50" },
  { id: "safety", label: "Trust & Safety", icon: Shield, desc: "Report abuse, scam, harassment", color: "text-rose-500 bg-rose-50" },
  { id: "general", label: "General Support", icon: HelpCircle, desc: "Other questions or feedback", color: "text-gray-500 bg-gray-50" },
];

export default function SupportPage() {
  const { data: session } = useSession();
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [error, setError] = useState("");

  async function submitTicket() {
    if (!message || message.length < 10) { setError("Please describe your issue in detail (min 10 chars)"); return; }
    setSubmitting(true); setError("");
    const res = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, message }) });
    const json = await res.json();
    setSubmitting(false);
    if (json.success) { setTicketId(json.data.ticketId); setSubmitted(true); }
    else setError(json.error || "Failed to submit. Please try again.");
  }

  if (submitted) return (
    <div className="max-w-lg mx-auto text-center py-16 space-y-4">
      <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"><CheckCircle2 className="h-8 w-8 text-emerald-500" /></div>
      <h2 className="text-xl font-bold">Ticket Submitted!</h2>
      <p className="text-muted-foreground">Reference: <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{ticketId.slice(-8).toUpperCase()}</code></p>
      <p className="text-sm text-muted-foreground">We will respond to <strong>{session?.user?.email}</strong> within 24 hours.</p>
      <Button variant="outline" onClick={() => { setSubmitted(false); setCategory(null); setMessage(""); }}>Submit Another</Button>
    </div>
  );

  const selectedCat = CATEGORIES.find(c => c.id === category);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold">Support</h1><p className="text-sm text-muted-foreground mt-1">How can we help you today?</p></div>

      {!category ? (
        <div className="grid sm:grid-cols-2 gap-3">{CATEGORIES.map(cat => (
          <Card key={cat.id} className="cursor-pointer hover:border-terracotta-300 hover:shadow-sm transition-all" onClick={() => setCategory(cat.id)}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", cat.color)}><cat.icon className="h-5 w-5" /></div>
              <div><h3 className="font-semibold text-sm">{cat.label}</h3><p className="text-xs text-muted-foreground mt-0.5">{cat.desc}</p></div>
            </CardContent>
          </Card>
        ))}</div>
      ) : (
        <Card className="border-terracotta-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">{selectedCat && <><div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", selectedCat.color)}><selectedCat.icon className="h-4 w-4" /></div>{selectedCat.label}</>}</CardTitle>
              <Badge className={cn("text-[10px]", category === "dispute" || category === "safety" ? "bg-red-50 text-red-700" : category === "payment" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600")}>{category === "dispute" || category === "safety" ? "Urgent" : category === "payment" ? "High Priority" : "Normal"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Describe your issue clearly. Include relevant project IDs, dates, or amounts.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Tell us what happened in detail..." />
            <p className="text-xs text-muted-foreground">{message.length} characters</p>
            <div className="flex gap-2">
              <Button variant="terracotta" onClick={submitTicket} disabled={!message || message.length < 10 || submitting} className="gap-2">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Submit Ticket</Button>
              <Button variant="outline" onClick={() => { setCategory(null); setError(""); }}>Back</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

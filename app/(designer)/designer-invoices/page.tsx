"use client";
import React, { useEffect, useState } from "react";
import { Plus, Send, Download, FileText, Loader2, X, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Separator, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface LineItem { itemName: string; description: string; quantity: number; unitPrice: number; }

const STATUS_STYLE: Record<string,string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT:  "bg-blue-50 text-blue-700",
  PAID:  "bg-emerald-50 text-emerald-700",
};

export default function DesignerInvoicesPage() {
  const [invoices,  setInvoices]  = useState<any[]>([]);
  const [projects,  setProjects]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [sending,   setSending]   = useState<string | null>(null);
  const [error,     setError]     = useState("");

  const [form, setForm] = useState({
    title: "", clientEmail: "", projectId: "", notes: "", dueDate: "",
  });
  const [items, setItems] = useState<LineItem[]>([
    { itemName: "", description: "", quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    load();
    fetch("/api/projects?status=IN_PROGRESS&limit=50").then(r => r.json()).then(res => {
      if (res.success) setProjects(res.data?.items || []);
    }).catch(() => {});
  }, []);

  async function load() {
    const res = await fetch("/api/invoices");
    const json = await res.json();
    if (json.success) setInvoices(json.data || []);
    setLoading(false);
  }

  const lineTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  function addItem() {
    setItems(prev => [...prev, { itemName: "", description: "", quantity: 1, unitPrice: 0 }]);
  }
  function removeItem(i: number) {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, j) => j !== i));
  }
  function setItem(i: number, field: keyof LineItem, value: any) {
    setItems(prev => prev.map((item, j) => j === i ? { ...item, [field]: field === "quantity" || field === "unitPrice" ? Number(value) || 0 : value } : item));
  }

  async function createInvoice() {
    setError("");
    if (!form.title)        { setError("Invoice title required"); return; }
    if (!form.clientEmail)  { setError("Client email required"); return; }
    if (!items[0].itemName) { setError("At least one line item required"); return; }
    if (lineTotal === 0)    { setError("Total amount must be greater than 0"); return; }
    setSaving(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, clientId: form.clientEmail, items }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) {
      setShowForm(false);
      setForm({ title: "", clientEmail: "", projectId: "", notes: "", dueDate: "" });
      setItems([{ itemName: "", description: "", quantity: 1, unitPrice: 0 }]);
      load();
    } else {
      setError(json.error || "Failed to create invoice");
    }
  }

  async function sendInvoice(id: string) {
    setSending(id);
    const res = await fetch(`/api/invoices/${id}/send`, { method: "POST" });
    const json = await res.json();
    setSending(null);
    if (json.success) load();
    else alert(json.error || "Failed to send");
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Invoices</h1><p className="text-sm text-muted-foreground mt-1">Create and send invoices to clients</p></div>
        <Button variant="terracotta" className="gap-2" onClick={() => { setShowForm(!showForm); setError(""); }}>
          <Plus className="h-4 w-4" />{showForm ? "Cancel" : "New Invoice"}
        </Button>
      </div>

      {/* Invoice Builder */}
      {showForm && (
        <Card className="border-terracotta-200">
          <CardHeader><CardTitle className="text-base">New Invoice</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

            {/* Header info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1.5 block">Invoice Title <span className="text-red-500">*</span></label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Interior Design Services — Living Room" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Client Email <span className="text-red-500">*</span></label>
                <Input type="email" value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})} placeholder="client@email.com" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Linked Project <span className="text-muted-foreground font-normal">(optional)</span></label>
                <select value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">None</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select></div>
              <div><label className="text-sm font-medium mb-1.5 block">Due Date</label>
                <Input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Line Items</h4>
                <Button variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="h-3 w-3" />Add Row</Button>
              </div>
              <div className="space-y-2">
                <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span className="col-span-4">Item</span><span className="col-span-3">Description</span>
                  <span className="col-span-1 text-center">Qty</span><span className="col-span-2 text-right">Price (₦)</span>
                  <span className="col-span-1 text-right">Total</span><span className="col-span-1" />
                </div>
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-12 sm:col-span-4" value={item.itemName} onChange={e => setItem(i, "itemName", e.target.value)} placeholder="Service or item name" />
                    <Input className="col-span-12 sm:col-span-3" value={item.description} onChange={e => setItem(i, "description", e.target.value)} placeholder="Details (optional)" />
                    <Input className="col-span-4 sm:col-span-1 text-center" type="number" min={1} value={item.quantity} onChange={e => setItem(i, "quantity", e.target.value)} />
                    <Input className="col-span-7 sm:col-span-2 text-right" type="number" min={0} value={item.unitPrice || ""} onChange={e => setItem(i, "unitPrice", e.target.value)} placeholder="0" />
                    <div className="col-span-7 sm:col-span-1 text-right text-sm font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</div>
                    <button onClick={() => removeItem(i)} className="col-span-1 flex justify-center text-red-400 hover:text-red-600 disabled:opacity-30" disabled={items.length === 1}><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <div className="flex justify-end pt-3 border-t">
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">Total: </span>
                    <span className="text-xl font-bold text-terracotta-500">{formatCurrency(lineTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div><label className="text-sm font-medium mb-1.5 block">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Payment terms, bank details, or additional notes..." /></div>

            <div className="flex gap-3">
              <Button variant="terracotta" onClick={createInvoice} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {saving ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice List */}
      {invoices.length === 0 && !showForm ? (
        <EmptyState icon={<FileText className="h-12 w-12" />} title="No invoices yet" description="Create your first invoice to send to a client" />
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <Card key={inv.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-terracotta-50 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-terracotta-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{inv.title}</h3>
                    <Badge className={cn("text-[10px]", STATUS_STYLE[inv.status] || "")}>{inv.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    To: {inv.client?.firstName} {inv.client?.lastName} · {inv.items?.length || 0} item{inv.items?.length !== 1 ? "s" : ""}
                    {inv.dueDate && ` · Due ${formatDate(inv.dueDate)}`}
                  </p>
                  <p className="text-sm font-bold mt-1">{formatCurrency(inv.totalAmount)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {inv.status === "DRAFT" && (
                    <Button variant="terracotta" size="sm" onClick={() => sendInvoice(inv.id)} disabled={sending === inv.id} className="gap-1.5">
                      {sending === inv.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}Send
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, "_blank")} className="gap-1.5">
                    <Download className="h-3 w-3" />PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

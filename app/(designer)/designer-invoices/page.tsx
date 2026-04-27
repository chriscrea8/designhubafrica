"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Plus, Send, Download, Trash2, FileText, Loader2, CheckCircle2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, EmptyState, Separator } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface InvoiceItem { itemName: string; description: string; quantity: number; unitPrice: number; }

export default function DesignerInvoicesPage() {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", clientId: "", projectId: "", notes: "", dueDate: "" });
  const [items, setItems] = useState<InvoiceItem[]>([{ itemName: "", description: "", quantity: 1, unitPrice: 0 }]);

  useEffect(() => { loadInvoices(); }, []);

  async function loadInvoices() {
    const res = await fetch("/api/invoices");
    const json = await res.json();
    if (json.success) setInvoices(json.data || []);
    setLoading(false);
  }

  const total = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);

  function addItem() { setItems(prev => [...prev, { itemName: "", description: "", quantity: 1, unitPrice: 0 }]); }
  function removeItem(i: number) { setItems(prev => prev.filter((_, j) => j !== i)); }
  function updateItem(i: number, field: keyof InvoiceItem, value: any) { setItems(prev => prev.map((item, j) => j === i ? { ...item, [field]: value } : item)); }

  async function saveInvoice() {
    if (!form.title || !form.clientId) return;
    setSaving(true);
    const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, items }) });
    const json = await res.json();
    setSaving(false);
    if (json.success) { setShowCreate(false); loadInvoices(); setForm({ title: "", clientId: "", projectId: "", notes: "", dueDate: "" }); setItems([{ itemName: "", description: "", quantity: 1, unitPrice: 0 }]); }
  }

  async function sendInvoice(id: string) {
    await fetch(`/api/invoices/${id}/send`, { method: "POST" });
    loadInvoices();
  }

  const statusColors: any = { DRAFT: "bg-gray-100 text-gray-600", SENT: "bg-blue-50 text-blue-700", PAID: "bg-emerald-50 text-emerald-700" };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Invoices</h1><p className="text-sm text-muted-foreground mt-1">Create and send invoices to clients</p></div>
        <Button variant="terracotta" onClick={() => setShowCreate(!showCreate)} className="gap-2"><Plus className="h-4 w-4" />{showCreate ? "Cancel" : "New Invoice"}</Button>
      </div>

      {showCreate && (
        <Card className="border-terracotta-200"><CardHeader><CardTitle className="text-base">Create Invoice</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Invoice Title</label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Interior Design Services - Phase 1" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Client Email</label><Input value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} placeholder="Client's email or user ID" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Due Date</label><Input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Notes</label><Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Payment terms, bank info, etc." /></div>
          </div>
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-semibold">Line Items</h4><Button variant="outline" size="sm" onClick={addItem} className="gap-1"><Plus className="h-3 w-3" />Add</Button></div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1"><span className="col-span-4">Item</span><span className="col-span-3">Description</span><span className="col-span-1 text-center">Qty</span><span className="col-span-2 text-right">Unit Price</span><span className="col-span-1 text-right">Total</span><span className="col-span-1" /></div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <Input className="col-span-4" value={item.itemName} onChange={e => updateItem(i, "itemName", e.target.value)} placeholder="Service name" />
                  <Input className="col-span-3" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Details" />
                  <Input className="col-span-1 text-center" type="number" value={item.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value) || 1)} min={1} />
                  <Input className="col-span-2 text-right" type="number" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", parseInt(e.target.value) || 0)} placeholder="0" />
                  <span className="col-span-1 text-right text-sm font-medium">₦{(item.quantity * item.unitPrice).toLocaleString()}</span>
                  <button onClick={() => removeItem(i)} className="col-span-1 flex justify-center text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t"><div className="text-right"><span className="text-sm text-muted-foreground">Total: </span><span className="text-lg font-bold text-terracotta-500">{formatCurrency(total)}</span></div></div>
            </div>
          </div>
          <Button variant="terracotta" onClick={saveInvoice} disabled={!form.title || !form.clientId || saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}Save Invoice</Button>
        </CardContent></Card>
      )}

      {invoices.length === 0 && !showCreate ? <EmptyState icon={<FileText className="h-12 w-12" />} title="No invoices yet" description="Create your first invoice to send to a client" /> : (
        <div className="space-y-3">{invoices.map(inv => (
          <Card key={inv.id}><CardContent className="p-5 flex items-center justify-between gap-4">
            <div><h3 className="font-semibold">{inv.title}</h3><p className="text-xs text-muted-foreground mt-0.5">{inv.client?.firstName} {inv.client?.lastName} • {inv.items?.length} item{inv.items?.length !== 1 ? "s" : ""}</p><p className="text-sm font-bold mt-1">{formatCurrency(inv.totalAmount)}</p></div>
            <div className="flex items-center gap-2">
              <Badge className={cn("text-[10px]", statusColors[inv.status])}>{inv.status}</Badge>
              {inv.status === "DRAFT" && <Button variant="outline" size="sm" onClick={() => sendInvoice(inv.id)} className="gap-1"><Send className="h-3 w-3" />Send</Button>}
              <Button variant="ghost" size="sm" onClick={() => window.open(`/api/invoices/${inv.id}/pdf`, "_blank")} className="gap-1"><Download className="h-3 w-3" />PDF</Button>
            </div>
          </CardContent></Card>
        ))}</div>
      )}
    </div>
  );
}

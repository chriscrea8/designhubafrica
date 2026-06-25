"use client";
import React, { useEffect, useState } from "react";
import { Plus, Edit2, Copy, Trash2, Send, Eye, FileText, Loader2, X, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  DRAFT:"bg-amber-50 text-amber-700", SENT:"bg-blue-50 text-blue-700", PAID:"bg-emerald-50 text-emerald-700",
  REVISION_REQUESTED:"bg-orange-50 text-orange-700",
};

const BLANK_ITEM = { itemName:"", description:"", quantity:1, unitPrice:0 };

export default function DesignerInvoicesPage() {
  const [invoices,  setInvoices]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState<"create"|"edit"|null>(null);
  const [editInvoice, setEditInvoice] = useState<any>(null);
  const [saving,    setSaving]    = useState(false);
  const [expanded,  setExpanded]  = useState<string|null>(null);
  const [form,      setForm]      = useState<any>({ title:"", notes:"", dueDate:"", clientId:"", projectId:"" });
  const [items,     setItems]     = useState([{ ...BLANK_ITEM }]);
  const [clients,   setClients]   = useState<any[]>([]);

  useEffect(() => {
    load();
    fetch("/api/projects?mine=designer&limit=50").then(r=>r.json()).then(res => {
      const projects = res.data?.items || res.data || [];
      const uniqueClients = Array.from(new Map(projects.map((p: any) => [p.clientId, { id: p.clientId, name: `${p.client?.firstName||""} ${p.client?.lastName||""}`.trim(), projectId: p.id, projectTitle: p.title }])).values());
      setClients(uniqueClients);
    }).catch(()=>{});
  }, []);

  async function load() {
    const res = await fetch("/api/invoices?role=designer").then(r=>r.json()).catch(()=>({}));
    if (res.success) setInvoices(Array.isArray(res.data) ? res.data : (res.data?.items || []));
    setLoading(false);
  }

  function openCreate() {
    setForm({ title:"", notes:"", dueDate:"", clientId:"", projectId:"" });
    setItems([{ ...BLANK_ITEM }]);
    setEditInvoice(null);
    setModal("create");
  }

  function openEdit(inv: any) {
    setForm({ title: inv.title, notes: inv.notes||"", dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "", clientId: inv.clientId, projectId: inv.projectId||"" });
    setItems(inv.items?.map((i: any) => ({ itemName: i.itemName, description: i.description||"", quantity: i.quantity, unitPrice: i.unitPrice })) || [{ ...BLANK_ITEM }]);
    setEditInvoice(inv);
    setModal("edit");
  }

  function total() { return items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0); }

  async function save() {
    if (!form.title || !form.clientId || items.length === 0) return;
    setSaving(true);
    const payload = { ...form, items, totalAmount: total(), dueDate: form.dueDate || null };
    let res;
    if (modal === "edit" && editInvoice) {
      res = await fetch(`/api/invoices/${editInvoice.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    } else {
      res = await fetch("/api/invoices", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    }
    setSaving(false);
    if (res.ok) { setModal(null); load(); }
  }

  async function duplicate(id: string) {
    await fetch("/api/invoices", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ invoiceId: id }) });
    load();
  }

  async function send(id: string) {
    await fetch(`/api/invoices/${id}/send`, { method:"POST" });
    load();
  }

  async function del(id: string) {
    if (!confirm("Delete this invoice?")) return;
    await fetch(`/api/invoices/${id}`, { method:"DELETE" });
    load();
  }

  function setItem(i: number, field: string, value: any) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: field === "quantity" || field === "unitPrice" ? parseFloat(value)||0 : value } : item));
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Invoices</h1><p className="text-sm text-muted-foreground mt-1">Create, edit, duplicate and send invoices to clients</p></div>
        <Button variant="terracotta" onClick={openCreate} className="gap-2"><Plus className="h-4 w-4"/>New Invoice</Button>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
          <p className="font-semibold">No invoices yet</p>
          <Button variant="terracotta" className="mt-4" onClick={openCreate}>Create Invoice</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv: any) => (
            <Card key={inv.id} className={cn(inv.status==="REVISION_REQUESTED" && "border-orange-300 bg-orange-50/5")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{inv.title}</p>
                      <Badge className={cn("text-[10px]", STATUS_STYLE[inv.status]||"")}>{inv.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span>Client: {inv.client?.firstName} {inv.client?.lastName}</span>
                      <span className="font-bold text-foreground">{formatCurrency(inv.totalAmount)}</span>
                      {inv.dueDate && <span>Due {formatDate(inv.dueDate)}</span>}
                    </div>
                    {inv.status === "REVISION_REQUESTED" && inv.revisionNotes && (
                      <p className="text-xs text-orange-600 mt-1 bg-orange-50 rounded px-2 py-1">📝 Client requested: {inv.revisionNotes}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0 flex-wrap">
                    {inv.status !== "PAID" && <Button variant="outline" size="sm" onClick={() => openEdit(inv)} className="gap-1"><Edit2 className="h-3 w-3"/>Edit</Button>}
                    <Button variant="outline" size="sm" onClick={() => duplicate(inv.id)} className="gap-1"><Copy className="h-3 w-3"/>Duplicate</Button>
                    {inv.status === "DRAFT" && <Button variant="terracotta" size="sm" onClick={() => send(inv.id)} className="gap-1"><Send className="h-3 w-3"/>Send</Button>}
                    <button onClick={() => setExpanded(expanded === inv.id ? null : inv.id)} className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-accent">
                      {expanded === inv.id ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                    </button>
                    {inv.status === "DRAFT" && <button onClick={() => del(inv.id)} className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-red-50 text-red-400"><Trash2 className="h-3.5 w-3.5"/></button>}
                  </div>
                </div>
                {expanded === inv.id && inv.items?.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <table className="w-full text-sm">
                      <thead><tr className="text-xs text-muted-foreground"><th className="text-left py-1">Item</th><th className="text-right">Qty</th><th className="text-right">Unit</th><th className="text-right">Total</th></tr></thead>
                      <tbody>{inv.items.map((item: any) => (<tr key={item.id} className="border-t border-muted/30"><td className="py-1.5">{item.itemName}</td><td className="text-right">{item.quantity}</td><td className="text-right">{formatCurrency(item.unitPrice)}</td><td className="text-right font-medium">{formatCurrency(item.totalPrice)}</td></tr>))}</tbody>
                      <tfoot><tr className="border-t font-bold"><td colSpan={3} className="pt-2">Total</td><td className="text-right pt-2 text-terracotta-600">{formatCurrency(inv.totalAmount)}</td></tr></tfoot>
                    </table>
                    {inv.notes && <p className="text-xs text-muted-foreground mt-2 italic">{inv.notes}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto" onClick={()=>setModal(null)}>
          <div className="bg-background rounded-2xl w-full max-w-2xl shadow-xl my-4" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-bold text-lg">{modal==="edit"?"Edit Invoice":"New Invoice"}</h3>
              <button onClick={()=>setModal(null)}><X className="h-5 w-5 text-muted-foreground"/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Invoice Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Living Room Design — Phase 1" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
                <div><label className="text-sm font-medium mb-1.5 block">Client</label>
                  <select value={form.clientId} onChange={e=>{ const cl = clients.find(c=>c.id===e.target.value); setForm({...form,clientId:e.target.value,projectId:cl?.projectId||""}); }} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select client…</option>
                    {clients.map(c=><option key={c.id} value={c.id}>{c.name} — {c.projectTitle}</option>)}
                  </select></div>
                <div><label className="text-sm font-medium mb-1.5 block">Due Date</label><input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Line Items</label>
                  <button onClick={()=>setItems(prev=>[...prev,{...BLANK_ITEM}])} className="text-xs text-terracotta-500 hover:underline flex items-center gap-1"><Plus className="h-3 w-3"/>Add Item</button>
                </div>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-start">
                      <div className="col-span-5"><input value={item.itemName} onChange={e=>setItem(i,"itemName",e.target.value)} placeholder="Item name" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"/></div>
                      <div className="col-span-2"><input type="number" value={item.quantity} onChange={e=>setItem(i,"quantity",e.target.value)} placeholder="Qty" min="1" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-center"/></div>
                      <div className="col-span-4"><input type="number" value={item.unitPrice} onChange={e=>setItem(i,"unitPrice",e.target.value)} placeholder="Unit price" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"/></div>
                      <div className="col-span-1 flex justify-center pt-1.5">
                        {items.length > 1 && <button onClick={()=>setItems(prev=>prev.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600"><X className="h-4 w-4"/></button>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-3 pt-3 border-t">
                  <span className="font-bold text-lg">{formatCurrency(total())}</span>
                </div>
              </div>

              <div><label className="text-sm font-medium mb-1.5 block">Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Payment terms, bank details, etc."/></div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <Button variant="terracotta" onClick={save} disabled={saving||!form.title||!form.clientId} className="gap-2">{saving&&<Loader2 className="h-4 w-4 animate-spin"/>}{modal==="edit"?"Save Changes":"Create Invoice"}</Button>
              <Button variant="outline" onClick={()=>setModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

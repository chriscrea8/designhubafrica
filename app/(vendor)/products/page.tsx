"use client";
import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Package, Loader2, CheckCircle2, Clock, XCircle, Image as ImageIcon, X } from "lucide-react";
import { Card, CardContent, Button, Badge, Input, Separator, EmptyState } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

const CATEGORIES = ["Furniture","Lighting","Tiles","Paint","Kitchen Fittings","Bathroom Fittings","Decor","Construction Materials"];
const STATUS_STYLE: Record<string,string> = { APPROVED:"bg-emerald-50 text-emerald-700", PENDING:"bg-amber-50 text-amber-700", REJECTED:"bg-red-50 text-red-700", DRAFT:"bg-gray-100 text-gray-600" };

interface ProductForm { name: string; description: string; price: string; category: string; stockCount: string; material: string; color: string; dimensions: string; deliveryMethod: string; shippingCost: string; tags: string; }
const BLANK: ProductForm = { name:"", description:"", price:"", category:"", stockCount:"", material:"", color:"", dimensions:"", deliveryMethod:"delivery", shippingCost:"0", tags:"" };

export default function VendorProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState<ProductForm>(BLANK);
  const [images,   setImages]   = useState<string[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [uploading,setUploading]= useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/marketplace/products?myStore=true&limit=50");
    const json = await res.json();
    if (json.success) setProducts(json.data?.items || []);
    setLoading(false);
  }

  function openCreate() { setForm(BLANK); setImages([]); setEditId(null); setShowForm(true); setError(""); }
  function openEdit(p: any) {
    setForm({ name: p.name, description: p.description, price: String(p.price), category: p.category, stockCount: String(p.stockCount || 0), material: p.material || "", color: p.color || "", dimensions: p.dimensions || "", deliveryMethod: p.deliveryMethod || "delivery", shippingCost: String(p.shippingCost || 0), tags: (p.tags || []).join(", ") });
    setImages(p.images || []);
    setEditId(p.id);
    setShowForm(true);
    setError("");
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file); fd.append("folder", "products");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (json.success) setImages(prev => [...prev, json.data.url]);
    else setError("Image upload failed");
    if (e.target) e.target.value = "";
  }

  async function save() {
    setError("");
    if (!form.name || !form.description || !form.price || !form.category) { setError("Name, description, price and category required"); return; }
    if (images.length === 0) { setError("At least one product image required"); return; }
    setSaving(true);
    const payload = { ...form, price: parseInt(form.price), stockCount: parseInt(form.stockCount) || 0, shippingCost: parseInt(form.shippingCost) || 0, images, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) };
    const res = await fetch(editId ? `/api/marketplace/products/${editId}` : "/api/marketplace/products", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) { setShowForm(false); load(); }
    else setError(json.error || "Failed to save product");
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch(`/api/marketplace/products/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">My Products</h1><p className="text-sm text-muted-foreground mt-1">{products.length} product{products.length !== 1 ? "s" : ""} · New products require admin approval before going live</p></div>
        {!showForm && <Button variant="terracotta" onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Product</Button>}
      </div>

      {/* Product Form */}
      {showForm && <Card className="border-terracotta-200"><CardContent className="p-5 space-y-5">
        <div className="flex items-center justify-between"><h3 className="font-semibold">{editId ? "Edit Product" : "New Product"}</h3><button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button></div>
        {error && <p className="text-sm text-red-500 flex items-center gap-1.5"><XCircle className="h-4 w-4" />{error}</p>}

        {/* Images */}
        <div>
          <label className="text-sm font-medium mb-2 block">Product Images <span className="text-red-500">*</span></label>
          <div className="flex flex-wrap gap-2">
            {images.map((url, i) => <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border"><img src={url} alt="" className="h-full w-full object-cover" /><button onClick={() => setImages(prev => prev.filter((_,j) => j !== i))} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/50 text-white flex items-center justify-center"><X className="h-3 w-3" /></button></div>)}
            {images.length < 6 && <label className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/40">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
              <input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={uploading} />
            </label>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Upload up to 6 images</p>
        </div>

        <Separator />

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Product Name <span className="text-red-500">*</span></label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Lagos Rattan Armchair" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Price (₦) <span className="text-red-500">*</span></label><Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Category <span className="text-red-500">*</span></label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="text-sm font-medium mb-1.5 block">Stock Quantity</label><Input type="number" value={form.stockCount} onChange={e => setForm({...form, stockCount: e.target.value})} placeholder="0" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Shipping Cost (₦)</label><Input type="number" value={form.shippingCost} onChange={e => setForm({...form, shippingCost: e.target.value})} placeholder="0" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Material</label><Input value={form.material} onChange={e => setForm({...form, material: e.target.value})} placeholder="e.g. Solid Oak" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Color</label><Input value={form.color} onChange={e => setForm({...form, color: e.target.value})} placeholder="e.g. Walnut Brown" /></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Dimensions</label><Input value={form.dimensions} onChange={e => setForm({...form, dimensions: e.target.value})} placeholder="e.g. 80cm × 75cm × 65cm" /></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Description <span className="text-red-500">*</span></label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe the product in detail..." /></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Tags <span className="text-muted-foreground font-normal">(comma separated)</span></label><Input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="e.g. modern, handmade, living room" /></div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="terracotta" onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{editId ? "Update Product" : "Submit for Approval"}</Button>
          <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
        </div>
      </CardContent></Card>}

      {/* Products list */}
      {products.length === 0 && !showForm ? (
        <EmptyState icon={<Package className="h-12 w-12" />} title="No products yet" description="Add your first product listing. It will go live after admin approval." action={<Button variant="terracotta" onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add First Product</Button>} />
      ) : (
        <div className="space-y-3">
          {products.map(p => (
            <Card key={p.id}><CardContent className="p-4 flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0">
                {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold text-sm">{p.name}</h3><Badge className={cn("text-[10px]", STATUS_STYLE[p.moderationStatus] || "")}>{p.moderationStatus}</Badge></div>
                <p className="text-xs text-muted-foreground mt-0.5">{p.category} · Stock: {p.stockCount}</p>
                <p className="font-bold mt-1">{formatCurrency(p.price)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}><Edit2 className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="sm" onClick={() => deleteProduct(p.id)} className="text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

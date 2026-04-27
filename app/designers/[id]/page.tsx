"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, Clock, CheckCircle2, Calendar, Briefcase, Award, FileText, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Separator, Input } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

export default function DesignerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params?.id as string;
  const [designer, setDesigner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("portfolio");
  const [showConsultation, setShowConsultation] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [proposalMsg, setProposalMsg] = useState("");
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/designers/${id}`).then(r => r.json()).then(res => {
      if (res.success) setDesigner(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  // Compute badges from designer data
  useEffect(() => {
    if (!designer) return;
    const b = [];
    if (designer.verificationLevel !== "UNVERIFIED") b.push({ name: "Verified Designer", color: "bg-emerald-50 text-emerald-700 border-emerald-200" });
    if (designer.avgRating >= 4.5 && designer.totalReviews >= 10) b.push({ name: "Top Rated", color: "bg-amber-50 text-amber-700 border-amber-200" });
    if (designer.completionRate >= 0.9) b.push({ name: "Repeat Champion", color: "bg-purple-50 text-purple-700 border-purple-200" });
    setBadges(b);
  }, [designer]);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;
  if (!designer) return <div className="text-center py-16"><h2 className="text-xl font-bold">Designer not found</h2></div>;

  const user = designer.user || {};
  const portfolio = designer.portfolio || [];
  const packages = designer.servicePackages || [];
  const reviews = designer.reviews || [];
  const tabs = [{ id: "portfolio", label: "Portfolio", count: portfolio.length }, { id: "services", label: "Services", count: packages.length }, { id: "reviews", label: "Reviews", count: reviews.length }];

  const consultationTypes = [
    { type: "Quick Call", duration: "15–30 mins", price: Math.round((designer.hourlyRate || 15000) * 0.5), desc: "Initial discussion and idea validation" },
    { type: "Standard Consultation", duration: "1 hour", price: designer.hourlyRate || 15000, desc: "Design direction and budget planning" },
    { type: "Premium (Site Visit)", duration: "2–3 hours", price: (designer.hourlyRate || 15000) * 3, desc: "Physical inspection and measurements" },
  ];

  async function requestProposal() {
    if (!session) { router.push("/login"); return; }
    setProposalSubmitting(true);
    // Create a project request directed at this designer
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      title: `Proposal Request — ${user.firstName} ${user.lastName}`,
      description: proposalMsg || `Client requested a proposal from ${user.firstName} ${user.lastName}.`,
      roomType: "General", style: "Modern", budgetMin: 500000, budgetMax: 10000000, location: "",
    }) });
    const json = await res.json();
    setProposalSubmitting(false);
    if (json.success) {
      // Notify the designer
      await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, type: "proposal_request", title: "New Proposal Request", message: `A client wants a proposal from you`, link: "/find-projects" }) }).catch(() => {});
      setShowProposal(false);
      alert("Proposal request sent! The designer will be notified.");
      router.push(`/projects/${json.data.id}`);
    }
  }

  async function bookConsultation(consultationType: any) {
    if (!session) { router.push("/login"); return; }
    const res = await fetch("/api/consultations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ designerId: designer.id, type: consultationType.type, notes: "" }) });
    const json = await res.json();
    if (json.success && json.data?.authorizationUrl) window.location.href = json.data.authorizationUrl;
    else alert(json.error || "Booking failed. Please try again.");
  }

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-terracotta-50 via-earth-50 to-background border-b">
        <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
          <Link href="/designers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4" /> All Designers</Link>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="h-24 w-24 rounded-full bg-earth-200 flex items-center justify-center text-2xl font-bold text-earth-600 shrink-0">{user.firstName?.[0]}{user.lastName?.[0]}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1>
                {user.isVerified && <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" />Verified</Badge>}
              </div>
              {badges.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{badges.map(b => <Badge key={b.name} className={cn("text-[10px] border", b.color)}>{b.name}</Badge>)}</div>}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {user.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.location}</span>}
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{designer.yearsExperience || 0} years</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{designer.responseTime || "Responds quickly"}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {designer.totalReviews > 0 ? <><div className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span className="font-bold">{designer.avgRating}</span></div><span className="text-sm text-muted-foreground">({designer.totalReviews} reviews)</span></> : <span className="text-sm text-muted-foreground">No reviews yet</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">{(designer.specialties || []).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div>
            </div>
            <div className="flex flex-col gap-2 lg:items-end shrink-0">
              <p className="text-2xl font-bold">{formatCurrency(designer.hourlyRate || 0, designer.currency)}<span className="text-sm text-muted-foreground font-normal">/hr</span></p>
              <Button variant="terracotta" size="lg" className="gap-2 w-full lg:w-auto" onClick={() => setShowConsultation(!showConsultation)}><Calendar className="h-4 w-4" />Book Consultation</Button>
              <Button variant="outline" size="lg" className="gap-2 w-full lg:w-auto" onClick={() => setShowProposal(!showProposal)}><FileText className="h-4 w-4" />Request Proposal</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        {/* Consultation Booking */}
        {showConsultation && (
          <Card className="mt-6 border-terracotta-200"><CardHeader><CardTitle>Book a Consultation</CardTitle><p className="text-sm text-muted-foreground">Pay via Paystack to book a session with {user.firstName}</p></CardHeader><CardContent>
            <div className="grid sm:grid-cols-3 gap-4">{consultationTypes.map(ct => (
              <Card key={ct.type} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => bookConsultation(ct)}>
                <CardContent className="p-4 text-center">
                  <h4 className="font-semibold">{ct.type}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{ct.duration}</p>
                  <p className="text-lg font-bold mt-2">{formatCurrency(ct.price)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{ct.desc}</p>
                  <Button variant="terracotta" size="sm" className="mt-3 w-full">Book Now</Button>
                </CardContent>
              </Card>
            ))}</div>
          </CardContent></Card>
        )}

        {/* Request Proposal */}
        {showProposal && (
          <Card className="mt-6 border-terracotta-200"><CardHeader><CardTitle>Request Proposal</CardTitle><p className="text-sm text-muted-foreground">Describe your project and {user.firstName} will send you a proposal</p></CardHeader><CardContent className="space-y-4">
            <textarea value={proposalMsg} onChange={e => setProposalMsg(e.target.value)} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe your project requirements, budget, timeline, and any preferences..." />
            <div className="flex gap-2"><Button variant="terracotta" onClick={requestProposal} disabled={proposalSubmitting} className="gap-2">{proposalSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}Send Request</Button><Button variant="outline" onClick={() => setShowProposal(false)}>Cancel</Button></div>
          </CardContent></Card>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b mt-6">{tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors", tab === t.id ? "border-terracotta-500 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t.label} ({t.count})</button>)}</div>

        <div className="py-8">
          {tab === "portfolio" && (portfolio.length === 0 ? <p className="text-center text-muted-foreground py-12">No portfolio items yet</p> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{portfolio.map((item: any) => (
            <Card key={item.id} className="overflow-hidden group">
              <div className="relative aspect-[4/3] bg-gradient-to-br from-terracotta-100 to-earth-200">{item.images?.[0] ? <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">✦</div>}</div>
              <CardContent className="p-4"><h3 className="font-semibold text-sm">{item.title}</h3><p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p><div className="flex gap-1.5 mt-2"><Badge variant="secondary" className="text-[10px]">{item.category}</Badge></div></CardContent>
            </Card>
          ))}</div>)}

          {tab === "services" && (packages.length === 0 ? <p className="text-center text-muted-foreground py-12">No packages listed</p> : <div className="grid md:grid-cols-3 gap-6">{packages.map((pkg: any) => (
            <Card key={pkg.id}><CardContent className="p-5"><h3 className="font-semibold">{pkg.title}</h3><p className="text-sm text-muted-foreground mt-2">{pkg.description}</p><Separator className="my-4" /><div className="flex items-center justify-between"><div><span className="text-2xl font-bold">{formatCurrency(pkg.price)}</span><p className="text-xs text-muted-foreground">{pkg.deliveryDays} days</p></div><Button variant="terracotta" size="sm" onClick={() => setShowProposal(true)}>Select</Button></div></CardContent></Card>
          ))}</div>)}

          {tab === "reviews" && (reviews.length === 0 ? <p className="text-center text-muted-foreground py-12">No reviews yet</p> : <div className="space-y-4">{reviews.map((r: any) => (
            <Card key={r.id}><CardContent className="p-5"><div className="flex items-start gap-3"><Avatar fallback={`${r.author?.firstName?.[0] || ""}${r.author?.lastName?.[0] || ""}`} size="md" /><div className="flex-1"><div className="flex items-center justify-between"><p className="font-semibold text-sm">{r.author?.firstName} {r.author?.lastName}</p><div className="flex gap-0.5">{Array.from({length: 5}).map((_, i) => <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />)}</div></div><p className="text-sm text-muted-foreground mt-2">{r.comment}</p></div></div></CardContent></Card>
          ))}</div>)}
        </div>
      </div>
    </div>
  );
}

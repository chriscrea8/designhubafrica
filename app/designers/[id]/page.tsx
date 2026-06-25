"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Clock, Star, Shield, Heart, Calendar, FileText,
  Loader2, X, CheckCircle2, DollarSign
} from "lucide-react";
import { Card, CardContent, Button, Badge, Avatar } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function DesignerProfileContent() {
  const params  = useParams();
  const router  = useRouter();
  const { data: session } = useSession();
  const id = params?.id as string;
  const [designer,          setDesigner]          = useState<any>(null);
  const [loading,           setLoading]            = useState(true);
  const [tab,               setTab]                = useState("portfolio");
  const [isSaved,           setIsSaved]            = useState(false);
  const [portfolioItem,     setPortfolioItem]      = useState<any>(null);
  const [showConsultation,  setShowConsultation]   = useState(false);
  const [showProposal,      setShowProposal]       = useState(false);
  const [selectedType,      setSelectedType]       = useState("VIDEO");
  const [selectedDay,       setSelectedDay]        = useState<number|null>(null);
  const [selectedTime,      setSelectedTime]       = useState("");
  const [bookingLoading,    setBookingLoading]     = useState(false);
  const [proposalMsg,       setProposalMsg]        = useState("");
  const [proposalBudget,    setProposalBudget]     = useState("");
  const [slots,             setSlots]              = useState<any[]>([]);
  const [consultationPrice, setConsultationPrice] = useState(0);
  const [packages,          setPackages]           = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/designers/${id}`).then(r=>r.json()).then(res => {
      if (res.success) { setDesigner(res.data); setIsSaved(res.data.isSaved || false); }
      else router.push("/designers");
      setLoading(false);
    }).catch(() => setLoading(false));

    fetch(`/api/consultation-packages?designerId=${id}`).then(r=>r.json()).then(res => {
      if (res.success && res.data?.length > 0) {
        setPackages(res.data);
        setConsultationPrice(res.data[0].price);
      }
    }).catch(()=>{});
  }, [id]);

  async function toggleSave() {
    await fetch(`/api/designers/${id}/save`, { method:"POST" });
    setIsSaved(prev => !prev);
  }

  async function bookConsultation() {
    if (!packages[0]) return;
    setBookingLoading(true);
    const res = await fetch("/api/consultation-bookings", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ packageId: packages[0].id }) });
    const json = await res.json();
    setBookingLoading(false);
    if (json.success) window.location.href = json.data.authorizationUrl;
  }

  async function sendProposal() {
    if (!proposalMsg.trim()) return;
    setBookingLoading(true);
    await fetch(`/api/designers/${id}/inquire`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ message: proposalMsg, budget: proposalBudget }) });
    setBookingLoading(false);
    setShowProposal(false);
    alert("Request sent! The designer will respond soon.");
  }

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;
  if (!designer) return null;

  const portfolio = designer.portfolio || [];
  const reviews   = designer.reviews   || [];
  const services  = designer.services  || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Back */}
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-20">
        <div className="container mx-auto px-4 lg:px-8 h-14 flex items-center gap-3">
          <Link href="/designers" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/>All Designers</Link>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-5xl py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Avatar src={designer.user?.image} fallback={`${designer.user?.firstName?.[0]}${designer.user?.lastName?.[0]}`} size="xl" className="shrink-0"/>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold">{designer.user?.firstName} {designer.user?.lastName}</h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-muted-foreground">
                  {designer.user?.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5"/>{designer.user.location}</span>}
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5"/>{designer.experienceYears || 0} yrs exp</span>
                  {designer.avgRating > 0 && <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400"/>{designer.avgRating} ({designer.totalReviews})</span>}
                  {designer.approvalStatus === "APPROVED" && <Badge className="bg-emerald-50 text-emerald-700 text-[10px] gap-1"><Shield className="h-3 w-3"/>Verified</Badge>}
                </div>
                {designer.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{designer.bio}</p>}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b overflow-x-auto">
              {[{id:"portfolio",label:`Portfolio (${portfolio.length})`},{id:"services",label:`Services (${services.length})`},{id:"reviews",label:`Reviews (${reviews.length})`}].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap", tab===t.id?"border-terracotta-500 text-foreground":"border-transparent text-muted-foreground")}>{t.label}</button>
              ))}
            </div>

            {/* Portfolio tab */}
            {tab === "portfolio" && (
              portfolio.length === 0 ? <p className="text-center text-muted-foreground py-12">No portfolio items yet</p> :
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolio.map((item: any) => (
                  <Card key={item.id} className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all" onClick={() => setPortfolioItem(item)}>
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                      {item.images?.[0] ? <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"/> : <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">✦</div>}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full transition-all">View Project</span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm">{item.title}</h3>
                      {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {item.category && <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>}
                        {item.style    && <Badge variant="secondary" className="text-[10px]">{item.style}</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Services tab */}
            {tab === "services" && (
              services.length === 0 ? <p className="text-center text-muted-foreground py-12">No services listed</p> :
              <div className="grid sm:grid-cols-2 gap-4">
                {services.map((s: any) => (
                  <Card key={s.id}><CardContent className="p-4">
                    <h3 className="font-semibold text-sm">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                    {s.price > 0 && <p className="font-bold mt-2">{formatCurrency(s.price)}</p>}
                  </CardContent></Card>
                ))}
              </div>
            )}

            {/* Reviews tab */}
            {tab === "reviews" && (
              reviews.length === 0 ? <p className="text-center text-muted-foreground py-12">No reviews yet</p> :
              <div className="space-y-4">
                {reviews.map((r: any) => (
                  <Card key={r.id}><CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-terracotta-100 flex items-center justify-center font-bold text-terracotta-600 shrink-0">{r.author?.firstName?.[0]||r.client?.firstName?.[0]}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="font-semibold text-sm">{r.author?.firstName||r.client?.firstName} {r.author?.lastName||r.client?.lastName}</p>
                            <div className="flex gap-0.5 mt-0.5">{Array.from({length:5}).map((_,i)=><Star key={i} className={cn("h-3.5 w-3.5", i<r.rating?"fill-amber-400 text-amber-400":"text-gray-200")}/>)}</div>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{r.comment}</p>
                      </div>
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            )}
          </div>

          {/* Right: CTAs */}
          <div className="space-y-4">
            <Card className="border-terracotta-200">
              <CardContent className="p-5 space-y-3">
                {designer.hourlyRate > 0 && <div className="text-center"><span className="text-2xl font-black">{formatCurrency(designer.hourlyRate)}</span><span className="text-muted-foreground text-sm">/hr</span></div>}
                <Button variant="terracotta" className="w-full gap-2" onClick={() => { setShowConsultation(true); setShowProposal(false); }}>
                  <Calendar className="h-4 w-4"/>Book Consultation
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={() => { setShowProposal(true); setShowConsultation(false); }}>
                  <FileText className="h-4 w-4"/>Request Proposal
                </Button>
                <button onClick={toggleSave} className={cn("w-full flex items-center justify-center gap-2 h-10 rounded-lg border text-sm font-medium transition-colors", isSaved?"bg-red-50 border-red-200 text-red-500":"border-border text-muted-foreground hover:bg-accent")}>
                  <Heart className={cn("h-4 w-4", isSaved && "fill-current")}/>{isSaved ? "Saved" : "Save Designer"}
                </button>
              </CardContent>
            </Card>

            {/* Consultation panel */}
            {showConsultation && (
              <Card className="border-terracotta-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Book Consultation</h3><button onClick={()=>setShowConsultation(false)}><X className="h-4 w-4 text-muted-foreground"/></button></div>
                  {packages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No consultation packages available</p>
                  ) : (
                    <div className="space-y-2">
                      {packages.map((pkg: any) => (
                        <button key={pkg.id} onClick={() => setConsultationPrice(pkg.price)} className={cn("w-full text-left p-3 rounded-lg border transition-all", consultationPrice===pkg.price?"border-terracotta-400 bg-terracotta-50/20":"border-border hover:border-terracotta-300")}>
                          <p className="font-medium text-sm">{pkg.title}</p>
                          <p className="text-xs text-muted-foreground">{pkg.duration} min · {formatCurrency(pkg.price)}</p>
                        </button>
                      ))}
                      <Button variant="terracotta" className="w-full gap-2 mt-2" onClick={bookConsultation} disabled={bookingLoading}>
                        {bookingLoading&&<Loader2 className="h-4 w-4 animate-spin"/>}Pay {formatCurrency(consultationPrice)}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Proposal panel */}
            {showProposal && (
              <Card className="border-terracotta-200">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Request Proposal</h3><button onClick={()=>setShowProposal(false)}><X className="h-4 w-4 text-muted-foreground"/></button></div>
                  <div className="space-y-3">
                    <textarea value={proposalMsg} onChange={e=>setProposalMsg(e.target.value)} rows={4} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe your project…"/>
                    <input value={proposalBudget} onChange={e=>setProposalBudget(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" placeholder="Budget (optional)"/>
                    <Button variant="terracotta" className="w-full" onClick={sendProposal} disabled={bookingLoading||!proposalMsg.trim()}>Send Request</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio item modal */}
      {portfolioItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPortfolioItem(null)}>
          <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            {portfolioItem.images?.length > 0 && (
              <div className="rounded-t-2xl overflow-hidden">
                <img src={portfolioItem.images[0]} alt={portfolioItem.title} className="w-full aspect-video object-cover"/>
                {portfolioItem.images.length > 1 && (
                  <div className="grid grid-cols-3 gap-0.5 mt-0.5">
                    {portfolioItem.images.slice(1,4).map((img: string, i: number) => (
                      <img key={i} src={img} alt="" className="aspect-square object-cover w-full"/>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-xl font-bold">{portfolioItem.title}</h2>
                <button onClick={() => setPortfolioItem(null)} className="h-8 w-8 rounded-full border flex items-center justify-center hover:bg-accent shrink-0"><X className="h-4 w-4"/></button>
              </div>
              {portfolioItem.description && <p className="text-muted-foreground leading-relaxed">{portfolioItem.description}</p>}
              <div className="flex gap-2 mt-3 flex-wrap">
                {portfolioItem.category && <Badge variant="secondary">{portfolioItem.category}</Badge>}
                {portfolioItem.style    && <Badge variant="secondary">{portfolioItem.style}</Badge>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DesignerProfilePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}>
      <DesignerProfileContent/>
    </Suspense>
  );
}

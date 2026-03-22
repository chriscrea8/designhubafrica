"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, Clock, CheckCircle2, MessageSquare, Calendar, Globe, Award, Shield, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Progress, Separator } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export default function DesignerProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const [designer, setDesigner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("portfolio");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/designers/${id}`).then(r => r.json()).then(res => {
      if (res.success) setDesigner(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;
  if (!designer) return <div className="text-center py-16"><h2 className="text-xl font-bold">Designer not found</h2><Link href="/designers" className="text-sm text-terracotta-500 mt-2 inline-block">Browse designers</Link></div>;

  const user = designer.user || {};
  const portfolio = designer.portfolio || [];
  const packages = designer.servicePackages || [];
  const reviews = designer.reviews || [];
  const tabs = [{ id: "portfolio", label: "Portfolio", count: designer._count?.portfolio || 0 }, { id: "services", label: "Services", count: packages.length }, { id: "reviews", label: "Reviews", count: designer._count?.reviews || 0 }];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-terracotta-50 via-earth-50 to-background border-b">
        <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
          <Link href="/designers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4" /> All Designers</Link>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <Avatar fallback={`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`} size="xl" className="h-24 w-24 text-2xl" />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1>
                {user.isVerified && <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" />Verified</Badge>}
                {designer.verificationLevel === "PREMIUM" && <Badge className="bg-amber-100 text-amber-700 gap-1"><Award className="h-3 w-3" />Premium</Badge>}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {user.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.location}</span>}
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{designer.yearsExperience} years</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{designer.responseTime || "Responds quickly"}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span className="font-bold">{designer.avgRating}</span></div>
                <span className="text-sm text-muted-foreground">({designer.totalReviews} reviews)</span>
                <span className="text-sm text-muted-foreground">• {designer._count?.designerProjects || 0} projects completed</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">{(designer.specialties || []).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div>
            </div>
            <div className="flex flex-col gap-2 lg:items-end shrink-0">
              <p className="text-2xl font-bold">{formatCurrency(designer.hourlyRate, designer.currency)}<span className="text-sm text-muted-foreground font-normal">/hr</span></p>
              <Button variant="terracotta" size="lg" className="gap-2 w-full lg:w-auto"><Calendar className="h-4 w-4" />Book Consultation</Button>
              <Button variant="outline" size="lg" className="gap-2 w-full lg:w-auto"><MessageSquare className="h-4 w-4" />Send Message</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex gap-1 border-b mt-2">{tabs.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn("flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors", activeTab === t.id ? "border-terracotta-500 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t.label} <Badge variant="secondary" className="text-[10px]">{t.count}</Badge></button>)}</div>

        <div className="py-8">
          {/* Portfolio Tab */}
          {activeTab === "portfolio" && (
            <div>{portfolio.length === 0 ? <p className="text-center text-muted-foreground py-12">No portfolio items yet</p> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{portfolio.map((item: any) => (
              <Card key={item.id} className="overflow-hidden group cursor-pointer">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-terracotta-100 to-earth-200"><div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">✦</div>{item.isFeatured && <Badge className="absolute top-2 left-2 text-[10px] bg-amber-500 text-white">Featured</Badge>}</div>
                <CardContent className="p-4"><h3 className="font-semibold text-sm">{item.title}</h3><p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p><div className="flex gap-1.5 mt-2"><Badge variant="secondary" className="text-[10px]">{item.category}</Badge><Badge variant="secondary" className="text-[10px]">{item.style}</Badge></div></CardContent>
              </Card>
            ))}</div>}</div>
          )}

          {/* Services Tab */}
          {activeTab === "services" && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{packages.length === 0 ? <p className="text-center text-muted-foreground py-12 col-span-full">No service packages listed</p> : packages.map((pkg: any) => (
              <Card key={pkg.id}><CardContent className="p-5">
                <h3 className="font-semibold">{pkg.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{pkg.description}</p>
                <Separator className="my-4" />
                <div className="flex items-center justify-between"><div><span className="text-2xl font-bold">{formatCurrency(pkg.price)}</span><p className="text-xs text-muted-foreground">{pkg.deliveryDays} day delivery</p></div><Button variant="terracotta" size="sm">Select</Button></div>
              </CardContent></Card>
            ))}</div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="space-y-4">{reviews.length === 0 ? <p className="text-center text-muted-foreground py-12">No reviews yet</p> : reviews.map((r: any) => (
              <Card key={r.id}><CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar fallback={`${r.author?.firstName?.[0] || ""}${r.author?.lastName?.[0] || ""}`} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between"><p className="font-semibold text-sm">{r.author?.firstName} {r.author?.lastName}</p><div className="flex items-center gap-1">{Array.from({length: 5}).map((_, i) => <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />)}</div></div>
                    <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>
                    {(r.qualityRating || r.communicationRating) && <div className="flex gap-4 mt-3 text-xs text-muted-foreground">{r.qualityRating && <span>Quality: {r.qualityRating}/5</span>}{r.communicationRating && <span>Communication: {r.communicationRating}/5</span>}{r.timelinessRating && <span>Timeliness: {r.timelinessRating}/5</span>}</div>}
                  </div>
                </div>
              </CardContent></Card>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  );
}

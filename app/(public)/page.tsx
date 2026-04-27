"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Shield, Star, Zap } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { DesignerCard } from "@/components/cards";
import { formatCurrency } from "@/lib/utils";

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);

  useEffect(() => {
    // Try paid featured first, fall back to top-rated from DB
    fetch("/api/featured").then(r => r.json()).then(res => {
      if (res.success && res.data?.length > 0) { setFeatured(res.data); return; }
      // Fallback: load top-rated approved designers
      fetch("/api/designers?limit=4").then(r => r.json()).then(d => { if (d.success) setFeatured(d.data?.items || []); });
    }).catch(() => {
      fetch("/api/designers?limit=4").then(r => r.json()).then(d => { if (d.success) setFeatured(d.data?.items || []); });
    });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-earth-900 via-earth-800 to-terracotta-900 text-white">
        <div className="container mx-auto px-4 lg:px-8 py-24 lg:py-32 relative z-10">
          <Badge className="mb-6 bg-white/10 text-white border-white/20">Africa's #1 Interior Design Platform</Badge>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight max-w-3xl">Find Verified Interior Designers in Africa</h1>
          <p className="mt-6 text-lg text-white/80 max-w-xl">Connect with top designers, manage projects, and pay securely through escrow. No scams, no guesswork.</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button size="lg" variant="terracotta" asChild className="gap-2"><Link href="/register?role=CLIENT"><Search className="h-5 w-5" />Start a Project</Link></Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 text-white hover:bg-white/10 gap-2"><Link href="/designers">Browse Designers<ArrowRight className="h-5 w-5" /></Link></Button>
          </div>
          <div className="flex items-center gap-6 mt-10 text-sm text-white/60">
            <span className="flex items-center gap-1.5"><Shield className="h-4 w-4" />Verified designers</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4" />Escrow payments</span>
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4" />Anti-bypass protection</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b"><div className="container mx-auto px-4 lg:px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[{ label: "Designers", value: "500+", sub: "Verified professionals" }, { label: "Projects", value: "2,400+", sub: "Completed successfully" }, { label: "Cities", value: "12+", sub: "Across Africa" }, { label: "Protected", value: "₦2B+", sub: "In escrow payments" }].map(s => <div key={s.label} className="text-center"><p className="text-3xl font-bold text-terracotta-500">{s.value}</p><p className="font-medium mt-1">{s.label}</p><p className="text-sm text-muted-foreground">{s.sub}</p></div>)}
      </div></section>

      {/* Featured Designers */}
      <section className="py-16 lg:py-24"><div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-8"><div><h2 className="text-3xl font-bold">Featured Designers</h2><p className="text-muted-foreground mt-1">Top-rated professionals across Africa</p></div><Button variant="outline" asChild className="gap-2"><Link href="/designers">View all<ArrowRight className="h-4 w-4" /></Link></Button></div>
        {featured.length > 0 ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{featured.map(d => <DesignerCard key={d.id} designer={d} />)}</div> : <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />)}</div>}
      </div></section>

      {/* How it works */}
      <section className="py-16 bg-muted/30"><div className="container mx-auto px-4 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">{[{ step: "01", title: "Post Your Project", desc: "Describe your space and budget. Verified designers submit proposals." }, { step: "02", title: "Choose & Pay Safely", desc: "Compare proposals, accept one, and fund milestones via secure escrow." }, { step: "03", title: "Approve & Complete", desc: "Review work at each milestone. Release funds when you're satisfied." }].map(s => <div key={s.step} className="text-center"><div className="text-5xl font-bold text-terracotta-100 mb-3">{s.step}</div><h3 className="text-lg font-semibold mb-2">{s.title}</h3><p className="text-muted-foreground">{s.desc}</p></div>)}</div>
      </div></section>

      {/* CTA */}
      <section className="py-20 bg-terracotta-500 text-white text-center"><div className="container mx-auto px-4 lg:px-8 max-w-2xl">
        <h2 className="text-3xl lg:text-4xl font-bold">Are you a designer?</h2>
        <p className="mt-4 text-white/80">Get verified, build your portfolio, and grow your business on Africa's leading interior design marketplace.</p>
        <Button size="lg" variant="outline" asChild className="mt-8 border-white text-white hover:bg-white hover:text-terracotta-500"><Link href="/register?role=DESIGNER">Join as a Designer</Link></Button>
      </div></section>
    </div>
  );
}

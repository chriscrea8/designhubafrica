"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Search, Star, Users, ShoppingBag, Palette, Sparkles, Globe, Shield, Quote } from "lucide-react";
import { Button, Badge, Avatar, Card, CardContent } from "@/components/ui";
import { DesignerCard, ProductCard } from "@/components/cards";
import { mockDesigners, mockProducts } from "@/data/mock-data";

export default function LandingPage() {
  return <div className="overflow-hidden">
    <section className="relative"><div className="absolute inset-0 bg-gradient-to-br from-terracotta-50/60 via-background to-earth-50/40" /><div className="relative container mx-auto px-4 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-32"><div className="max-w-4xl mx-auto text-center">
      <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-xs"><Sparkles className="h-3 w-3 mr-1.5" />Africa&apos;s Premier Interior Design Platform</Badge>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]">Transform Your Space <span className="text-terracotta-500">with Africa&apos;s</span> Best Designers</h1>
      <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">Connect with vetted interior designers, explore curated furniture, and bring your dream spaces to life.</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
        <Button variant="terracotta" size="xl" asChild className="gap-2 w-full sm:w-auto"><Link href="/register">Start Your Project<ArrowRight className="h-4 w-4" /></Link></Button>
        <Button variant="outline" size="xl" asChild className="gap-2 w-full sm:w-auto"><Link href="/designers"><Search className="h-4 w-4" />Browse Designers</Link></Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
        {[{ icon: Users, label: "500+ Designers" }, { icon: Star, label: "4.8 Avg Rating" }, { icon: Globe, label: "15 Countries" }, { icon: Shield, label: "Escrow Protected" }].map((i) => <div key={i.label} className="flex items-center gap-1.5"><i.icon className="h-4 w-4 text-terracotta-400" /><span>{i.label}</span></div>)}
      </div>
    </div></div></section>

    <section className="py-20 border-t"><div className="container mx-auto px-4 lg:px-8"><div className="text-center max-w-2xl mx-auto mb-14"><h2 className="text-3xl lg:text-4xl font-bold">Featured Designers</h2></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{mockDesigners.map((d) => <DesignerCard key={d.id} designer={d} />)}</div></div></section>

    <section className="py-20 bg-muted/30 border-t"><div className="container mx-auto px-4 lg:px-8"><div className="text-center max-w-2xl mx-auto mb-14"><h2 className="text-3xl lg:text-4xl font-bold">Shop the Marketplace</h2></div><div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">{mockProducts.map((p) => <ProductCard key={p.id} product={p} />)}</div></div></section>

    <section className="py-20 bg-earth-900 text-white"><div className="container mx-auto px-4 lg:px-8 text-center"><h2 className="text-3xl lg:text-4xl font-bold mb-8">How It Works</h2><div className="grid sm:grid-cols-4 gap-8">{[{ step: "01", title: "Post Your Project" }, { step: "02", title: "Match with Designers" }, { step: "03", title: "Collaborate & Design" }, { step: "04", title: "Transform Your Space" }].map((i) => <div key={i.step}><span className="text-5xl font-bold text-terracotta-500/30">{i.step}</span><h3 className="font-semibold text-lg mt-2">{i.title}</h3></div>)}</div></div></section>

    <section className="py-20 bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white"><div className="container mx-auto px-4 lg:px-8 text-center"><h2 className="text-3xl lg:text-4xl font-bold max-w-xl mx-auto">Ready to Transform Your Space?</h2><div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"><Button size="xl" className="bg-white text-terracotta-600 hover:bg-white/90 gap-2" asChild><Link href="/register">Get Started Free<ArrowRight className="h-4 w-4" /></Link></Button></div></div></section>
  </div>;
}

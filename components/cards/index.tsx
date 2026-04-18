"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, MapPin, Clock, Heart, ShoppingCart, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, Button, Badge, Avatar, Progress } from "@/components/ui";
import { cn, formatCurrency, getStatusColor } from "@/lib/utils";

export function DesignerCard({ designer }: { designer: any }) {
  const profileUrl = `/designers/${designer.id}`;
  const user = designer.user || {};
  return <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}><Link href={profileUrl}><Card className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
    <div className="relative h-40 bg-gradient-to-br from-earth-100 to-earth-200"><Badge variant="success" className="absolute top-3 left-3 text-[10px]">Available</Badge></div>
    <CardContent className="p-4">
      <div className="flex items-start gap-3"><Avatar fallback={`${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`} size="md" /><div className="flex-1 min-w-0"><h3 className="font-semibold text-sm">{user.firstName} {user.lastName}</h3><div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /><span>{user.location || "Africa"}</span></div></div><div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /><span className="text-sm font-semibold">{designer.avgRating || 0}</span></div></div>
      <div className="flex flex-wrap gap-1 mt-3">{(designer.specialties || []).slice(0, 3).map((s: string) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}</div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{designer.responseTime || "Within 24h"}</span><span className="font-medium text-foreground">{formatCurrency(designer.hourlyRate || 0, designer.currency || "NGN")}/hr</span></div>
    </CardContent>
  </Card></Link></motion.div>;
}

export function ProjectCard({ project }: { project: any }) {
  return <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}><Link href={`/projects/${project.id}`}><Card className="overflow-hidden group cursor-pointer">
    <div className="relative h-36 bg-gradient-to-br from-terracotta-50 to-earth-100"><Badge className={cn("absolute top-3 left-3 text-[10px] capitalize", getStatusColor(project.status?.toLowerCase() || "draft"))}>{(project.status || "draft").replace("_", " ")}</Badge></div>
    <CardContent className="p-4">
      <h3 className="font-semibold text-sm group-hover:text-terracotta-500 transition-colors line-clamp-1">{project.title}</h3>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
      <div className="mt-3 space-y-2"><div className="flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span className="font-medium">{project.progress || 0}%</span></div><Progress value={project.progress || 0} /></div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t"><span className="text-xs text-muted-foreground">{formatCurrency(project.budgetMin || 0, project.currency || "NGN")} – {formatCurrency(project.budgetMax || 0, project.currency || "NGN")}</span><Badge variant="secondary" className="text-[10px]">{project.roomType}</Badge></div>
    </CardContent>
  </Card></Link></motion.div>;
}

export function ProductCard({ product }: { product: any }) {
  return <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}><Card className="overflow-hidden group">
    <div className="relative aspect-square bg-gradient-to-br from-earth-50 to-earth-100"><div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">🪑</div></div>
    <CardContent className="p-4">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{product.category}</p>
      <h3 className="font-semibold text-sm mt-1 line-clamp-1 group-hover:text-terracotta-500 transition-colors">{product.name}</h3>
      <div className="flex items-center justify-between mt-3 pt-3 border-t"><span className="font-bold text-base">{formatCurrency(product.price || 0, product.currency || "NGN")}</span></div>
    </CardContent>
  </Card></motion.div>;
}

export function StatsCard({ title, value, change, changeLabel, icon }: { title: string; value: string | number; change?: number; changeLabel?: string; icon: React.ReactNode }) {
  const isPos = change && change > 0;
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">{title}</p><p className="text-2xl font-bold mt-1">{value}</p>{change !== undefined && <div className="flex items-center gap-1 mt-2"><span className={cn("text-xs font-medium", isPos ? "text-emerald-600" : "text-red-600")}>{isPos && "+"}{change}%</span>{changeLabel && <span className="text-[10px] text-muted-foreground">{changeLabel}</span>}</div>}</div><div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div></div></CardContent></Card>;
}

export function InspirationCard({ item }: { item: any }) {
  return <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }} className="group cursor-pointer">
    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-terracotta-100 to-earth-200"><div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">✦</div></div>
    <div className="mt-2.5 px-0.5"><h3 className="font-medium text-sm line-clamp-1">{item.title}</h3><div className="flex items-center gap-2 mt-1"><Badge variant="secondary" className="text-[10px]">{item.category}</Badge><Badge variant="secondary" className="text-[10px]">{item.style}</Badge></div></div>
  </motion.div>;
}

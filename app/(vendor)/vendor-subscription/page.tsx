"use client";
import React, { useEffect, useState } from "react";
import { Check, Zap, Star, Crown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

const PLANS = [
  { key:"FREE",    icon:Zap,   label:"Free",    price:0,     color:"border-border",          features:["5 product listings","Basic store page","Standard search placement"] },
  { key:"PRO",     icon:Star,  label:"Pro",     price:15000, color:"border-terracotta-400",   features:["50 product listings","3 monthly boost credits","Priority placement","Analytics dashboard"] },
  { key:"PREMIUM", icon:Crown, label:"Premium", price:35000, color:"border-amber-400",        features:["Unlimited listings","10 monthly boost credits","Homepage placement","Advanced analytics","Premium badge"] },
];

export default function VendorSubscriptionPage() {
  const [current,  setCurrent]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [upgrading,setUpgrading]= useState<string|null>(null);

  useEffect(() => { fetch("/api/vendor/subscription").then(r=>r.json()).then(res=>{ if(res.success) setCurrent(res.data?.subscription); setLoading(false); }).catch(()=>setLoading(false)); }, []);

  async function upgrade(plan: string) {
    if (plan === current?.plan) return;
    setUpgrading(plan);
    const res = await fetch("/api/vendor/subscription", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({plan}) });
    const json = await res.json();
    setUpgrading(null);
    if (json.success && json.data?.authorizationUrl) window.location.href = json.data.authorizationUrl;
    else if (json.success) window.location.reload();
    else alert(json.error || "Failed");
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold">Subscription Plans</h1><p className="text-sm text-muted-foreground mt-1">Upgrade to reach more buyers</p></div>
      {current && <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border"><div><p className="text-sm text-muted-foreground">Current plan</p><p className="font-semibold">{current.plan} · {current.listingLimit===999?"Unlimited":current.listingLimit} listings · {current.boostCredits} boosts</p></div></div>}
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const Icon = plan.icon; const isActive = current?.plan === plan.key;
          return (
            <Card key={plan.key} className={cn("relative border-2", isActive ? "border-terracotta-500" : plan.color)}>
              {plan.key==="PRO" && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="bg-terracotta-500 text-white text-xs px-3">Popular</Badge></div>}
              <CardHeader className="text-center pb-3">
                <Icon className="h-8 w-8 mx-auto mb-2 text-terracotta-500" />
                <CardTitle>{plan.label}</CardTitle>
                <p className="text-2xl font-bold">{plan.price===0?"Free":formatCurrency(plan.price)}<span className="text-sm font-normal text-muted-foreground">{plan.price>0&&"/mo"}</span></p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">{plan.features.map(f=><li key={f} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0"/>{f}</li>)}</ul>
                <Button variant={isActive?"outline":plan.key==="FREE"?"outline":"terracotta"} className="w-full" disabled={isActive||!!upgrading} onClick={()=>upgrade(plan.key)}>
                  {upgrading===plan.key&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}
                  {isActive?"Current Plan":plan.key==="FREE"?"Downgrade":`Upgrade to ${plan.label}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

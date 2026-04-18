"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Check, Zap, Crown, Star, ArrowRight, ArrowDown, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, Button, Badge, Separator } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";

const plans = [
  { key: "FREE", name: "Free", monthly: 0, yearly: 0, icon: Star, color: "bg-muted text-muted-foreground", features: [{ t: "3 proposals per month", ok: true }, { t: "Basic profile visibility", ok: true }, { t: "Standard support", ok: true }, { t: "Analytics dashboard", ok: false }, { t: "Featured ranking", ok: false }, { t: "Priority matching", ok: false }], popular: false },
  { key: "PRO", name: "Pro", monthly: 15000, yearly: 144000, icon: Zap, color: "bg-terracotta-50 text-terracotta-600", features: [{ t: "Unlimited proposals", ok: true }, { t: "Featured ranking in search", ok: true }, { t: "Analytics dashboard", ok: true }, { t: "Priority support", ok: true }, { t: "Pro badge on profile", ok: true }, { t: "Homepage promotion", ok: false }], popular: true },
  { key: "ELITE", name: "Elite", monthly: 45000, yearly: 432000, icon: Crown, color: "bg-amber-50 text-amber-600", features: [{ t: "Everything in Pro", ok: true }, { t: "Homepage promotion", ok: true }, { t: "Priority matching", ok: true }, { t: "Advanced analytics", ok: true }, { t: "Dedicated account manager", ok: true }, { t: "Elite badge on profile", ok: true }], popular: false },
];
const planOrder = ["FREE", "PRO", "ELITE"];

function SubscriptionContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [currentPlan, setCurrentPlan] = useState("FREE");
  const [loading, setLoading] = useState<string | null>(null);
  const [justUpgraded, setJustUpgraded] = useState(false);

  useEffect(() => {
    fetch("/api/subscriptions").then(r => r.json()).then(res => { if (res.success && res.data?.current) setCurrentPlan(res.data.current.plan); });
    // Check if returning from Paystack
    const plan = searchParams?.get("plan");
    const trxref = searchParams?.get("trxref") || searchParams?.get("reference");
    if (trxref) {
      // Returned from Paystack — verify and show success
      if (plan) setCurrentPlan(plan);
      setJustUpgraded(true);
      setTimeout(() => setJustUpgraded(false), 15000);
      // Also re-fetch current subscription to get latest state
      fetch("/api/subscriptions").then(r => r.json()).then(res => { if (res.success && res.data?.current) setCurrentPlan(res.data.current.plan); });
    }
  }, [searchParams]);

  async function handlePlanChange(planKey: string) {
    const currentIdx = planOrder.indexOf(currentPlan);
    const targetIdx = planOrder.indexOf(planKey);
    if (planKey === currentPlan) return;

    // Downgrade
    if (targetIdx < currentIdx) {
      if (!confirm(`Downgrade to ${planKey}? You'll lose premium features at the end of your billing period.`)) return;
      setLoading(planKey);
      await fetch("/api/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: planKey, billingCycle: billing.toUpperCase() }) });
      setCurrentPlan(planKey); setLoading(null); return;
    }

    // Upgrade — go to Paystack
    const plan = plans.find(p => p.key === planKey);
    if (!plan) return;
    setLoading(planKey);
    const price = billing === "monthly" ? plan.monthly : plan.yearly;
    const res = await fetch("/api/payments/initialize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: price, email: session?.user?.email, callbackUrl: `${window.location.origin}/subscription?plan=${planKey}&billing=${billing}` }) });
    const json = await res.json();
    setLoading(null);
    if (json.success && json.data?.authorizationUrl) {
      await fetch("/api/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: planKey, billingCycle: billing.toUpperCase() }) });
      window.location.href = json.data.authorizationUrl;
    } else alert("Payment failed. Please try again.");
  }

  const currentIdx = planOrder.indexOf(currentPlan);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Subscription Plans</h1><p className="text-sm text-muted-foreground mt-1">Manage your subscription</p></div>
      {justUpgraded && <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><div><p className="font-semibold text-emerald-800">Plan Upgraded Successfully!</p><p className="text-sm text-emerald-700">You are now on the {currentPlan} plan. Enjoy your new features!</p></div></div>}

      <div className="flex items-center justify-center gap-3">
        <span className={cn("text-sm font-medium", billing === "monthly" ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
        <button onClick={() => setBilling(b => b === "monthly" ? "yearly" : "monthly")} className="relative w-12 h-6 rounded-full bg-muted"><div className={cn("absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-terracotta-500 transition-transform", billing === "yearly" && "translate-x-6")} /></button>
        <span className={cn("text-sm font-medium", billing === "yearly" ? "text-foreground" : "text-muted-foreground")}>Yearly <Badge variant="success" className="ml-1 text-[10px]">Save 20%</Badge></span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">{plans.map((plan, i) => {
        const price = billing === "monthly" ? plan.monthly : plan.yearly;
        const isCurrent = currentPlan === plan.key;
        const isDowngrade = planOrder.indexOf(plan.key) < currentIdx;
        const isUpgrade = planOrder.indexOf(plan.key) > currentIdx;
        return (
          <Card key={plan.key} className={cn("relative overflow-hidden", plan.popular && !isCurrent && "border-terracotta-500 ring-1 ring-terracotta-500", isCurrent && "border-emerald-500 ring-1 ring-emerald-500")}>
            {isCurrent && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">CURRENT PLAN</div>}
            {plan.popular && !isCurrent && <div className="absolute top-0 right-0 bg-terracotta-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>}
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4"><div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", plan.color)}><plan.icon className="h-5 w-5" /></div><div><h3 className="font-semibold">{plan.name}</h3></div></div>
              <div className="mb-6"><span className="text-3xl font-bold">{price === 0 ? "Free" : formatCurrency(price)}</span>{price > 0 && <span className="text-sm text-muted-foreground">/{billing === "monthly" ? "mo" : "yr"}</span>}</div>
              <Separator className="mb-4" />
              <ul className="space-y-3 mb-6">{plan.features.map(f => <li key={f.t} className="flex items-start gap-2.5 text-sm">{f.ok ? <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> : <Lock className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" />}<span className={cn(!f.ok && "text-muted-foreground/50")}>{f.t}</span></li>)}</ul>
              <Button variant={isCurrent ? "outline" : isUpgrade ? "terracotta" : "outline"} className="w-full gap-2" disabled={isCurrent || !!loading} onClick={() => handlePlanChange(plan.key)}>
                {loading === plan.key && <Loader2 className="h-4 w-4 animate-spin" />}
                {isCurrent ? "Current Plan" : isDowngrade ? <><ArrowDown className="h-4 w-4" />Downgrade</> : <><ArrowRight className="h-4 w-4" />Upgrade</>}
              </Button>
            </CardContent>
          </Card>
        );
      })}</div>
      <p className="text-xs text-center text-muted-foreground">Your card will be charged automatically each billing cycle. You can cancel anytime.</p>
    </div>
  );
}

export default function SubscriptionPage() { return <Suspense fallback={<div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}><SubscriptionContent /></Suspense>; }

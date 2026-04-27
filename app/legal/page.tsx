import Link from "next/link";
import { FileText, Shield, RefreshCw, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui";

const pages = [
  { title: "Terms of Service", slug: "terms", icon: FileText, desc: "Platform rules, user responsibilities, and service terms" },
  { title: "Privacy Policy", slug: "privacy", icon: Shield, desc: "How we collect, store, and protect your data" },
  { title: "Refund & Dispute Policy", slug: "refunds", icon: RefreshCw, desc: "Escrow refund conditions and dispute resolution process" },
  { title: "Payment Policy", slug: "payments", icon: CreditCard, desc: "Escrow handling, commissions, and payment processing" },
];

export default function LegalPage() {
  return (
    <div className="container mx-auto px-4 lg:px-8 py-16 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Legal</h1>
      <p className="text-muted-foreground mb-8">DesignHub Africa's policies and terms</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {pages.map(p => (
          <Link key={p.slug} href={`/legal/${p.slug}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-5 flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-terracotta-50 flex items-center justify-center shrink-0"><p.icon className="h-5 w-5 text-terracotta-500" /></div>
                <div><h3 className="font-semibold">{p.title}</h3><p className="text-sm text-muted-foreground mt-1">{p.desc}</p></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

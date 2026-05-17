import React from "react";
import Link from "next/link";
const links = { Platform: [{ label: "Find Designers", href: "/designers" }, { label: "Marketplace", href: "/marketplace" }, { label: "Inspiration", href: "/inspiration" }], Company: [{ label: "About Us", href: "/about" }, { label: "Careers", href: "#" }, { label: "Contact", href: "#" }], Legal: [{ label: "Terms", href: "#" }, { label: "Privacy", href: "#" }] };
export function Footer() {
  return <footer className="border-t bg-earth-50/50"><div className="container mx-auto px-4 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
    <div className="col-span-2 md:col-span-1"><Link href="/" className="flex items-center gap-2.5 mb-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-terracotta-500"><span className="text-white font-bold text-sm">DH</span></div><div className="flex flex-col"><span className="font-bold text-base leading-tight">DesignHub</span><span className="text-[10px] font-medium text-terracotta-500 uppercase tracking-widest">Africa</span></div></Link><p className="text-sm text-muted-foreground">Connecting Africa&apos;s finest interior designers with clients.</p></div>
    {Object.entries(links).map(([title, items]) => <div key={title}><h4 className="font-semibold text-sm mb-3">{title}</h4><ul className="space-y-2.5">{items.map((l) => <li key={l.label}><Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>)}</ul></div>)}
  </div><div className="container mx-auto px-4 border-t py-6"><p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} DesignHub Africa. All rights reserved.</p></div></footer>;
}

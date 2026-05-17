"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/designers", label: "Find Designers" },
  { href: "/inspiration", label: "Inspiration" },
  { href: "/about", label: "About" },
  { href: "/legal", label: "Legal" },
];

function getDashboardPath(role?: string) {
  if (role === "DESIGNER") return "/designer-dashboard";
  if (role === "ADMIN") return "/admin-dashboard";
  return "/dashboard";
}

export function PublicNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, [pathname]);

  return (
    <header className={cn("sticky top-0 z-50 w-full transition-all duration-200", scrolled ? "bg-background/95 backdrop-blur border-b shadow-sm" : "bg-background border-b")}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-terracotta-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">DH</span>
            </div>
            <span className="font-bold text-base hidden sm:block">DesignHub <span className="text-terracotta-500">Africa</span></span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-colors", pathname === link.href ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent text-sm font-medium transition-colors">
                  <div className="h-7 w-7 rounded-full bg-terracotta-100 flex items-center justify-center text-terracotta-600 font-bold text-xs">
                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="max-w-[100px] truncate">{session.user?.name?.split(" ")[0]}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", userMenuOpen && "rotate-180")} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-52 rounded-xl border bg-background shadow-lg py-1 z-50">
                    <Link href={getDashboardPath(session.user?.role as string)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent">
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />Dashboard
                    </Link>
                    <Link href="/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent">
                      <User className="h-4 w-4 text-muted-foreground" />Settings
                    </Link>
                    <div className="border-t my-1" />
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-accent w-full text-left text-red-500">
                      <LogOut className="h-4 w-4" />Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors">Sign In</Link>
                <Link href="/register" className="px-4 py-2 text-sm font-medium rounded-lg bg-terracotta-500 text-white hover:bg-terracotta-600 transition-colors">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Toggle menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className={cn("flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors", pathname === link.href ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
                {link.label}
              </Link>
            ))}
            <div className="border-t pt-3 mt-3 space-y-1">
              {session ? (
                <>
                  <Link href={getDashboardPath(session.user?.role as string)} className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-medium hover:bg-accent">
                    <LayoutDashboard className="h-4 w-4" />Dashboard
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full text-left">
                    <LogOut className="h-4 w-4" />Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex items-center px-3 py-3 rounded-lg text-sm font-medium hover:bg-accent">Sign In</Link>
                  <Link href="/register" className="flex items-center justify-center px-3 py-3 rounded-lg text-sm font-medium bg-terracotta-500 text-white hover:bg-terracotta-600">Get Started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

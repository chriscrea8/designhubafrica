import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@/styles/globals.css";
export const metadata: Metadata = { title: { default: "DesignHub Africa", template: "%s | DesignHub Africa" }, description: "Africa's Premier Interior Design Marketplace" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" /><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" /></head><body className="min-h-screen font-sans antialiased" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}><Providers>{children}</Providers></body></html>;
}

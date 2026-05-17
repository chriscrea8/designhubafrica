import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-terracotta-500/20 mb-4 select-none">404</div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-8 text-sm">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-terracotta-500 text-white text-sm font-medium hover:bg-terracotta-600 transition-colors">
            <Home className="h-4 w-4" />Home
          </Link>
          <Link href="/designers" className="flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-medium hover:bg-accent transition-colors">
            <Search className="h-4 w-4" />Find Designers
          </Link>
        </div>
      </div>
    </div>
  );
}

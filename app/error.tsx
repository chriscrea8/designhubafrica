"use client";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6 text-sm">An unexpected error occurred. Our team has been notified.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-terracotta-500 text-white text-sm font-medium hover:bg-terracotta-600 transition-colors">
            <RefreshCw className="h-4 w-4" />Try Again
          </button>
          <Link href="/" className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors">
            <Home className="h-4 w-4" />Go Home
          </Link>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer">Error details</summary>
            <pre className="mt-2 text-xs bg-muted p-3 rounded-lg overflow-auto">{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

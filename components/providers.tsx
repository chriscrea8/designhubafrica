"use client";
import React from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InactivityGuard } from "@/components/inactivity-guard";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, refetchOnWindowFocus: false } },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <InactivityGuard>{children}</InactivityGuard>
      </QueryClientProvider>
    </SessionProvider>
  );
}

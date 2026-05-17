"use client";
import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function SearchBar({ placeholder = "Search…", value, onChange, onFilterToggle, showFilter = true, className }: { placeholder?: string; value: string; onChange: (v: string) => void; onFilterToggle?: () => void; showFilter?: boolean; className?: string }) {
  return <div className={cn("flex items-center gap-2", className)}>
    <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />{value && <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-4 w-4" /></button>}</div>
    {showFilter && onFilterToggle && <Button variant="outline" onClick={onFilterToggle} className="h-11 gap-2"><SlidersHorizontal className="h-4 w-4" /><span className="hidden sm:inline">Filters</span></Button>}
  </div>;
}

export function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
  return <div className="flex items-center justify-center gap-1 mt-8">
    <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => <Button key={p} variant={p === currentPage ? "default" : "outline"} size="sm" onClick={() => onPageChange(p)} className="h-9 w-9">{p}</Button>)}
    <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
  </div>;
}

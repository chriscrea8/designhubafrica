"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => { const m = window.matchMedia(query); setMatches(m.matches); const l = (e: MediaQueryListEvent) => setMatches(e.matches); m.addEventListener("change", l); return () => m.removeEventListener("change", l); }, [query]);
  return matches;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

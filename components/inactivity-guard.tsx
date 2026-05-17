"use client";
import { useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_BEFORE = 60 * 1000; // Show warning 1 minute before

export function InactivityGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/login?reason=timeout" });
  }, []);

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    warningShownRef.current = false;

    // Only set timers if user is authenticated
    if (status !== "authenticated") return;

    // Warning timer — fires 1 minute before logout
    warningRef.current = setTimeout(() => {
      warningShownRef.current = true;
      // Show native confirm dialog
      const stay = window.confirm(
        "You've been inactive for 9 minutes. Click OK to stay signed in, or Cancel to log out."
      );
      if (stay) {
        resetTimer(); // Reset on confirmation
      } else {
        handleLogout();
      }
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

    // Logout timer
    timerRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        handleLogout();
      }
    }, INACTIVITY_TIMEOUT);
  }, [status, handleLogout]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];

    // Throttle resets to avoid excessive timer creation
    let lastReset = Date.now();
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastReset > 30000) { // Only reset every 30 seconds of activity
        lastReset = now;
        resetTimer();
      }
    };

    events.forEach((event) => window.addEventListener(event, throttledReset));
    resetTimer(); // Start initial timer

    return () => {
      events.forEach((event) => window.removeEventListener(event, throttledReset));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [status, resetTimer]);

  return <>{children}</>;
}

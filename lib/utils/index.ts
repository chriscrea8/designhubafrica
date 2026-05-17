import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "NGN"): string {
  const symbols: Record<string, string> = { NGN: "₦", USD: "$", KES: "KSh", GHS: "GH₵", ZAR: "R", GBP: "£", EUR: "€" };
  return `${symbols[currency] || currency}${amount.toLocaleString()}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700", open: "bg-blue-50 text-blue-700",
    in_progress: "bg-amber-50 text-amber-700", review: "bg-purple-50 text-purple-700",
    completed: "bg-emerald-50 text-emerald-700", cancelled: "bg-red-50 text-red-700",
    pending: "bg-yellow-50 text-yellow-700", confirmed: "bg-blue-50 text-blue-700",
    processing: "bg-indigo-50 text-indigo-700", shipped: "bg-cyan-50 text-cyan-700",
    delivered: "bg-emerald-50 text-emerald-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}

export function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

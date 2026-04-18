"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { headers: { "Content-Type": "application/json", ...options.headers }, ...options });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json.data;
}

export function useDesigners(filters?: Record<string, any>) {
  const p = new URLSearchParams(); if (filters?.page) p.set("page", String(filters.page)); if (filters?.search) p.set("search", filters.search);
  return useQuery({ queryKey: ["designers", filters], queryFn: () => apiFetch<any>(`/api/designers?${p}`) });
}
export function useDesigner(id: string) { return useQuery({ queryKey: ["designers", id], queryFn: () => apiFetch<any>(`/api/designers/${id}`), enabled: !!id }); }
export function useProjects(filters?: Record<string, any>) {
  const p = new URLSearchParams(); if (filters?.page) p.set("page", String(filters.page));
  return useQuery({ queryKey: ["projects", filters], queryFn: () => apiFetch<any>(`/api/projects?${p}`) });
}
export function useProject(id: string) { return useQuery({ queryKey: ["projects", id], queryFn: () => apiFetch<any>(`/api/projects/${id}`), enabled: !!id }); }
export function useCreateProject() { const qc = useQueryClient(); return useMutation({ mutationFn: (d: any) => apiFetch<any>("/api/projects", { method: "POST", body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }) }); }
export function useProducts(filters?: Record<string, any>) {
  const p = new URLSearchParams(); if (filters?.category) p.set("category", filters.category); if (filters?.search) p.set("search", filters.search);
  return useQuery({ queryKey: ["products", filters], queryFn: () => apiFetch<any>(`/api/marketplace/products?${p}`) });
}
export function useOrders() { return useQuery({ queryKey: ["orders"], queryFn: () => apiFetch<any>("/api/marketplace/orders") }); }
export function useConversations() { return useQuery({ queryKey: ["conversations"], queryFn: () => apiFetch<any>("/api/messages/conversations") }); }
export function useMessages(convId: string) { return useQuery({ queryKey: ["messages", convId], queryFn: () => apiFetch<any>(`/api/messages/conversations/${convId}/messages`), enabled: !!convId }); }
export function useSendMessage(convId: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (d: { content: string }) => apiFetch<any>(`/api/messages/conversations/${convId}/messages`, { method: "POST", body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["messages", convId] }) }); }
export function useNotifications() { return useQuery({ queryKey: ["notifications"], queryFn: () => apiFetch<any>("/api/notifications"), refetchInterval: 30000 }); }
export function useSearch(q: string) { return useQuery({ queryKey: ["search", q], queryFn: () => apiFetch<any>(`/api/search?q=${encodeURIComponent(q)}`), enabled: q.length >= 2 }); }
export function useInitializePayment() { return useMutation({ mutationFn: (d: any) => apiFetch<any>("/api/payments/initialize", { method: "POST", body: JSON.stringify(d) }) }); }
export function useUploadFile() { return useMutation({ mutationFn: async ({ file, folder }: { file: File; folder: string }) => { const fd = new FormData(); fd.append("file", file); fd.append("folder", folder); const r = await fetch("/api/upload", { method: "POST", body: fd }); const j = await r.json(); if (!r.ok) throw new Error(j.error); return j.data; } }); }
export function useEscrowAccount(projectId: string) { return useQuery({ queryKey: ["escrow", projectId], queryFn: () => apiFetch<any>(`/api/escrow?projectId=${projectId}`), enabled: !!projectId }); }
export function useEscrowDeposit() { const qc = useQueryClient(); return useMutation({ mutationFn: (d: any) => apiFetch<any>("/api/escrow", { method: "POST", body: JSON.stringify(d) }), onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["escrow", v.projectId] }) }); }
export function useEscrowRelease() { const qc = useQueryClient(); return useMutation({ mutationFn: (d: any) => apiFetch<any>("/api/escrow/release", { method: "POST", body: JSON.stringify(d) }) }); }
export function useDisputes() { return useQuery({ queryKey: ["disputes"], queryFn: () => apiFetch<any>("/api/disputes") }); }
export function useFileDispute() { const qc = useQueryClient(); return useMutation({ mutationFn: (d: any) => apiFetch<any>("/api/disputes", { method: "POST", body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }) }); }
export function useResolveDispute(id: string) { const qc = useQueryClient(); return useMutation({ mutationFn: (d: any) => apiFetch<any>(`/api/disputes/${id}`, { method: "PATCH", body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["disputes"] }) }); }
export function useSubscription() { return useQuery({ queryKey: ["subscription"], queryFn: () => apiFetch<any>("/api/subscriptions") }); }
export function useReviews(params: { designerId?: string; productId?: string }) { const p = new URLSearchParams(); if (params.designerId) p.set("designerId", params.designerId); return useQuery({ queryKey: ["reviews", params], queryFn: () => apiFetch<any>(`/api/reviews?${p}`), enabled: !!(params.designerId || params.productId) }); }
export function useSubmitReview() { const qc = useQueryClient(); return useMutation({ mutationFn: (d: any) => apiFetch<any>("/api/reviews", { method: "POST", body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }) }); }

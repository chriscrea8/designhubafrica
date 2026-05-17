"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Search, Users, ShieldCheck, ShieldX, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";

const ROLES    = ["ALL","CLIENT","DESIGNER","ARTISAN","VENDOR","ADMIN"];
const STATUSES = ["ALL","ACTIVE","SUSPENDED","DEACTIVATED","BANNED"];
const ROLE_COLORS: Record<string,string> = { CLIENT:"bg-blue-50 text-blue-700", DESIGNER:"bg-terracotta-50 text-terracotta-700", ARTISAN:"bg-amber-50 text-amber-700", VENDOR:"bg-purple-50 text-purple-700", ADMIN:"bg-emerald-50 text-emerald-700" };
const STATUS_COLORS: Record<string,string> = { ACTIVE:"bg-emerald-50 text-emerald-700", SUSPENDED:"bg-red-50 text-red-700", DEACTIVATED:"bg-gray-100 text-gray-600", BANNED:"bg-red-100 text-red-800" };

export default function UserManagementPage() {
  const [users,   setUsers]   = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [role,    setRole]    = useState("ALL");
  const [status,  setStatus]  = useState("ALL");
  const [updating,setUpdating]= useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ limit: "50" });
    if (search) p.set("search", search);
    if (role   !== "ALL") p.set("role", role);
    if (status !== "ALL") p.set("status", status);
    const res = await fetch(`/api/admin/users?${p}`).then(r => r.json()).catch(() => ({}));
    if (res.success) { setUsers(res.data?.items || []); setTotal(res.data?.pagination?.total || 0); }
    setLoading(false);
  }, [search, role, status]);

  useEffect(() => { load(); }, [load]);

  async function updateUser(userId: string, field: "status" | "role", value: string) {
    setUpdating(userId);
    await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, [field]: value }) });
    setUpdating(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">User Management</h1><p className="text-sm text-muted-foreground mt-1">{total} total users</p></div>
        <button onClick={load} className="text-muted-foreground hover:text-foreground"><RefreshCw className="h-4 w-4" /></button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..." className="pl-9" />
        </div>
        <select value={role} onChange={e => setRole(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          {ROLES.map(r => <option key={r} value={r}>{r === "ALL" ? "All Roles" : r}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          {STATUSES.map(s => <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-terracotta-500" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr></thead>
                <tbody>{users.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.firstName} {u.lastName}</p>
                      <p className="text-muted-foreground text-xs">{u.email}</p>
                    </td>
                    <td className="px-4 py-3"><Badge className={cn("text-[10px]", ROLE_COLORS[u.role] || "")}>{u.role}</Badge></td>
                    <td className="px-4 py-3"><Badge className={cn("text-[10px]", STATUS_COLORS[u.status] || "")}>{u.status}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {updating === u.id ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (<>
                          {u.status === "ACTIVE"
                            ? <button onClick={() => updateUser(u.id, "status", "SUSPENDED")} className="text-xs text-red-500 hover:underline flex items-center gap-1"><ShieldX className="h-3 w-3" />Suspend</button>
                            : <button onClick={() => updateUser(u.id, "status", "ACTIVE")} className="text-xs text-emerald-600 hover:underline flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Activate</button>
                          }
                        </>)}
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

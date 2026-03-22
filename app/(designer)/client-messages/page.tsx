"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Send, MessageSquare } from "lucide-react";
import { Card, Button, Input, Avatar, Badge, EmptyState } from "@/components/ui";
import { cn, formatRelativeTime } from "@/lib/utils";

export default function ClientMessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages/conversations").then(r => r.json()).then(res => {
      if (res.success) { const c = res.data || []; setConversations(c); if (c.length > 0) setSelected(c[0].id); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/messages/conversations/${selected}/messages`).then(r => r.json()).then(res => { if (res.success) setMessages(res.data?.items || []); });
  }, [selected]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !selected) return;
    const res = await fetch(`/api/messages/conversations/${selected}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newMsg }) });
    const json = await res.json();
    if (json.success) { setMessages(prev => [...prev, json.data]); setNewMsg(""); }
    else if (json.error) alert(json.error);
  }

  const getOther = (c: any) => c.participants?.find((p: any) => p.userId !== session?.user?.id)?.user || { firstName: "User", lastName: "" };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;
  if (conversations.length === 0) return <div className="space-y-4"><h1 className="text-2xl font-bold">Client Messages</h1><EmptyState icon={<MessageSquare className="h-12 w-12" />} title="No conversations" description="Messages from clients will appear here" /></div>;

  return (
    <div className="space-y-4"><h1 className="text-2xl font-bold">Client Messages</h1>
      <Card className="overflow-hidden" style={{ height: "calc(100vh - 200px)" }}><div className="flex h-full">
        <div className="w-72 border-r overflow-y-auto shrink-0">{conversations.map(c => { const o = getOther(c); return (
          <button key={c.id} onClick={() => setSelected(c.id)} className={cn("w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/50 border-b", selected === c.id && "bg-accent")}>
            <Avatar fallback={`${o.firstName?.[0] || ""}${o.lastName?.[0] || ""}`} size="md" />
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{o.firstName} {o.lastName}</p>{c.messages?.[0] && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.messages[0].content}</p>}</div>
          </button>);
        })}</div>
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">{messages.map(m => (
            <div key={m.id} className={cn("flex", m.senderId === session?.user?.id ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5", m.senderId === session?.user?.id ? "bg-terracotta-500 text-white rounded-br-md" : "bg-muted rounded-bl-md")}>
                <p className="text-sm">{m.content}</p><p className={cn("text-[10px] mt-1", m.senderId === session?.user?.id ? "text-white/60" : "text-muted-foreground")}>{formatRelativeTime(m.createdAt)}</p>
              </div>
            </div>
          ))}</div>
          <form onSubmit={send} className="border-t p-3 flex gap-2"><Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message…" className="flex-1 h-10" /><Button type="submit" variant="terracotta" size="icon" className="h-10 w-10"><Send className="h-4 w-4" /></Button></form>
        </div>
      </div></Card>
    </div>
  );
}

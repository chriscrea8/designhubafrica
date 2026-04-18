"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Send, Loader2, CheckCheck, Check, ArrowLeft, FolderKanban, Shield, AlertCircle } from "lucide-react";
import { Button, Input, Avatar } from "@/components/ui";
import { formatRelativeTime, cn } from "@/lib/utils";

export default function MessagesPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadConversations() {
    try {
      const res = await fetch("/api/messages/conversations");
      const json = await res.json();
      if (json.success) setConversations(Array.isArray(json.data) ? json.data : []);
    } catch {}
    setLoading(false);
  }

  async function openConversation(conv: any) {
    setActiveConv(conv);
    setSendError("");
    try {
      const res = await fetch(`/api/messages/conversations/${conv.id}/messages`);
      const json = await res.json();
      if (json.success) {
        // Handle both paginated ({ items: [] }) and direct array responses
        const msgs = json.data?.items ?? (Array.isArray(json.data) ? json.data : []);
        setMessages(msgs);
      }
    } catch {}
    fetch(`/api/messages/conversations/${conv.id}/read`, { method: "POST" }).catch(() => {});
    loadConversations();
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch(`/api/messages/conversations/${activeConv.id}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      const json = await res.json();
      setSending(false);
      if (json.success) {
        setNewMessage("");
        // Handle paginated or direct message response
        const msg = json.data?.item ?? json.data;
        if (msg && msg.id) setMessages(prev => [...prev, msg]);
      } else {
        setSendError(json.error || json.data?.warning || "Failed to send");
      }
    } catch {
      setSending(false);
      setSendError("Network error");
    }
  }

  function getOtherUser(conv: any) {
    const other = (conv.participants || []).find((p: any) => p.userId !== session?.user?.id);
    return other?.user || {};
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 -m-4 lg:-m-6 overflow-hidden">
      {/* Conversation List */}
      <div className={cn("w-full lg:w-80 border-r bg-background flex flex-col shrink-0", activeConv && "hidden lg:flex")}>
        <div className="p-4 border-b"><h2 className="font-semibold">Messages</h2></div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0
            ? <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet. Accept a proposal to start chatting.</div>
            : conversations.map(conv => {
                const other = getOtherUser(conv);
                const lastMsg = conv.messages?.[0];
                return (
                  <button key={conv.id} onClick={() => openConversation(conv)} className={cn("flex items-start gap-3 w-full text-left px-4 py-3 border-b hover:bg-accent/30", activeConv?.id === conv.id && "bg-accent")}>
                    <Avatar fallback={`${other.firstName?.[0] || "?"}${other.lastName?.[0] || ""}`} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{other.firstName} {other.lastName}</span>
                        <span className="text-[10px] text-muted-foreground">{lastMsg ? formatRelativeTime(lastMsg.createdAt) : ""}</span>
                      </div>
                      {conv.project && <p className="text-[10px] text-terracotta-500 flex items-center gap-1 mt-0.5"><FolderKanban className="h-2.5 w-2.5" />{conv.project.title}</p>}
                      {lastMsg && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{lastMsg.content}</p>}
                    </div>
                  </button>
                );
              })}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn("flex-1 flex flex-col bg-background", !activeConv && "hidden lg:flex")}>
        {activeConv ? (<>
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <button onClick={() => setActiveConv(null)} className="lg:hidden p-1"><ArrowLeft className="h-5 w-5" /></button>
            <Avatar fallback={`${getOtherUser(activeConv).firstName?.[0] || "?"}${getOtherUser(activeConv).lastName?.[0] || ""}`} size="sm" />
            <div>
              <p className="font-medium text-sm">{getOtherUser(activeConv).firstName} {getOtherUser(activeConv).lastName}</p>
              {activeConv.project && <p className="text-[10px] text-muted-foreground">{activeConv.project.title}</p>}
            </div>
          </div>

          <div className="px-4 py-1.5 bg-amber-50 border-b">
            <p className="text-[10px] text-amber-700 flex items-center justify-center gap-1"><Shield className="h-3 w-3" />Keep all communication on DesignHub Africa. Sharing contact info is not permitted.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg: any) => {
              const isMine = msg.senderId === session?.user?.id;
              if (msg.type === "system") return <div key={msg.id} className="text-center"><span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">{msg.content}</span></div>;
              return (
                <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 space-y-1", isMine ? "bg-terracotta-500 text-white rounded-br-sm" : "bg-muted rounded-bl-sm")}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div className={cn("flex items-center gap-1", isMine ? "justify-end" : "")}>
                      <span className={cn("text-[10px]", isMine ? "text-white/60" : "text-muted-foreground")}>{formatRelativeTime(msg.createdAt)}</span>
                      {isMine && (msg.isRead ? <CheckCheck className="h-3 w-3 text-white/60" /> : <Check className="h-3 w-3 text-white/60" />)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {sendError && <div className="px-4 py-2 bg-red-50 border-t flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-500 shrink-0" /><p className="text-xs text-red-600">{sendError}</p></div>}

          <div className="p-4 border-t flex gap-2">
            <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message…" className="flex-1" onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
            <Button variant="terracotta" onClick={sendMessage} disabled={!newMessage.trim() || sending} className="shrink-0">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
          </div>
        </>) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div><MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" /><p className="font-medium">Select a conversation</p><p className="text-sm text-muted-foreground mt-1">Messages unlock after a proposal is accepted</p></div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Send, Loader2, CheckCheck, Check, ArrowLeft, FolderKanban, Shield, AlertCircle, Paperclip, X, FileText, Download } from "lucide-react";
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
  const [attaching, setAttaching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set up Pusher real-time when conversation changes
  useEffect(() => {
    if (!activeConv?.id) return;

    // Clean up previous subscription
    if (channelRef.current) {
      channelRef.current.unbind_all();
      pusherRef.current?.unsubscribe(`private-conversation-${activeConv.id}`);
    }

    // Dynamic import to avoid SSR issues
    import("pusher-js").then(({ default: Pusher }) => {
      if (!pusherRef.current) {
        pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
          authEndpoint: "/api/pusher/auth",
        });
      }

      const channel = pusherRef.current.subscribe(`private-conversation-${activeConv.id}`);
      channelRef.current = channel;

      channel.bind("new-message", (data: any) => {
        // Only add if not from ourselves (we already add optimistically)
        if (data.senderId !== session?.user?.id) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === data.id)) return prev;
            return [...prev, { ...data, createdAt: new Date(data.createdAt), sender: { id: data.senderId, firstName: data.senderName?.split(" ")[0], lastName: data.senderName?.split(" ").slice(1).join(" ") } }];
          });
        }
      });
    });

    return () => {
      if (channelRef.current) channelRef.current.unbind_all();
    };
  }, [activeConv?.id, session?.user?.id]);

  // Clean up Pusher on unmount
  useEffect(() => {
    return () => { pusherRef.current?.disconnect(); };
  }, []);

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
        const msgs = json.data?.items ?? (Array.isArray(json.data) ? json.data : []);
        setMessages(msgs);
      }
    } catch {}
    // Mark as read
    fetch(`/api/messages/conversations/${conv.id}/read`, { method: "POST" }).catch(() => {});
    loadConversations();
  }

  async function uploadFile(file: File) {
    setAttaching(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "messages");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    setAttaching(false);
    return json.success ? json.data.url : null;
  }

  async function sendMessage(fileUrl?: string) {
    const content = fileUrl ? (newMessage || "📎 File attached") : newMessage;
    if (!content.trim() || !activeConv) return;

    setSending(true);
    setSendError("");

    // Optimistic update
    const tempMsg = { id: `temp-${Date.now()}`, senderId: session?.user?.id, content, type: fileUrl ? "file" : "text", fileUrl, createdAt: new Date(), isRead: false, sender: { id: session?.user?.id, firstName: session?.user?.name?.split(" ")[0] || "", lastName: "" } };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage("");

    try {
      const res = await fetch(`/api/messages/conversations/${activeConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type: fileUrl ? "file" : "text", fileUrl }),
      });
      const json = await res.json();
      setSending(false);

      if (json.success) {
        // Replace temp message with real one
        const real = json.data?.item ?? json.data;
        if (real?.id) {
          setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...real, sender: m.sender } : m));
        }
      } else {
        // Remove optimistic message and show error
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        setSendError(json.error || json.data?.warning || "Message blocked");
      }
    } catch {
      setSending(false);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setSendError("Network error — please try again");
    }
  }

  async function handleFileAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) await sendMessage(url);
    if (fileRef.current) fileRef.current.value = "";
  }

  function getOtherUser(conv: any) {
    const other = (conv.participants || []).find((p: any) => p.userId !== session?.user?.id);
    return other?.user || {};
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 -m-4 lg:-m-6 overflow-hidden">

      {/* ── Conversation List ── */}
      <div className={cn("w-full lg:w-80 border-r bg-background flex flex-col shrink-0", activeConv && "hidden lg:flex")}>
        <div className="p-4 border-b">
          <h2 className="font-semibold">Messages</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Conversations unlock after a proposal is accepted</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0
            ? <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet</div>
            : conversations.map(conv => {
                const other = getOtherUser(conv);
                const lastMsg = conv.messages?.[0];
                return (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className={cn("flex items-start gap-3 w-full text-left px-4 py-3 border-b hover:bg-accent/30 transition-colors", activeConv?.id === conv.id && "bg-accent")}
                  >
                    <Avatar fallback={`${other.firstName?.[0] || "?"}${other.lastName?.[0] || ""}`} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{other.firstName} {other.lastName}</span>
                        <span className="text-[10px] text-muted-foreground">{lastMsg ? formatRelativeTime(lastMsg.createdAt) : ""}</span>
                      </div>
                      {conv.project && (
                        <p className="text-[10px] text-terracotta-500 flex items-center gap-1 mt-0.5">
                          <FolderKanban className="h-2.5 w-2.5" />{conv.project.title}
                        </p>
                      )}
                      {lastMsg && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{lastMsg.type === "file" ? "📎 Attachment" : lastMsg.content}</p>}
                    </div>
                  </button>
                );
              })}
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div className={cn("flex-1 flex flex-col bg-background", !activeConv && "hidden lg:flex")}>
        {activeConv ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              <button onClick={() => setActiveConv(null)} className="lg:hidden p-1 hover:bg-accent rounded">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar fallback={`${getOtherUser(activeConv).firstName?.[0] || "?"}${getOtherUser(activeConv).lastName?.[0] || ""}`} size="sm" />
              <div>
                <p className="font-medium text-sm">{getOtherUser(activeConv).firstName} {getOtherUser(activeConv).lastName}</p>
                {activeConv.project && <p className="text-[10px] text-muted-foreground">{activeConv.project.title}</p>}
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-muted-foreground">Live</span>
              </div>
            </div>

            {/* Safety banner */}
            <div className="px-4 py-1.5 bg-amber-50 border-b flex items-center justify-center gap-2">
              <Shield className="h-3 w-3 text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-700">Keep all communication on DesignHub Africa. Sharing contact details is not permitted.</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg: any) => {
                const isMine = msg.senderId === session?.user?.id;
                const isSystem = msg.type === "system";

                if (isSystem) return (
                  <div key={msg.id} className="text-center">
                    <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">{msg.content}</span>
                  </div>
                );

                return (
                  <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                    {!isMine && <Avatar fallback={`${msg.sender?.firstName?.[0] || "?"}${msg.sender?.lastName?.[0] || ""}`} size="sm" className="mr-2 mt-1 shrink-0" />}
                    <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 space-y-1", isMine ? "bg-terracotta-500 text-white rounded-br-sm" : "bg-muted rounded-bl-sm")}>
                      {msg.type === "invoice" ? (() => {
                        let inv: any = {};
                        try { inv = JSON.parse(msg.content); } catch {}
                        return (
                          <div className={cn("rounded-lg border p-3 space-y-2 min-w-[220px]", isMine ? "border-white/20 bg-white/10" : "border-terracotta-200 bg-terracotta-50")}>
                            <div className="flex items-center gap-2">
                              <FileText className={cn("h-4 w-4 shrink-0", isMine ? "text-white" : "text-terracotta-500")} />
                              <span className={cn("text-xs font-semibold uppercase tracking-wide", isMine ? "text-white/70" : "text-terracotta-600")}>Invoice</span>
                            </div>
                            <p className={cn("text-sm font-semibold", isMine ? "text-white" : "text-foreground")}>{inv.title || "Invoice"}</p>
                            <p className={cn("text-lg font-bold", isMine ? "text-white" : "text-terracotta-500")}>₦{(inv.totalAmount || 0).toLocaleString()}</p>
                            <a href={`/api/invoices/${inv.invoiceId}/pdf`} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-1.5 text-xs font-medium hover:underline", isMine ? "text-white" : "text-terracotta-500")}>
                              <Download className="h-3 w-3" />Download PDF
                            </a>
                          </div>
                        );
                      })() : msg.type === "file" && msg.fileUrl ? (
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-2 text-sm underline", isMine ? "text-white" : "text-terracotta-500")}>
                          <Paperclip className="h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-1">{msg.fileUrl.split("/").pop()?.split("?")[0] || "Attachment"}</span>
                        </a>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
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

            {/* Error bar */}
            {sendError && (
              <div className="px-4 py-2 bg-red-50 border-t flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600 flex-1">{sendError}</p>
                <button onClick={() => setSendError("")}><X className="h-4 w-4 text-red-400" /></button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t flex gap-2 items-end">
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileAttach} accept="image/*,.pdf,.doc,.docx" />
              <button onClick={() => fileRef.current?.click()} disabled={attaching} className="h-10 w-10 shrink-0 rounded-lg border flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" title="Attach file">
                {attaching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <Input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message…"
                className="flex-1"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <Button variant="terracotta" onClick={() => sendMessage()} disabled={!newMessage.trim() || sending} className="shrink-0 h-10 w-10 p-0">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm text-muted-foreground mt-1">Messages open after a proposal is accepted</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

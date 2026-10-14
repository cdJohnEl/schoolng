"use client";
import { useState, useEffect } from "react";
import { MessageSquare, Send, Users, WifiOff } from "lucide-react";
import { collection, query, where, getDocs, addDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import Topbar from "@/components/layout/Topbar";
import { EmptyState, Badge } from "@/components/ui/index";
import { formatDate } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import type { Message, SchoolClass } from "@/types";

export default function CommunicationsPage() {
  const { appUser } = useAuth();
  const [messages, setMessages]     = useState<Message[]>([]);
  const [classes, setClasses]       = useState<SchoolClass[]>([]);
  const [loading, setLoading]       = useState(true);
  const [sending, setSending]       = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Compose
  const [target, setTarget]         = useState<"all" | "class" | "debtors">("all");
  const [targetClass, setTargetClass] = useState("");
  const [body, setBody]             = useState("");

  const schoolId = appUser?.schoolId ?? "";

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }
    Promise.all([
      getDocs(query(collection(db, "messages"), where("schoolId", "==", schoolId))),
      getDocs(query(collection(db, "classes"), where("schoolId", "==", schoolId))),
    ])
      .then(([msgSnap, clsSnap]) => {
        const mList = msgSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Message))
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setMessages(mList);
        setClasses(clsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolClass)));
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      const msg: Omit<Message, "id"> = {
        schoolId, type: "in_app", target,
        targetClassId: target === "class" ? targetClass : undefined,
        body, sentBy: appUser?.uid ?? "",
        recipientCount: 0,
        status: "sent",
        createdAt: new Date().toISOString(),
      };
      const ref = await addDoc(collection(db, "messages"), msg);
      setMessages(prev => [{ ...msg, id: ref.id }, ...prev]);
      setBody("");
      toast("Message sent successfully");
    } catch {
      toast("Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  const TARGET_LABELS: Record<string, string> = { all: "All parents", class: "Class", debtors: "Fee debtors" };

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Communications" subtitle="Send messages to parents and staff" />
      <div className="flex-1 p-6 space-y-5 animate-fade-in">
        {fetchError && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-sm">
            <WifiOff className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 flex-1">Failed to load messages.</span>
            <button onClick={() => window.location.reload()} className="text-red-700 font-medium underline text-xs">Retry</button>
          </div>
        )}

        {/* Compose */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Send message</h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Send to</label>
                <select value={target} onChange={e => setTarget(e.target.value as typeof target)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                  <option value="all">All parents</option>
                  <option value="class">Specific class</option>
                  <option value="debtors">Fee debtors only</option>
                </select>
              </div>
              {target === "class" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Select class</label>
                  <select value={targetClass} onChange={e => setTargetClass(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
                    <option value="">Choose…</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.arm ? ` ${c.arm}` : ""}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
              <textarea required rows={4} value={body} onChange={e => setBody(e.target.value)}
                placeholder="Dear Parent, we wish to inform you that…"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-gray-400 resize-none" />
              <p className="text-xs text-muted-foreground mt-1">{body.length} characters</p>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={sending || !body.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                <Send className="w-4 h-4" />
                {sending ? "Sending…" : `Send to ${TARGET_LABELS[target]}`}
              </button>
              <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                SMS delivery via Termii or AfricasTalking — add your API key to <code className="font-mono">.env.local</code> to enable.
              </div>
            </div>
          </form>
        </div>

        {/* Message history */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Message history</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No messages sent yet"
              description="Send your first message to parents above." />
          ) : (
            <div className="divide-y divide-gray-100">
              {messages.map(m => (
                <div key={m.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-gray-500">To:</span>
                      <Badge variant="info">{TARGET_LABELS[m.target] ?? m.target}</Badge>
                      <Badge variant={m.status === "sent" ? "success" : "danger"}>{m.status}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(m.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{m.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

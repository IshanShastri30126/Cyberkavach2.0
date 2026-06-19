"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Inbox, Shield, Radio, Zap, X, ArrowUpRight, Clock } from "lucide-react";

interface Notification { id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string; }

const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  APPROVAL: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  EVENT: { color: "#06b6d4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)" },
  BADGE: { color: "#7c3aed", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)" },
  POINTS: { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  SYSTEM: { color: "#94a3b8", bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.15)" },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.SYSTEM;
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

  const load = async () => {
    try {
      const data = await api<{ notifications: Notification[] }>("/notifications", { token: token || undefined });
      setNotifications(data.notifications);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const markRead = async (id: string) => {
    await api(`/notifications/${id}/read`, { method: "PATCH", token: token || undefined });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await api("/notifications/read-all", { method: "PATCH", token: token || undefined });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const dismiss = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const displayed = filter === "UNREAD" ? notifications.filter(n => !n.isRead) : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">SYSTEM BROADCAST FEED</span>
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tighter text-white">
            NOTIFICATIONS
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            {unreadCount > 0 ? (
              <span className="text-amber-400">{unreadCount} UNREAD BROADCASTS</span>
            ) : (
              "ALL BROADCASTS ACKNOWLEDGED"
            )}
          </p>
        </div>
        <button onClick={markAllRead}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-500/25 bg-cyan-950/20 text-cyan-400 text-xs font-bold uppercase tracking-wider hover:bg-cyan-500/15 hover:border-cyan-500/40 transition-all"
        >
          <CheckCheck className="w-4 h-4" /> ACK ALL
        </button>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-2 p-1 rounded-xl bg-white/3 border border-white/5 w-fit"
      >
        {(["ALL", "UNREAD"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filter === f ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            {f} {f === "UNREAD" && unreadCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">{unreadCount}</span>}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          </div>
          <p className="text-xs font-mono text-zinc-600 animate-pulse uppercase tracking-widest">FETCHING BROADCASTS...</p>
        </div>
      ) : displayed.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center py-24 gap-4"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 flex items-center justify-center">
              <Shield className="w-9 h-9 text-cyan-500/50" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-widest text-zinc-400">SECURE MATRIX ACTIVE</p>
            <p className="text-xs text-zinc-600 mt-1">Zero unacknowledged broadcasts detected.</p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {displayed.map((n, i) => {
              const cfg = getTypeConfig(n.type);
              return (
                <motion.div key={n.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.2 } }}
                  transition={{ delay: i * 0.04 }}
                  className={`relative rounded-2xl overflow-hidden border transition-all group ${n.isRead ? "opacity-55 hover:opacity-80" : ""}`}
                  style={{
                    background: cfg.bg,
                    borderColor: n.isRead ? "rgba(255,255,255,0.05)" : cfg.border,
                  }}
                >
                  {/* Active left stripe */}
                  {!n.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full" style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}80` }} />
                  )}
                  <div className="p-4 pl-5 flex gap-3">
                    {/* Icon dot */}
                    <div className="shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background: `${cfg.color}15`, borderColor: `${cfg.color}30` }}>
                        {!n.isRead ? <Bell className="w-3.5 h-3.5" style={{ color: cfg.color }} /> : <Inbox className="w-3.5 h-3.5 text-zinc-500" />}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-zinc-100 leading-snug">{n.title}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-zinc-600" />
                          <span className="text-[10px] font-mono text-zinc-600">{timeAgo(n.createdAt)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border font-mono" style={{ color: cfg.color, borderColor: `${cfg.color}30`, background: `${cfg.color}10` }}>
                          {n.type}
                        </span>
                        <span className="text-[10px] text-zinc-600 font-mono">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.isRead && (
                        <button onClick={() => markRead(n.id)}
                          className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-green-950/40 hover:border-green-500/30 text-zinc-500 hover:text-green-400 transition-all"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => dismiss(n.id)}
                        className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-red-950/40 hover:border-red-500/30 text-zinc-500 hover:text-red-400 transition-all"
                        title="Dismiss"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Bell, Check, CheckCheck } from "lucide-react";

interface Notification { id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string; }

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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
    load();
  };

  const markAllRead = async () => {
    await api("/notifications/read-all", { method: "PATCH", token: token || undefined });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-3xl font-bold" style={{ color: "var(--ck-text)" }}>Notifications</h1><p className="mt-1" style={{ color: "var(--ck-text-secondary)" }}>Stay updated on approvals, events & more</p></div>
        <button onClick={markAllRead} className="ck-btn-secondary text-sm"><CheckCheck className="w-4 h-4" /> Mark All Read</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20"><Bell className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--ck-text-muted)" }} /><p style={{ color: "var(--ck-text-secondary)" }}>No notifications</p></div>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {notifications.map((n) => (
            <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
              className={`ck-card p-4 cursor-pointer transition-all ${!n.isRead ? "border-l-4 border-indigo-500" : "opacity-70"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--ck-text)" }}>{n.title}</p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--ck-text-secondary)" }}>{n.message}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--ck-text-muted)" }}>{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

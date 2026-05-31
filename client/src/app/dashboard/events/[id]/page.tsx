"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, API_BASE } from "@/lib/api";
import { motion } from "framer-motion";
import {
  ArrowLeft, Calendar, Users, MapPin, Clock, Download, ExternalLink,
  Eye, EyeOff, Trash2, Search, TrendingUp, UsersRound, BarChart3
} from "lucide-react";

interface EventDetail {
  id: string; title: string; description?: string; venue?: string;
  startDate: string; endDate: string; registrationDeadline?: string;
  posterUrl?: string; slug: string; rules?: string; tags: string[];
  minTeamSize?: number; maxTeamSize?: number; maxCapacity?: number;
  isPublished: boolean; isDraft: boolean; eventType: string;
  creator: { id: string; name: string; role: string };
  _count: { registrations: number; teams: number; attendance: number };
}

interface Analytics {
  totalRegistrations: number; totalTeams: number;
  registrationTimeline: { date: string; count: number }[];
  teamSizeDistribution: { size: number; count: number }[];
  attendance: { checkedIn: number; checkedOut: number; lateArrivals: number };
  capacity: number | null; capacityPercent: number | null;
}

interface Registration {
  id: string; createdAt: string;
  user: { id: string; name: string; email: string; studentId?: string; role: string; department?: string };
  team?: { id: string; name: string; teamCode: string };
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user, isLoading } = useAuth();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"overview" | "registrations" | "teams">("overview");

  const isCoord = user && ["FACULTY", "STUDENT_COORDINATOR"].includes(user.role);
  const isCore = user && ["FACULTY", "STUDENT_COORDINATOR", "TECH", "CONTENT", "SOCIAL_MEDIA"].includes(user.role);

  useEffect(() => {
    if (!isLoading && user && !["FACULTY", "STUDENT_COORDINATOR", "TECH", "CONTENT", "SOCIAL_MEDIA"].includes(user.role)) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const [e, a, r] = await Promise.all([
          api<{ event: EventDetail }>(`/events/${eventId}`, { token }),
          api<Analytics>(`/events/${eventId}/analytics`, { token }),
          api<{ registrations: Registration[] }>(`/events/${eventId}/registrations`, { token }),
        ]);
        setEvent(e.event); setAnalytics(a); setRegistrations(r.registrations);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [token, eventId]);

  const handlePublish = async () => {
    try {
      await api(`/events/${eventId}/publish`, { method: "PATCH", token: token || undefined });
      const e = await api<{ event: EventDetail }>(`/events/${eventId}`, { token: token || undefined });
      setEvent(e.event);
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const handleDelete = async () => {
    if (!confirm("Archive this event? It will be hidden from public view.")) return;
    try {
      await api(`/events/${eventId}`, { method: "DELETE", token: token || undefined });
      router.push("/dashboard/events");
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const handleExportCSV = () => {
    window.open(`${API_BASE}/events/${eventId}/registrations/export?token=${token}`, "_blank");
  };

  const filteredRegs = search
    ? registrations.filter((r) =>
        r.user.name.toLowerCase().includes(search.toLowerCase()) ||
        r.user.email.toLowerCase().includes(search.toLowerCase()) ||
        (r.user.studentId && r.user.studentId.toLowerCase().includes(search.toLowerCase()))
      )
    : registrations;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return <div className="text-center py-20" style={{ color: "var(--ck-text-secondary)" }}>Event not found</div>;
  }

  const capacityPercent = event.maxCapacity ? Math.round((event._count.registrations / event.maxCapacity) * 100) : 0;

  return (
    <div>
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/dashboard/events")} className="p-2 rounded-lg hover:bg-[var(--ck-border)] transition">
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--ck-text-secondary)" }} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: "var(--ck-text)" }}>{event.title}</h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`ck-badge ${event.isPublished ? "ck-badge-success" : "ck-badge-warning"}`}>
              {event.isPublished ? "Published" : "Draft"}
            </span>
            <span className="text-xs" style={{ color: "var(--ck-text-muted)" }}>
              <Calendar className="w-3 h-3 inline mr-1" />
              {new Date(event.startDate).toLocaleDateString()}
            </span>
            {event.venue && (
              <span className="text-xs" style={{ color: "var(--ck-text-muted)" }}>
                <MapPin className="w-3 h-3 inline mr-1" />{event.venue}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {event.isPublished && (
            <>
              <a href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer" className="ck-btn-secondary text-xs">
                <ExternalLink className="w-4 h-4" /> Public Page
              </a>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/events/${event.slug}`);
                  alert("Link copied to clipboard!");
                }} 
                className="ck-btn-secondary text-xs"
              >
                Copy Link
              </button>
            </>
          )}
          {isCoord && user && ["FACULTY", "STUDENT_COORDINATOR"].includes(user.role) && (
            <>
              <button onClick={handlePublish} className="ck-btn-secondary text-xs">
                {event.isPublished ? <><EyeOff className="w-4 h-4" /> Unpublish</> : <><Eye className="w-4 h-4" /> Publish</>}
              </button>
              <button onClick={handleDelete} className="ck-btn-secondary text-xs text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" /> Archive
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Registrations", value: analytics?.totalRegistrations || 0, icon: <Users className="w-5 h-5" />, color: "from-indigo-500 to-purple-500" },
          { label: "Teams", value: analytics?.totalTeams || 0, icon: <UsersRound className="w-5 h-5" />, color: "from-cyan-500 to-blue-500" },
          { label: "Checked In", value: analytics?.attendance.checkedIn || 0, icon: <TrendingUp className="w-5 h-5" />, color: "from-emerald-500 to-teal-500" },
          { label: "Checked Out", value: analytics?.attendance.checkedOut || 0, icon: <Clock className="w-5 h-5" />, color: "from-amber-500 to-orange-500" },
          { label: "Late Arrivals", value: analytics?.attendance.lateArrivals || 0, icon: <Clock className="w-5 h-5" />, color: "from-red-500 to-pink-500" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="ck-card p-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-2`}>
              {s.icon}
            </div>
            <p className="text-xl font-bold" style={{ color: "var(--ck-text)" }}>{s.value}</p>
            <p className="text-xs" style={{ color: "var(--ck-text-muted)" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Capacity Progress */}
      {event.maxCapacity && (
        <div className="ck-card p-5 mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium" style={{ color: "var(--ck-text)" }}>Capacity</p>
            <p className="text-sm font-bold" style={{ color: "var(--ck-text)" }}>
              {event._count.registrations} / {event.maxCapacity}
              <span className="text-xs font-normal ml-2" style={{ color: "var(--ck-text-muted)" }}>({capacityPercent}%)</span>
            </p>
          </div>
          <div className="h-4 rounded-full overflow-hidden" style={{ background: "var(--ck-border)" }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(capacityPercent, 100)}%` }}
              transition={{ duration: 1.2 }}
              className={`h-full rounded-full ${capacityPercent >= 90 ? "bg-red-500" : capacityPercent >= 70 ? "bg-amber-500" : "bg-gradient-to-r from-indigo-500 to-cyan-500"}`} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "var(--ck-bg-secondary)" }}>
        {(["overview", "registrations", "teams"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-indigo-500 text-white shadow" : ""}`}
            style={tab !== t ? { color: "var(--ck-text-secondary)" } : {}}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registration Timeline */}
          <div className="ck-card p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--ck-text)" }}>
              <BarChart3 className="w-4 h-4 text-indigo-400" /> Registration Timeline
            </h3>
            {analytics.registrationTimeline.length === 0 ? (
              <p className="text-sm py-4" style={{ color: "var(--ck-text-muted)" }}>No registrations yet</p>
            ) : (
              <div className="space-y-2">
                {analytics.registrationTimeline.map((d) => {
                  const maxCount = Math.max(...analytics.registrationTimeline.map((t) => t.count));
                  const pct = Math.round((d.count / maxCount) * 100);
                  return (
                    <div key={d.date} className="flex items-center gap-3">
                      <span className="text-xs w-20 shrink-0" style={{ color: "var(--ck-text-muted)" }}>
                        {new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </span>
                      <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: "var(--ck-border)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                          className="h-full rounded-md bg-gradient-to-r from-indigo-500 to-cyan-500" />
                      </div>
                      <span className="text-xs font-medium w-6 text-right" style={{ color: "var(--ck-text)" }}>{d.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Team Size Distribution */}
          <div className="ck-card p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--ck-text)" }}>
              <UsersRound className="w-4 h-4 text-cyan-400" /> Team Size Distribution
            </h3>
            {analytics.teamSizeDistribution.length === 0 ? (
              <p className="text-sm py-4" style={{ color: "var(--ck-text-muted)" }}>No teams yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.teamSizeDistribution.map((d) => (
                  <div key={d.size} className="flex items-center gap-3">
                    <span className="text-xs w-24 shrink-0" style={{ color: "var(--ck-text-secondary)" }}>{d.size} members</span>
                    <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: "var(--ck-border)" }}>
                      <div className="h-full rounded-md bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${Math.round((d.count / Math.max(...analytics.teamSizeDistribution.map((t) => t.count))) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium w-6 text-right" style={{ color: "var(--ck-text)" }}>{d.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Registrations */}
      {tab === "registrations" && (
        <div className="ck-card overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-[var(--ck-border)]">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ck-text-muted)" }} />
              <input className="ck-input pl-9" placeholder="Search by name, email, or student ID..." value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button onClick={handleExportCSV} className="ck-btn-secondary text-xs">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <span className="text-xs" style={{ color: "var(--ck-text-muted)" }}>{filteredRegs.length} results</span>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="ck-table whitespace-nowrap">
              <thead>
                <tr><th>#</th><th>Name</th><th>Email</th><th>Student ID</th><th>Department</th><th>Team</th><th>Registered</th></tr>
              </thead>
              <tbody>
                {filteredRegs.map((r, i) => (
                  <tr key={r.id}>
                    <td className="text-xs">{i + 1}</td>
                    <td className="text-sm font-medium">{r.user.name}</td>
                    <td className="text-xs">{r.user.email}</td>
                    <td className="text-xs">{r.user.studentId || "—"}</td>
                    <td className="text-xs">{r.user.department || "—"}</td>
                    <td>{r.team ? <span className="ck-badge ck-badge-primary text-[10px]">{r.team.name} ({r.team.teamCode})</span> : <span className="text-xs" style={{ color: "var(--ck-text-muted)" }}>Individual</span>}</td>
                    <td className="text-xs" style={{ color: "var(--ck-text-muted)" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Teams */}
      {tab === "teams" && (
        <div className="text-sm" style={{ color: "var(--ck-text-muted)" }}>
          <p className="mb-4">{analytics?.totalTeams || 0} teams registered for this event</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registrations.filter((r) => r.team).reduce((acc, r) => {
              if (r.team && !acc.find((t) => t.teamCode === r.team!.teamCode)) {
                acc.push({ ...r.team!, members: registrations.filter((rr) => rr.team?.teamCode === r.team!.teamCode).map((rr) => rr.user) });
              }
              return acc;
            }, [] as any[]).map((team: any) => (
              <div key={team.teamCode} className="ck-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium" style={{ color: "var(--ck-text)" }}>{team.name}</p>
                    <code className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--ck-bg-secondary)", color: "var(--ck-text-muted)" }}>{team.teamCode}</code>
                  </div>
                  <span className="ck-badge ck-badge-primary">{team.members.length} members</span>
                </div>
                <div className="space-y-1">
                  {team.members.map((m: any) => (
                    <p key={m.id} className="text-xs" style={{ color: "var(--ck-text-secondary)" }}>
                      • {m.name} ({m.email})
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

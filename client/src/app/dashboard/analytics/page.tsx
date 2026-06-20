"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, getFileUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, Users, Calendar, FileCheck, Award, TrendingUp, 
  ClipboardList, Activity, Zap, Shield, Radio, Target, Cpu, 
  Search, ArrowUpRight, AwardIcon, Sparkles, Star, Users2,
  CalendarDays, TrendingDown
} from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  FACULTY: "#7c3aed",
  STUDENT_COORDINATOR: "#06b6d4",
  TECH: "#10b981",
  CONTENT: "#f59e0b",
  SOCIAL_MEDIA: "#ec4899",
  MEMBER: "#6366f1",
  GUEST: "#64748b",
};

const MEDALS = ["🥇", "🥈", "🥉"];

function CircleGauge({ value, max, label, color, icon }: { value: number; max: number; label: string; color: string; icon: React.ReactNode }) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex flex-col items-center gap-3 cursor-default"
    >
      <div className="relative w-28 h-28">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r + 4} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" strokeLinecap="round" />
          <motion.circle
            cx="50" cy="50" r={r} fill="none"
            stroke={color} strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 10px ${color}60)` }}
          />
          <motion.circle
            cx="50" cy="50" r={r} fill="none"
            stroke={color} strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`2 ${circ - 2}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 20px ${color})` }}
            opacity={0.6}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-black font-mono"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            {value}
          </motion.span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span style={{ color }} className="opacity-80">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</span>
      </div>
    </motion.div>
  );
}

function AnimatedBar({ label, count, total, color, delay = 0 }: { label: string; count: number; total: number; color: string; delay?: number }) {
  const pct = Math.round((count / Math.max(total, 1)) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="group"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">{label.replace(/_/g, " ")}</span>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold" style={{ color }}>{count}</span>
          <span className="text-[10px] text-zinc-600 font-mono bg-white/[0.03] px-1.5 py-0.5 rounded">{pct}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-white/[0.04] border border-white/[0.03]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.4, ease: "easeOut", delay }}
          className="h-full rounded-full relative overflow-hidden"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 12px ${color}40` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: "shimmer 2.5s ease-in-out infinite" }} />
        </motion.div>
      </div>
    </motion.div>
  );
}

function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  if (!data || data.length < 2) return <span className="text-[11px] text-zinc-650 font-mono">STATIC</span>;
  const values = data.map(d => d.count);
  const max = Math.max(...values, 1);
  const width = 100;
  const height = 24;
  const points = data.map((d, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - (d.count / max) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke="#CCFF00"
        strokeWidth="1.5"
        points={points}
        style={{ filter: "drop-shadow(0 0 3px rgba(204,255,0,0.5))" }}
      />
    </svg>
  );
}

const STAT_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  totalUsers: { label: "Members", icon: <Users className="w-4 h-4" />, color: "#7c3aed" },
  totalEvents: { label: "Events", icon: <Calendar className="w-4 h-4" />, color: "#06b6d4" },
  totalCertificates: { label: "Certificates", icon: <FileCheck className="w-4 h-4" />, color: "#10b981" },
  totalApprovals: { label: "Approvals", icon: <ClipboardList className="w-4 h-4" />, color: "#f59e0b" },
  totalRegistrations: { label: "Registrations", icon: <Award className="w-4 h-4" />, color: "#ec4899" },
  totalTeams: { label: "Teams", icon: <Users className="w-4 h-4" />, color: "#8b5cf6" },
  totalPoints: { label: "Points", icon: <TrendingUp className="w-4 h-4" />, color: "#22d3ee" },
  totalBadges: { label: "Badges", icon: <Award className="w-4 h-4" />, color: "#a78bfa" },
};

export default function AnalyticsPage() {
  const { user, token } = useAuth();
  const [clubData, setClubData] = useState<any>(null);
  const [topAchiever, setTopAchiever] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);

  // Expanded analytics state
  const [top3Data, setTop3Data] = useState<any>(null);
  const [eventsAnalysis, setEventsAnalysis] = useState<any[]>([]);
  const [coordinatorActivity, setCoordinatorActivity] = useState<any[]>([]);
  
  // Search & sorting state
  const [eventSearch, setEventSearch] = useState("");
  const [eventSortField, setEventSortField] = useState<string>("registrationsCount");
  const [eventSortOrder, setEventSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const isCoordinator = user?.role && ["FACULTY", "STUDENT_COORDINATOR"].includes(user.role);
        if (isCoordinator) {
          const [data, top3, analysis, activity] = await Promise.all([
            api<any>("/analytics/club", { token }),
            api<any>("/analytics/top3", { token }),
            api<any>("/analytics/events-analysis", { token }),
            api<any>("/analytics/coordinator-activity", { token }),
          ]);
          setClubData(data);
          setTop3Data(top3);
          setEventsAnalysis(analysis || []);
          setCoordinatorActivity(activity || []);
        } else {
          const data = await api<any>("/analytics/operations", { token });
          setClubData(data);
        }

        const leaderboardData = await api<any>("/appreciation/leaderboard", { token });
        if (leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0) {
          setTopAchiever(leaderboardData.leaderboard[0]);
        }
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
        setPulse(true); 
      }
    };
    load();
  }, [token, user]);

  const maxStat = clubData?.overview ? Math.max(...Object.values(clubData.overview).map(Number)) : 1;
  const isCoordinator = user?.role && ["FACULTY", "STUDENT_COORDINATOR"].includes(user.role);

  // Sorting logic for events analysis
  const handleSort = (field: string) => {
    if (eventSortField === field) {
      setEventSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setEventSortField(field);
      setEventSortOrder("desc");
    }
  };

  const sortedEvents = useMemo(() => {
    let result = [...eventsAnalysis];
    
    // Search filter
    if (eventSearch.trim()) {
      const q = eventSearch.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(q) || e.eventType.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[eventSortField];
      let bVal = b[eventSortField];
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return eventSortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return eventSortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [eventsAnalysis, eventSearch, eventSortField, eventSortOrder]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-violet-500/20 border-b-violet-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 animate-pulse">LOADING ANALYTICS ENGINE...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">LIVE TELEMETRY FEED</span>
          </div>
          <h1 className="text-4xl font-black font-mono tracking-tighter text-white">
            ANALYTICS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-[#CCFF00] to-cyan-400">DASHBOARD</span>
          </h1>
          <p className="text-sm text-zinc-550 mt-1 font-mono">CLUB TELEMETRY // ENGAGEMENT METRICS // ADJUDICATION PERFORMANCE</p>
        </div>
        <motion.div
          animate={{ borderColor: ["rgba(34,197,94,0.2)", "rgba(34,197,94,0.4)", "rgba(34,197,94,0.2)"] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-green-950/10 backdrop-blur-sm"
        >
          <Radio className="w-4 h-4 text-green-400 animate-pulse" />
          <span className="text-xs font-mono text-green-400 font-bold">SYSTEM ACTIVE</span>
        </motion.div>
      </motion.div>

      {/* ═══ Top User Appreciation Card ═══ */}
      {topAchiever && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl ck-glass-card ck-mesh-bg p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #CCFF00, #FF003C, transparent)" }} />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5 flex-col md:flex-row text-center md:text-left">
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#CCFF00]/40 shadow-[0_0_20px_rgba(204,255,0,0.2)] shrink-0 mx-auto md:mx-0">
                {topAchiever.user?.avatarUrl ? (
                  <img src={getFileUrl(topAchiever.user.avatarUrl)} alt={topAchiever.user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                    <Users className="w-10 h-10 text-zinc-650" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#CCFF00]/20 to-transparent translate-y-[-100%] animate-[scan_2.5s_linear_infinite]" />
              </div>

              <div>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
                  <span className="text-[10px] font-mono text-[#CCFF00] uppercase tracking-widest font-black">HIGH XP LEADER</span>
                </div>
                <h2 className="text-2xl font-black font-mono tracking-tighter text-white uppercase">{topAchiever.user?.name}</h2>
                <p className="text-xs text-[#FF003C] font-mono uppercase tracking-wider font-semibold mt-0.5">
                  {topAchiever.user?.role?.replace(/_/g, " ")} // SECURITY CLEARANCE
                </p>
                
                {topAchiever.badges && topAchiever.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 justify-center md:justify-start">
                    {topAchiever.badges.map((b: any, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[9px] font-mono text-zinc-400" title={b.description}>
                        <span>🏅</span>
                        <span>{b.name}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-5 sm:gap-6 shrink-0 bg-black/40 backdrop-blur-sm border border-white/[0.05] p-5 rounded-xl font-mono text-center md:text-left min-w-[260px] justify-around">
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">XP RANK</p>
                <p className="text-3xl font-black text-[#CCFF00]" style={{ textShadow: "0 0 20px rgba(204,255,0,0.3)" }}>#01</p>
              </div>
              <div className="w-px bg-white/[0.06] self-stretch" />
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">TOTAL POINTS</p>
                <p className="text-3xl font-black text-white">{topAchiever.totalPoints}</p>
              </div>
              <div className="w-px bg-white/[0.06] self-stretch" />
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">BADGES</p>
                <p className="text-3xl font-black text-[#FF003C]">{topAchiever.badges?.length || 0}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ Top 3 Leaderboards Section (Podium UI) ═══ */}
      {isCoordinator && top3Data && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Top 3 Events */}
          <div className="rounded-2xl border border-white/5 bg-white/2 p-5 space-y-4">
            <h3 className="text-sm font-black font-mono tracking-widest text-[#CCFF00] uppercase flex items-center gap-2">
              <CalendarDays className="w-4.5 h-4.5" /> TOP EVENTS
            </h3>
            <div className="space-y-3">
              {top3Data.events.map((e: any, idx: number) => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 group hover:border-[#CCFF00]/30 transition-all">
                  <span className="text-xl shrink-0 font-bold">{MEDALS[idx] || "⭐"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-200 truncate">{e.title}</p>
                    <p className="text-[10px] text-zinc-550 font-mono uppercase">{e.eventType} · {new Date(e.startDate).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-[#CCFF00] font-mono">{e.registrations}</span>
                    <p className="text-[8px] text-zinc-500 uppercase font-mono">REGS</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 Members */}
          <div className="rounded-2xl border border-white/5 bg-white/2 p-5 space-y-4">
            <h3 className="text-sm font-black font-mono tracking-widest text-[#06b6d4] uppercase flex items-center gap-2">
              <Star className="w-4.5 h-4.5" /> TOP OPERATIVES
            </h3>
            <div className="space-y-3">
              {top3Data.members.map((m: any, idx: number) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 group hover:border-[#06b6d4]/30 transition-all">
                  <span className="text-xl shrink-0 font-bold">{MEDALS[idx] || "⭐"}</span>
                  <div className="relative w-8 h-8 rounded-full border border-white/10 overflow-hidden shrink-0">
                    {m.avatarUrl ? (
                      <img src={getFileUrl(m.avatarUrl)} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                        {m.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-200 truncate">{m.name}</p>
                    <p className="text-[10px] text-zinc-550 font-mono uppercase">{m.role.replace(/_/g, " ")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-[#06b6d4] font-mono">{m.points}</span>
                    <p className="text-[8px] text-zinc-500 uppercase font-mono">XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 Teams */}
          <div className="rounded-2xl border border-white/5 bg-white/2 p-5 space-y-4">
            <h3 className="text-sm font-black font-mono tracking-widest text-[#FF003C] uppercase flex items-center gap-2">
              <Users2 className="w-4.5 h-4.5" /> TOP TEAMS
            </h3>
            <div className="space-y-3">
              {top3Data.teams.map((t: any, idx: number) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 group hover:border-[#FF003C]/30 transition-all">
                  <span className="text-xl shrink-0 font-bold">{MEDALS[idx] || "⭐"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-200 truncate">{t.name}</p>
                    <p className="text-[10px] text-zinc-550 font-mono uppercase truncate">{t.eventTitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-[#FF003C] font-mono">{t.membersCount}</span>
                    <p className="text-[8px] text-zinc-500 uppercase font-mono">MEMBERS</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ Gauge Row — overview stats ═══ */}
      {clubData?.overview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="ck-glass-card p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:100%_3px] pointer-events-none" />
          <div className="ck-section-header">
            <Activity className="w-5 h-5 text-violet-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-300">CORE METRICS TELEMETRY</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-8 justify-items-center relative z-10">
            {Object.entries(clubData.overview).map(([key, value], i) => {
              const meta = STAT_META[key] || { label: key, icon: <Zap className="w-4 h-4" />, color: "#06b6d4" };
              return (
                <motion.div key={key} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
                  <CircleGauge value={Number(value)} max={maxStat} label={meta.label} color={meta.color} icon={meta.icon} />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ═══ Event-Wise Analysis Section (Interactive Table & Trends) ═══ */}
      {isCoordinator && eventsAnalysis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ck-glass-card p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 gap-3">
            <div className="ck-section-header mb-0 pb-0 border-b-0">
              <BarChart3 className="w-5 h-5 text-[#CCFF00]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-300">EVENT PERFORMANCE METRICS</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-550" />
                <input
                  type="text"
                  placeholder="Filter events..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-9 py-1.5 text-xs text-zinc-200 outline-none focus:border-[#CCFF00]/50 font-mono w-48 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="ck-table-wrapper border border-white/5 bg-black/20">
            <table className="ck-table ck-table-responsive">
              <thead>
                <tr>
                  <th className="sortable text-xs font-mono" onClick={() => handleSort("title")}>
                    EVENT NAME {eventSortField === "title" ? (eventSortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="sortable text-xs font-mono text-center" onClick={() => handleSort("registrationsCount")}>
                    REGISTRATIONS {eventSortField === "registrationsCount" ? (eventSortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="sortable text-xs font-mono text-center" onClick={() => handleSort("attendanceRate")}>
                    ATTENDANCE RATE {eventSortField === "attendanceRate" ? (eventSortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="sortable text-xs font-mono text-center" onClick={() => handleSort("capacityUtilization")}>
                    CAPACITY UTIL {eventSortField === "capacityUtilization" ? (eventSortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="sortable text-xs font-mono text-center" onClick={() => handleSort("teamCount")}>
                    TEAMS {eventSortField === "teamCount" ? (eventSortOrder === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="text-xs font-mono text-center">REG TREND</th>
                </tr>
              </thead>
              <tbody>
                {sortedEvents.map(ev => {
                  let capColor = "text-zinc-500 bg-zinc-950/20 border-zinc-900";
                  if (ev.capacityUtilization >= 80) capColor = "text-red-400 bg-red-950/10 border-red-500/20";
                  else if (ev.capacityUtilization >= 50) capColor = "text-amber-400 bg-amber-950/10 border-amber-500/20";
                  else if (ev.capacityUtilization > 0) capColor = "text-lime-400 bg-lime-950/10 border-lime-500/20";

                  return (
                    <tr key={ev.id} className="hover:bg-white/2 transition-colors">
                      <td className="font-bold text-zinc-100 max-w-[200px] truncate">{ev.title}</td>
                      <td className="text-center font-mono font-bold text-zinc-200">{ev.registrationsCount}</td>
                      <td className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono text-xs text-green-400 font-bold">{ev.attendanceRate}%</span>
                          <div className="w-20 h-1 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${ev.attendanceRate}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-mono font-bold ${capColor}`}>
                          {ev.capacityUtilization}%
                        </span>
                      </td>
                      <td className="text-center font-mono font-bold text-zinc-300">{ev.teamCount}</td>
                      <td className="flex justify-center py-2">
                        <Sparkline data={ev.registrationTrend} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ═══ Coordinator Activity Section ═══ */}
      {isCoordinator && coordinatorActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="ck-glass-card p-6"
        >
          <div className="ck-section-header">
            <Radio className="w-5 h-5 text-[#06b6d4]" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-300">COORDINATOR OPERATIONS MATRIX</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {coordinatorActivity.map(c => {
              const score = c.eventsCreated * 15 + c.approvalsProcessed * 5 + c.pointsAwardedCount * 3 + c.attendanceMarked * 2;
              return (
                <div key={c.id} className="rounded-xl border border-white/5 bg-white/1 p-4 flex flex-col justify-between hover:border-[#06b6d4]/30 hover:bg-white/2 transition-all">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                      {c.avatarUrl ? (
                        <img src={getFileUrl(c.avatarUrl)} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center font-bold text-sm text-zinc-400">
                          {c.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-100 truncate">{c.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase">{c.role.replace(/_/g, " ")}</p>
                    </div>
                    <div className="ml-auto text-right font-mono shrink-0">
                      <span className="text-[10px] text-zinc-550 uppercase tracking-widest">ACTIVITY</span>
                      <p className="text-sm font-black text-[#06b6d4]">{score}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div className="p-2 rounded-lg bg-black/30 border border-white/2">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">EVENTS</span>
                      <span className="text-sm font-black font-mono text-zinc-200">{c.eventsCreated}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30 border border-white/2">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">DECISIONS</span>
                      <span className="text-sm font-black font-mono text-zinc-200">{c.approvalsProcessed}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30 border border-white/2">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">XP ISSUED</span>
                      <span className="text-sm font-black font-mono text-zinc-200">{c.pointsAwardedCount}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30 border border-white/2">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider block font-mono">CHECK-INS</span>
                      <span className="text-sm font-black font-mono text-zinc-200">{c.attendanceMarked}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ═══ Double Column Layout (Approvals & Roles) ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {clubData?.approvalStats && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="ck-glass-card p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/[0.03] rounded-full blur-3xl" />
            <div className="ck-section-header">
              <ClipboardList className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-300">APPROVAL PIPELINE STATE</h2>
            </div>
            <div className="space-y-4 relative z-10">
              {clubData.approvalStats.map((s: any, i: number) => {
                const total = clubData.approvalStats.reduce((sum: number, a: any) => sum + a.count, 0) || 1;
                const colorMap: Record<string, string> = {
                  APPROVED: "#10b981", REJECTED: "#ef4444", PENDING: "#f59e0b", UNDER_REVIEW: "#06b6d4"
                };
                return (
                  <AnimatedBar key={s.status} label={s.status} count={s.count} total={total}
                    color={colorMap[s.status] || "#7c3aed"} delay={i * 0.1} />
                );
              })}
            </div>
          </motion.div>
        )}

        {clubData?.roleDistribution && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="ck-glass-card p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/[0.03] rounded-full blur-3xl" />
            <div className="ck-section-header">
              <Users className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-300">OPERATIVE ROLES</h2>
            </div>
            <div className="space-y-4 relative z-10">
              {clubData.roleDistribution.map((r: any, i: number) => {
                const total = clubData.roleDistribution.reduce((sum: number, a: any) => sum + a.count, 0) || 1;
                return (
                  <AnimatedBar key={r.role} label={r.role} count={r.count} total={total}
                    color={ROLE_COLORS[r.role] || "#7c3aed"} delay={i * 0.1} />
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* ═══ Recent Events ═══ */}
      {clubData?.recentEvents && clubData.recentEvents.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="ck-glass-card p-6 relative overflow-hidden"
        >
          <div className="ck-section-header">
            <Target className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-300">RECENT EVENTS ACTIVITY</h2>
          </div>
          <div className="space-y-2.5 relative z-10">
            {clubData.recentEvents.map((ev: any, i: number) => (
              <motion.div key={ev.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className="flex items-center gap-3.5 p-3.5 rounded-xl border border-white/[0.04] hover:border-emerald-500/20 bg-white/[0.02] hover:bg-emerald-950/[0.06] transition-all group"
              >
                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-400 to-cyan-500 shrink-0 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-200 truncate group-hover:text-emerald-400 transition-colors">{ev.title}</p>
                  <p className="text-[11px] text-zinc-500 font-mono">{new Date(ev.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black font-mono text-emerald-400">{ev._count?.registrations || 0}</p>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest">REGS</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══ System Status Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "API STATUS", value: "ONLINE", color: "#10b981", icon: <Cpu className="w-3.5 h-3.5" /> },
          { label: "DATABASE", value: "SYNCED", color: "#06b6d4", icon: <Shield className="w-3.5 h-3.5" /> },
          { label: "ANALYTICS", value: "ACTIVE", color: "#7c3aed", icon: <Activity className="w-3.5 h-3.5" /> },
          { label: "SECURITY", value: "NOMINAL", color: "#22d3ee", icon: <Radio className="w-3.5 h-3.5" /> },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.08 }}
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm hover:border-white/[0.08] transition-all"
          >
            <span style={{ color: s.color }}>{s.icon}</span>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-zinc-500">{s.label}</p>
              <p className="text-[11px] font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
            </div>
            <motion.div
              className="ml-auto w-1.5 h-1.5 rounded-full"
              style={{ background: s.color }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, SERVER_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  FileCheck,
  Award,
  TrendingUp,
  ClipboardList,
  Clock,
  ArrowUpRight,
  UserCheck,
  UsersRound,
  Activity,
  ChevronRight,
  Star,
  Zap,
  Sparkles,
  Shield,
  ArrowRight,
  MapPin,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  Database
} from "lucide-react";

interface ClubAnalytics {
  overview: Record<string, number>;
  roleDistribution: { role: string; count: number }[];
  recentEvents: { id: string; title: string; startDate: string; _count: { registrations: number } }[];
  approvalStats: { status: string; count: number }[];
}

interface AttendanceRecord {
  id: string;
  timestamp: string;
  user: { name: string };
  event: { title: string };
}

interface OpsData {
  pendingApprovals: number;
  pendingUsers: number;
  upcomingEvents: { id: string; title: string; startDate: string; _count: { registrations: number; attendance: number } }[];
  recentAttendance: AttendanceRecord[];
}

interface MemberHistory {
  totalPoints: number;
  eventParticipation: number;
  badges: { id: string; badge: { name: string; icon: string; description?: string } }[];
  points: { id: string; category: string; reason?: string; points: number; createdAt: string; giver?: { name: string } }[];
}

interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  eventType: string;
  venue?: string;
  posterUrl?: string;
  description?: string;
  maxCapacity?: number;
  _count: { registrations: number };
}

// ── Trend / stat helpers ──
const STAT_ICONS: Record<string, React.ReactNode> = {
  totalUsers: <Users className="w-6 h-6" />,
  totalEvents: <Calendar className="w-6 h-6" />,
  totalCertificates: <FileCheck className="w-6 h-6" />,
  totalApprovals: <ClipboardList className="w-6 h-6" />,
  totalRegistrations: <Award className="w-6 h-6" />,
  totalTeams: <UsersRound className="w-6 h-6" />,
  totalPoints: <TrendingUp className="w-6 h-6" />,
  totalBadges: <Award className="w-6 h-6" />,
};

const STAT_COLORS = [
  "from-red-600 to-rose-500",
  "from-orange-600 to-amber-500",
  "from-emerald-600 to-teal-500",
  "from-cyan-600 to-blue-500",
  "from-indigo-600 to-violet-500",
  "from-fuchsia-600 to-pink-500",
  "from-red-800 to-red-600",
  "from-zinc-700 to-zinc-500"
];

const STAT_LABELS: Record<string, string> = {
  totalUsers: "Total Members",
  totalEvents: "Events Created",
  totalRegistrations: "Registrations",
  totalCertificates: "Certificates",
  totalApprovals: "Approval Requests",
  totalTeams: "Teams",
  totalPoints: "Total Points",
  totalBadges: "Badges Awarded",
};

// Mock trend percentages for each stat key
const STAT_TRENDS: Record<string, { value: number; direction: "up" | "down" | "neutral" }> = {
  totalUsers: { value: 12, direction: "up" },
  totalEvents: { value: 8, direction: "up" },
  totalRegistrations: { value: 24, direction: "up" },
  totalCertificates: { value: 5, direction: "up" },
  totalApprovals: { value: 3, direction: "down" },
  totalTeams: { value: 0, direction: "neutral" },
  totalPoints: { value: 18, direction: "up" },
  totalBadges: { value: 15, direction: "up" },
};

// ── Mock data for data table ──
interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "pending";
  joinedDate: string;
  points: number;
}

const MOCK_MEMBERS: MemberRow[] = [
  { id: "CK-001", name: "Aarav Sharma", email: "aarav.s@university.edu", role: "Tech", status: "active", joinedDate: "2025-01-15", points: 340 },
  { id: "CK-002", name: "Priya Patel", email: "priya.p@university.edu", role: "Content", status: "active", joinedDate: "2025-02-03", points: 285 },
  { id: "CK-003", name: "Rohan Gupta", email: "rohan.g@university.edu", role: "Member", status: "active", joinedDate: "2025-01-22", points: 192 },
  { id: "CK-004", name: "Ananya Iyer", email: "ananya.i@university.edu", role: "Social Media", status: "active", joinedDate: "2025-03-11", points: 420 },
  { id: "CK-005", name: "Vikram Singh", email: "vikram.s@university.edu", role: "Tech", status: "inactive", joinedDate: "2024-11-05", points: 88 },
  { id: "CK-006", name: "Neha Reddy", email: "neha.r@university.edu", role: "Member", status: "active", joinedDate: "2025-04-19", points: 156 },
  { id: "CK-007", name: "Arjun Mehta", email: "arjun.m@university.edu", role: "Tech", status: "active", joinedDate: "2025-02-28", points: 310 },
  { id: "CK-008", name: "Kavya Nair", email: "kavya.n@university.edu", role: "Content", status: "pending", joinedDate: "2025-05-01", points: 45 },
  { id: "CK-009", name: "Aditya Kumar", email: "aditya.k@university.edu", role: "Member", status: "active", joinedDate: "2025-01-08", points: 201 },
  { id: "CK-010", name: "Ishita Joshi", email: "ishita.j@university.edu", role: "Social Media", status: "active", joinedDate: "2025-03-25", points: 378 },
  { id: "CK-011", name: "Siddharth Rao", email: "sid.r@university.edu", role: "Tech", status: "active", joinedDate: "2025-02-14", points: 267 },
  { id: "CK-012", name: "Meera Desai", email: "meera.d@university.edu", role: "Member", status: "inactive", joinedDate: "2024-12-20", points: 73 },
  { id: "CK-013", name: "Karthik Venkat", email: "karthik.v@university.edu", role: "Tech", status: "active", joinedDate: "2025-04-02", points: 189 },
  { id: "CK-014", name: "Shreya Ghosh", email: "shreya.g@university.edu", role: "Content", status: "active", joinedDate: "2025-01-30", points: 312 },
  { id: "CK-015", name: "Rahul Pandey", email: "rahul.p@university.edu", role: "Member", status: "pending", joinedDate: "2025-05-10", points: 22 },
  { id: "CK-016", name: "Divya Saxena", email: "divya.s@university.edu", role: "Social Media", status: "active", joinedDate: "2025-03-05", points: 245 },
  { id: "CK-017", name: "Harsh Agarwal", email: "harsh.a@university.edu", role: "Tech", status: "active", joinedDate: "2025-02-18", points: 398 },
  { id: "CK-018", name: "Pooja Mishra", email: "pooja.m@university.edu", role: "Member", status: "active", joinedDate: "2025-04-12", points: 134 },
  { id: "CK-019", name: "Nikhil Jain", email: "nikhil.j@university.edu", role: "Content", status: "inactive", joinedDate: "2024-10-15", points: 56 },
  { id: "CK-020", name: "Riya Kapoor", email: "riya.k@university.edu", role: "Member", status: "active", joinedDate: "2025-05-22", points: 167 },
  { id: "CK-021", name: "Arun Nath", email: "arun.n@university.edu", role: "Tech", status: "active", joinedDate: "2025-01-05", points: 450 },
  { id: "CK-022", name: "Tanvi Bhatt", email: "tanvi.b@university.edu", role: "Social Media", status: "pending", joinedDate: "2025-05-28", points: 10 },
  { id: "CK-023", name: "Manish Dubey", email: "manish.d@university.edu", role: "Member", status: "active", joinedDate: "2025-03-18", points: 223 },
  { id: "CK-024", name: "Swati Verma", email: "swati.v@university.edu", role: "Content", status: "active", joinedDate: "2025-02-09", points: 291 },
  { id: "CK-025", name: "Deepak Tiwari", email: "deepak.t@university.edu", role: "Tech", status: "active", joinedDate: "2025-04-28", points: 176 },
];

type SortKey = keyof MemberRow;
type SortDir = "asc" | "desc";

const ROWS_PER_PAGE = 8;

export default function DashboardPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [clubData, setClubData] = useState<ClubAnalytics | null>(null);
  const [opsData, setOpsData] = useState<OpsData | null>(null);
  const [memberHistory, setMemberHistory] = useState<MemberHistory | null>(null);
  const [memberEvents, setMemberEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Welcome back");
  const [livePulse, setLivePulse] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ── Data table state ──
  const [tableSearch, setTableSearch] = useState("");
  const [tableRoleFilter, setTableRoleFilter] = useState("all");
  const [tableSortKey, setTableSortKey] = useState<SortKey>("id");
  const [tableSortDir, setTableSortDir] = useState<SortDir>("asc");
  const [tablePage, setTablePage] = useState(1);

  // Time greeting inside useEffect to prevent hydration mismatches
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting("Good morning");
    else if (hr < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Blinking green dot effect to simulate active scanning feed updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePulse((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!token || !user) return;
    const load = async () => {
      try {
        if (["FACULTY", "STUDENT_COORDINATOR"].includes(user.role)) {
          const [clubRes, opsRes] = await Promise.all([
            api<ClubAnalytics>("/analytics/club", { token }).catch((err) => {
              console.error("Club analytics error:", err);
              return null;
            }),
            api<OpsData>("/analytics/operations", { token }).catch((err) => {
              console.error("Ops analytics error:", err);
              return null;
            })
          ]);
          if (clubRes) setClubData(clubRes);
          if (opsRes) setOpsData(opsRes);
        } else {
          // Fetch personal stats for regular member
          const [historyRes, eventsRes] = await Promise.all([
            api<MemberHistory>(`/appreciation/user/${user.id}/history`, { token }).catch((err) => {
              console.error("Appreciation history error:", err);
              return null;
            }),
            api<{ events: PublicEvent[] }>("/events", { token }).catch((err) => {
              console.error("Events list error:", err);
              return null;
            })
          ]);
          if (historyRes) setMemberHistory(historyRes);
          if (eventsRes && eventsRes.events) {
            // Only keep upcoming/active events
            const upcoming = eventsRes.events.filter(
              (e) => new Date(e.startDate) >= new Date()
            );
            setMemberEvents(upcoming);
          }
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, user]);

  // ── Data table logic ──
  const filteredMembers = useMemo(() => {
    let data = [...MOCK_MEMBERS];

    // Search
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      data = data.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q)
      );
    }

    // Role filter
    if (tableRoleFilter !== "all") {
      data = data.filter((m) => m.role.toLowerCase() === tableRoleFilter.toLowerCase());
    }

    // Sort
    data.sort((a, b) => {
      const aVal = a[tableSortKey];
      const bVal = b[tableSortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return tableSortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return tableSortDir === "asc" ? -1 : 1;
      if (aStr > bStr) return tableSortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [tableSearch, tableRoleFilter, tableSortKey, tableSortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / ROWS_PER_PAGE));
  const paginatedMembers = filteredMembers.slice((tablePage - 1) * ROWS_PER_PAGE, tablePage * ROWS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setTablePage(1);
  }, [tableSearch, tableRoleFilter]);

  const handleSort = (key: SortKey) => {
    if (tableSortKey === key) {
      setTableSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setTableSortKey(key);
      setTableSortDir("asc");
    }
  };

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (tableSortKey !== colKey) return <ChevronsUpDown className="w-3 h-3 sort-icon" />;
    return tableSortDir === "asc"
      ? <ChevronUp className="w-3 h-3 sort-icon" />
      : <ChevronDown className="w-3 h-3 sort-icon" />;
  };

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleQuickRegister = async (eventId: string, eventTitle: string) => {
    if (!token) return;
    setRegisteringId(eventId);
    try {
      await api(`/events/${eventId}/register`, { method: "POST", token });
      showNotification(`Successfully registered for ${eventTitle}! 🎉`);
      // Update registration status local state
      setMemberEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, _count: { registrations: e._count.registrations + 1 } }
            : e
        )
      );
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Failed to register.", "error");
    } finally {
      setRegisteringId(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  } as const;
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } }
  } as const;

  // Helper to format date beautifully
  const formatDateBadge = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    return { day, month };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(220,38,38,0.3)]" />
        <p className="text-xs uppercase tracking-widest font-mono text-[var(--ck-text-secondary)]">Initializing Operative Interface...</p>
      </div>
    );
  }

  const isCoordinator = ["FACULTY", "STUDENT_COORDINATOR"].includes(user?.role || "");

  return (
    <div className="space-y-6">
      {/* Toast Alert Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg font-mono text-xs uppercase tracking-wider ${
              notification.type === "success"
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                : "bg-red-950/80 border-red-500 text-red-300"
            }`}
          >
            <Activity className="w-4 h-4 animate-pulse" />
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cybernetic Greeting Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-red-950 bg-gradient-to-r from-red-950/20 via-black to-zinc-950 p-4 sm:p-6 lg:p-8 shadow-[0_4px_20px_-2px_rgba(220,38,38,0.1)]">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-radial-gradient from-red-600/5 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-mono text-red-500 mb-2">
              <span className={`inline-block w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] ${livePulse ? "opacity-100" : "opacity-40"} transition-opacity duration-300`} />
              SYSTEM STATUS: ACTIVE // DEPLOYED
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-500 to-amber-400">{user?.name?.split(" ")[0]}</span> 👋
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[var(--ck-text-secondary)]">
              Welcome back to your CyberKavach portal. Managed clearances: <span className="font-semibold uppercase text-white font-mono">{user?.role?.replace(/_/g, " ")}</span>.
            </p>
          </div>
          <div className="border border-red-900/30 rounded-xl bg-black/40 p-3 flex flex-col justify-center min-w-[130px] font-mono text-center shrink-0 self-start sm:self-auto">
            <span className="text-[10px] uppercase text-[var(--ck-text-muted)] tracking-wider">Operative Date</span>
            <span className="text-sm font-bold text-white mt-0.5">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <span className="text-[10px] text-red-400 mt-0.5 uppercase tracking-widest font-semibold">{new Date().toLocaleDateString("en-US", { weekday: "long" })}</span>
          </div>
        </div>
      </div>

      {isCoordinator ? (
        /* ==================== COORDINATOR / FACULTY DASHBOARD ==================== */
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          {/* Stats Grid — responsive card grid with trend indicators */}
          {clubData?.overview && (
            <motion.div variants={itemVariants} className="ck-cards-grid">
              {Object.entries(clubData.overview).map(([key, value], i) => {
                const trend = STAT_TRENDS[key] || { value: 0, direction: "neutral" as const };
                return (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    className="ck-card p-4 sm:p-5 group cursor-default relative overflow-hidden bg-black/40 border-red-950/40 hover:border-red-500/40 transition-all duration-300"
                  >
                    <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-red-600/5 group-hover:bg-red-600/10 transition-colors pointer-events-none" />
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${STAT_COLORS[i % STAT_COLORS.length]} flex items-center justify-center text-white shadow-[0_0_12px_rgba(0,0,0,0.5)]`}>
                        {STAT_ICONS[key] || <TrendingUp className="w-5 h-5" />}
                      </div>
                      <span className={`ck-trend ck-trend-${trend.direction}`}>
                        {trend.direction === "up" && "↑"}
                        {trend.direction === "down" && "↓"}
                        {trend.direction === "neutral" && "—"}
                        {trend.value > 0 ? ` ${trend.value}%` : ""}
                      </span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tighter">
                      {String(value).padStart(2, "0")}
                    </p>
                    <p className="text-[10px] mt-1.5 uppercase font-mono font-bold tracking-widest text-[var(--ck-text-secondary)]">
                      {STAT_LABELS[key] || key}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Upcoming Events & Live Scanner log */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming Events */}
              {opsData && (
                <motion.div variants={itemVariants} className="ck-card p-4 sm:p-6 bg-black/30 border-red-950/30">
                  <div className="flex items-center justify-between mb-5 border-b border-red-900/10 pb-3">
                    <h2 className="text-sm sm:text-base font-bold flex items-center gap-2 uppercase tracking-tight text-white font-mono">
                      <Calendar className="w-4 h-4 text-cyan-400 animate-pulse" /> Upcoming events
                    </h2>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                      {opsData.upcomingEvents.length} Active
                    </span>
                  </div>

                  {opsData.upcomingEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-8 h-8 text-[var(--ck-text-muted)] mx-auto mb-2 opacity-40" />
                      <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)]">No upcoming cyber operations</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {opsData.upcomingEvents.slice(0, 5).map((event) => {
                        const { day, month } = formatDateBadge(event.startDate);
                        return (
                          <div
                            key={event.id}
                            onClick={() => router.push(`/dashboard/events/${event.id}`)}
                            className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-red-900/20 bg-black/40 hover:bg-zinc-950/60 transition duration-300 group cursor-pointer"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-zinc-900 flex flex-col items-center justify-center shrink-0 border border-zinc-800 font-mono">
                                <span className="text-xs text-red-500 font-bold leading-none">{day}</span>
                                <span className="text-[9px] text-[var(--ck-text-muted)] mt-0.5 leading-none">{month}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors truncate">{event.title}</p>
                                <p className="text-xs flex items-center gap-1.5 text-[var(--ck-text-muted)] mt-0.5">
                                  <Clock className="w-3 h-3 text-red-500/70 shrink-0" />
                                  {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                              <div className="flex flex-col items-end">
                                <span className="ck-badge ck-badge-primary text-[10px] px-2 py-0.5">{event._count.registrations} REG</span>
                                {event._count.attendance > 0 && (
                                  <span className="text-[9px] font-mono text-emerald-400 mt-0.5">{event._count.attendance} ATTENDED</span>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-[var(--ck-text-muted)] group-hover:text-white transition-colors hidden sm:block" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Live Scan Activity Feed */}
              {opsData && (
                <motion.div variants={itemVariants} className="ck-card p-4 sm:p-6 bg-black/30 border-red-950/30">
                  <div className="flex items-center justify-between mb-5 border-b border-red-900/10 pb-3">
                    <h2 className="text-sm sm:text-base font-bold flex items-center gap-2 uppercase tracking-tight text-white font-mono">
                      <Activity className="w-4 h-4 text-emerald-400" /> LIVE ATTENDANCE STREAM
                    </h2>
                    <span className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      MONITORING
                    </span>
                  </div>

                  {!opsData.recentAttendance || opsData.recentAttendance.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-8 h-8 text-[var(--ck-text-muted)] mx-auto mb-2 opacity-40" />
                      <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)]">Waiting for incoming scans...</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                      {opsData.recentAttendance.slice(0, 8).map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-zinc-900/40 bg-zinc-950/40 text-xs font-mono gap-2"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] shrink-0" />
                            <div className="min-w-0">
                              <span className="text-white font-semibold">{record.user.name}</span>
                              <span className="text-[var(--ck-text-muted)] mx-1 hidden sm:inline">checked in to</span>
                              <span className="text-[var(--ck-text-muted)] mx-1 sm:hidden"> → </span>
                              <span className="text-red-400">{record.event.title}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-[var(--ck-text-secondary)] shrink-0">
                            {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Right: Pending Actions & Team Distribution */}
            <div className="space-y-6">
              {/* Quick Actions / Pending Box */}
              {opsData && (
                <motion.div variants={itemVariants} className="ck-card p-4 sm:p-6 bg-black/30 border-red-950/30">
                  <h2 className="text-sm sm:text-base font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-white font-mono border-b border-red-900/10 pb-3">
                    <ClipboardList className="w-4 h-4 text-amber-500" /> Pending Actions
                  </h2>
                  <div className="space-y-3">
                    {/* Action 1: Pending Approvals */}
                    <div
                      onClick={() => router.push("/dashboard/approvals")}
                      className="group flex items-center gap-4 p-3 sm:p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-amber-500/30 cursor-pointer hover:bg-black/60 transition duration-300"
                    >
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-base font-extrabold shadow-lg shadow-amber-950/30">
                          {opsData.pendingApprovals}
                        </div>
                        {opsData.pendingApprovals > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">Pending Approvals</p>
                        <p className="text-[11px] text-[var(--ck-text-muted)] mt-0.5">Click to audit request logs</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[var(--ck-text-muted)] group-hover:text-white transform group-hover:translate-x-1 transition-all shrink-0" />
                    </div>

                    {/* Action 2: Pending Registration approvals */}
                    <div
                      onClick={() => router.push("/dashboard/users")}
                      className="group flex items-center gap-4 p-3 sm:p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-rose-500/30 cursor-pointer hover:bg-black/60 transition duration-300"
                    >
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center text-white text-base font-extrabold shadow-lg shadow-rose-950/30">
                          {opsData.pendingUsers}
                        </div>
                        {opsData.pendingUsers > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">User Registrations</p>
                        <p className="text-[11px] text-[var(--ck-text-muted)] mt-0.5">Approve new access permissions</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[var(--ck-text-muted)] group-hover:text-white transform group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Team Distribution */}
              {clubData && (
                <motion.div variants={itemVariants} className="ck-card p-4 sm:p-6 bg-black/30 border-red-950/30">
                  <h2 className="text-sm sm:text-base font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-white font-mono border-b border-red-900/10 pb-3">
                    <Users className="w-4 h-4 text-rose-500" /> Team Distribution
                  </h2>
                  <div className="space-y-4">
                    {clubData.roleDistribution.map((r) => {
                      const total = clubData.overview.totalUsers || 1;
                      const pct = Math.round((r.count / total) * 100);
                      return (
                        <div key={r.role}>
                          <div className="flex justify-between text-xs font-mono mb-1.5">
                            <span className="text-[var(--ck-text-secondary)] font-semibold uppercase">{r.role.replace(/_/g, " ")}</span>
                            <span className="text-white font-bold">{r.count} <span className="text-[var(--ck-text-muted)]">({pct}%)</span></span>
                          </div>
                          <div className="h-2.5 rounded-full overflow-hidden bg-zinc-950 border border-zinc-900">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className="h-full rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shadow-[0_0_8px_rgba(220,38,38,0.3)]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ==================== DATA TABLE SECTION ==================== */}
          <motion.div variants={itemVariants} className="ck-card p-4 sm:p-6 bg-black/30 border-red-950/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 border-b border-red-900/10 pb-3 gap-2">
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-2 uppercase tracking-tight text-white font-mono">
                <Database className="w-4 h-4 text-violet-400" /> Member Directory
              </h2>
              <span className="text-[10px] font-mono text-violet-400 bg-violet-950/40 border border-violet-800/40 px-2 py-0.5 rounded self-start sm:self-auto">
                {filteredMembers.length} Records
              </span>
            </div>

            {/* Search & Filter Bar */}
            <div className="ck-filter-bar mb-4">
              <div className="ck-search-container flex-1" style={{ minWidth: "200px" }}>
                <Search className="w-4 h-4 text-red-500/60 absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name, email, ID..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="ck-input ck-search-input"
                  id="member-search"
                />
              </div>
              <select
                value={tableRoleFilter}
                onChange={(e) => setTableRoleFilter(e.target.value)}
                className="ck-filter-select"
                id="role-filter"
              >
                <option value="all">All Roles</option>
                <option value="Tech">Tech</option>
                <option value="Content">Content</option>
                <option value="Social Media">Social Media</option>
                <option value="Member">Member</option>
              </select>
            </div>

            {/* Data Table */}
            <div className="ck-table-wrapper">
              <table className="ck-table ck-table-responsive" id="member-table">
                <thead>
                  <tr>
                    <th className={`sortable ${tableSortKey === "id" ? "sort-active" : ""}`} onClick={() => handleSort("id")}>
                      ID <SortIcon colKey="id" />
                    </th>
                    <th className={`sortable ${tableSortKey === "name" ? "sort-active" : ""}`} onClick={() => handleSort("name")}>
                      Name <SortIcon colKey="name" />
                    </th>
                    <th className={`sortable ${tableSortKey === "email" ? "sort-active" : ""}`} onClick={() => handleSort("email")}>
                      Email <SortIcon colKey="email" />
                    </th>
                    <th className={`sortable ${tableSortKey === "role" ? "sort-active" : ""}`} onClick={() => handleSort("role")}>
                      Role <SortIcon colKey="role" />
                    </th>
                    <th className={`sortable ${tableSortKey === "status" ? "sort-active" : ""}`} onClick={() => handleSort("status")}>
                      Status <SortIcon colKey="status" />
                    </th>
                    <th className={`sortable ${tableSortKey === "points" ? "sort-active" : ""}`} onClick={() => handleSort("points")}>
                      Points <SortIcon colKey="points" />
                    </th>
                    <th className={`sortable ${tableSortKey === "joinedDate" ? "sort-active" : ""}`} onClick={() => handleSort("joinedDate")}>
                      Joined <SortIcon colKey="joinedDate" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-6 h-6 text-[var(--ck-text-muted)] opacity-40" />
                          <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)]">No matching records found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((member) => (
                      <tr key={member.id}>
                        <td data-label="ID">
                          <span className="font-mono font-bold text-[var(--ck-primary-light)] text-xs">{member.id}</span>
                        </td>
                        <td data-label="Name">
                          <span className="font-semibold text-white">{member.name}</span>
                        </td>
                        <td data-label="Email">
                          <span className="text-[var(--ck-text-secondary)] text-xs sm:text-sm">{member.email}</span>
                        </td>
                        <td data-label="Role">
                          <span className="ck-badge ck-badge-info text-[10px]">{member.role}</span>
                        </td>
                        <td data-label="Status">
                          <span className={`ck-status ck-status-${member.status}`}>{member.status}</span>
                        </td>
                        <td data-label="Points">
                          <span className="font-mono font-bold text-white text-sm">{member.points}</span>
                        </td>
                        <td data-label="Joined">
                          <span className="text-[var(--ck-text-muted)] text-xs font-mono">{formatDate(member.joinedDate)}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredMembers.length > 0 && (
              <div className="ck-pagination mt-4">
                <span className="ck-pagination-info">
                  Showing {(tablePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(tablePage * ROWS_PER_PAGE, filteredMembers.length)} of {filteredMembers.length}
                </span>
                <div className="ck-pagination-controls">
                  <button
                    className="ck-page-btn"
                    disabled={tablePage <= 1}
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`ck-page-btn ${tablePage === page ? "active" : ""}`}
                      onClick={() => setTablePage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    className="ck-page-btn"
                    disabled={tablePage >= totalPages}
                    onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : (
        /* ==================== STANDARD MEMBER DASHBOARD ==================== */
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
          {/* Member Personal Stats */}
          <motion.div variants={itemVariants} className="ck-cards-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
            <div className="ck-card p-4 sm:p-5 bg-gradient-to-br from-zinc-950 to-black border-red-950/20 hover:border-red-500/30 transition duration-300 flex items-center gap-4 relative overflow-hidden group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                <Star className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tighter">
                  {memberHistory?.totalPoints ?? 0}
                </p>
                <p className="text-[10px] uppercase font-mono tracking-widest text-[var(--ck-text-secondary)] font-bold">Contribution Points</p>
              </div>
              <Sparkles className="w-4 h-4 text-amber-500/30 absolute right-4 top-4 group-hover:scale-125 transition-transform" />
            </div>

            <div className="ck-card p-4 sm:p-5 bg-gradient-to-br from-zinc-950 to-black border-red-950/20 hover:border-red-500/30 transition duration-300 flex items-center gap-4 relative overflow-hidden group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                <Award className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tighter">
                  {memberHistory?.badges?.length ?? 0}
                </p>
                <p className="text-[10px] uppercase font-mono tracking-widest text-[var(--ck-text-secondary)] font-bold">Badges Earned</p>
              </div>
              <Shield className="w-4 h-4 text-violet-500/30 absolute right-4 top-4 group-hover:scale-125 transition-transform" />
            </div>

            <div className="ck-card p-4 sm:p-5 bg-gradient-to-br from-zinc-950 to-black border-red-950/20 hover:border-red-500/30 transition duration-300 flex items-center gap-4 relative overflow-hidden group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tighter">
                  {memberHistory?.eventParticipation ?? 0}
                </p>
                <p className="text-[10px] uppercase font-mono tracking-widest text-[var(--ck-text-secondary)] font-bold">Events Participated</p>
              </div>
              <Activity className="w-4 h-4 text-cyan-500/30 absolute right-4 top-4 group-hover:scale-125 transition-transform" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Upcoming Events */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div variants={itemVariants} className="ck-card p-4 sm:p-6 bg-black/30 border-red-950/30">
                <div className="flex items-center justify-between mb-5 border-b border-red-900/10 pb-3">
                  <h2 className="text-sm sm:text-base font-bold flex items-center gap-2 uppercase tracking-tight text-white font-mono">
                    <Calendar className="w-4 h-4 text-cyan-400" /> Upcoming Cyber Events
                  </h2>
                  <span className="text-[10px] font-mono text-[var(--ck-text-muted)]">Register to participate</span>
                </div>

                {memberEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-8 h-8 text-[var(--ck-text-muted)] mx-auto mb-2 opacity-40" />
                    <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)]">No upcoming events listed</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {memberEvents.map((event) => {
                      const { day, month } = formatDateBadge(event.startDate);
                      return (
                        <motion.div
                          key={event.id}
                          variants={itemVariants}
                          whileHover={{ y: -6, transition: { duration: 0.2 } }}
                          className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/40 overflow-hidden shadow-xl hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] transition-all duration-300 relative group"
                        >
                          {/* Image Poster with Category Badge */}
                          <div className="h-32 sm:h-40 relative overflow-hidden bg-gradient-to-br from-red-950/10 to-black">
                            {event.posterUrl ? (
                              <img
                                src={`${SERVER_BASE_URL}${event.posterUrl}`}
                                alt={event.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-red-950/20 via-zinc-900 to-indigo-950/20 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(18,16,16,0.3)_1px,transparent_1px)] bg-[size:16px_16px] opacity-20" />
                                <Calendar className="w-12 h-12 text-red-900/30" />
                              </div>
                            )}
                            <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider bg-red-950/80 text-red-400 border border-red-900/30 uppercase">
                              {event.eventType.replace(/_/g, " ")}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-red-400 transition-colors line-clamp-1">{event.title}</h3>
                              {event.description && (
                                <p className="text-xs text-[var(--ck-text-muted)] mt-1.5 line-clamp-2 leading-relaxed">{event.description}</p>
                              )}
                              
                              <div className="mt-3 sm:mt-4 space-y-2 font-mono text-[10px] text-[var(--ck-text-secondary)]">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-red-500/60 shrink-0" />
                                  <span>
                                    {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    {" · "}
                                    {new Date(event.startDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                {event.venue && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-red-500/60 shrink-0" />
                                    <span className="truncate">{event.venue}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <Users className="w-3.5 h-3.5 text-red-500/60 shrink-0" />
                                  <span>
                                    {event._count.registrations} {event.maxCapacity ? `/ ${event.maxCapacity}` : ""} Registered
                                  </span>
                                </div>
                              </div>

                              {/* Capacity bar */}
                              {event.maxCapacity && (
                                <div className="mt-3">
                                  <div className="h-1 rounded-full overflow-hidden bg-black/40 border border-zinc-900">
                                    <div 
                                      className="h-full bg-gradient-to-r from-red-950 to-red-500" 
                                      style={{ width: `${Math.min(100, Math.round((event._count.registrations / event.maxCapacity) * 100))}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => router.push(`/events/${event.slug}`)}
                              className="w-full ck-btn-primary py-2 text-xs mt-4 sm:mt-5 flex items-center justify-center gap-1.5 font-bold font-mono tracking-wider uppercase"
                            >
                              <Zap className="w-3.5 h-3.5" /> Register to Participate
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Point History / Logs */}
              <motion.div variants={itemVariants} className="ck-card p-4 sm:p-6 bg-black/30 border-red-950/30">
                <h2 className="text-sm sm:text-base font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-white font-mono border-b border-red-900/10 pb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Contribution Log
                </h2>

                {!memberHistory?.points || memberHistory.points.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="w-8 h-8 text-[var(--ck-text-muted)] mx-auto mb-2 opacity-40" />
                    <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)]">No point history found</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {memberHistory.points.slice(0, 10).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-zinc-900 bg-zinc-950/40 text-xs font-mono gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-white uppercase">{log.category.replace(/_/g, " ")}</p>
                          {log.reason && <p className="text-[10px] text-[var(--ck-text-secondary)] mt-0.5 truncate">{log.reason}</p>}
                          <p className="text-[9px] text-[var(--ck-text-muted)] mt-0.5">Approved by {log.giver?.name || "System"} · {new Date(log.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded shrink-0 ${log.points >= 0 ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/40" : "bg-red-950/30 text-red-400 border border-red-900/40"}`}>
                          {log.points >= 0 ? `+${log.points}` : log.points} PTS
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right Col: Badges & Quick actions */}
            <div className="space-y-6">
              {/* Badges showcase */}
              <motion.div variants={itemVariants} className="ck-card p-4 sm:p-6 bg-black/30 border-red-950/30">
                <h2 className="text-sm sm:text-base font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-white font-mono border-b border-red-900/10 pb-3">
                  <Award className="w-4 h-4 text-violet-400" /> BADGES VAULT
                </h2>

                {!memberHistory?.badges || memberHistory.badges.length === 0 ? (
                  <div className="text-center py-6">
                    <Award className="w-8 h-8 text-[var(--ck-text-muted)] mx-auto mb-2 opacity-40" />
                    <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)]">No badges unlocked yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {memberHistory.badges.map((b) => (
                      <div
                        key={b.id}
                        title={b.badge.description || b.badge.name}
                        className="p-3 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:border-violet-500/20 text-center transition duration-300 cursor-help"
                      >
                        <span className="text-2xl drop-shadow-[0_0_6px_rgba(139,92,246,0.3)]">{b.badge.icon}</span>
                        <p className="text-[10px] font-mono font-bold mt-1 text-[var(--ck-text-secondary)] truncate uppercase">{b.badge.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Quick Actions Shortcuts */}
              <motion.div variants={itemVariants} className="ck-card p-4 sm:p-6 bg-black/30 border-red-950/30">
                <h2 className="text-sm sm:text-base font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-white font-mono border-b border-red-900/10 pb-3">
                  <Zap className="w-4 h-4 text-yellow-500" /> QUICK CHANNELS
                </h2>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push("/dashboard/events")}
                    className="w-full ck-btn-secondary text-[11px] py-2 flex items-center justify-between font-mono"
                  >
                    <span>BROWSE ALL EVENTS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => router.push("/dashboard/leaderboard")}
                    className="w-full ck-btn-secondary text-[11px] py-2 flex items-center justify-between font-mono"
                  >
                    <span>LEADERBOARD SCORES</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => router.push("/dashboard/profile")}
                    className="w-full ck-btn-secondary text-[11px] py-2 flex items-center justify-between font-mono"
                  >
                    <span>EDIT OPERATIVE PROFILE</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

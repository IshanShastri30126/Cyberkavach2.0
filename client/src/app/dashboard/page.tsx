"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Users, Calendar, FileCheck, Award, TrendingUp, ClipboardList, Clock, ArrowUpRight, UserCheck, UsersRound } from "lucide-react";

interface ClubAnalytics {
  overview: Record<string, number>;
  roleDistribution: { role: string; count: number }[];
  recentEvents: { id: string; title: string; startDate: string; _count: { registrations: number } }[];
  approvalStats: { status: string; count: number }[];
}

interface OpsData {
  pendingApprovals: number;
  pendingUsers: number;
  upcomingEvents: { id: string; title: string; startDate: string; _count: { registrations: number; attendance: number } }[];
}

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

const STAT_COLORS = ["from-indigo-500 to-purple-500", "from-cyan-500 to-blue-500", "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500", "from-pink-500 to-rose-500", "from-violet-500 to-indigo-500", "from-teal-500 to-cyan-500", "from-orange-500 to-red-500"];

const STAT_LABELS: Record<string, string> = {
  totalUsers: "Total Members", totalEvents: "Events Created", totalRegistrations: "Registrations",
  totalCertificates: "Certificates", totalApprovals: "Approval Requests", totalTeams: "Teams",
  totalPoints: "Total Points", totalBadges: "Badges Awarded",
};

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [clubData, setClubData] = useState<ClubAnalytics | null>(null);
  const [opsData, setOpsData] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) return;
    const load = async () => {
      try {
        if (user.role === "FACULTY") {
          const data = await api<ClubAnalytics>("/analytics/club", { token });
          setClubData(data);
        }
        if (["FACULTY", "STUDENT_COORDINATOR"].includes(user.role)) {
          const data = await api<OpsData>("/analytics/operations", { token });
          setOpsData(data);
        }
      } catch (err) { console.error("Analytics error:", err); }
      finally { setLoading(false); }
    };
    load();
  }, [token, user]);

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "var(--ck-text)" }}>
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1" style={{ color: "var(--ck-text-secondary)" }}>
          Here&apos;s your CyberKavach operations overview
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          {/* Stats Grid */}
          {clubData && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Object.entries(clubData.overview).map(([key, value], i) => (
                <motion.div key={key} variants={itemVariants} className="ck-card p-5 group cursor-default">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${STAT_COLORS[i % STAT_COLORS.length]} flex items-center justify-center text-white shadow-md`}>
                      {STAT_ICONS[key] || <TrendingUp className="w-5 h-5" />}
                    </div>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "var(--ck-text-muted)" }} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: "var(--ck-text)" }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--ck-text-muted)" }}>{STAT_LABELS[key] || key}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Events */}
            {opsData && (
              <motion.div variants={itemVariants} className="ck-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--ck-text)" }}>
                  <Calendar className="w-5 h-5 text-cyan-500" /> Upcoming Events
                </h2>
                {opsData.upcomingEvents.length === 0 ? (
                  <p className="text-sm py-4" style={{ color: "var(--ck-text-muted)" }}>No upcoming events</p>
                ) : (
                  <div className="space-y-3">
                    {opsData.upcomingEvents.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--ck-bg-secondary)] transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-cyan-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--ck-text)" }}>{event.title}</p>
                            <p className="text-xs" style={{ color: "var(--ck-text-muted)" }}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(event.startDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className="ck-badge ck-badge-primary">{event._count.registrations} reg</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Pending Actions */}
            {opsData && (
              <motion.div variants={itemVariants} className="ck-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--ck-text)" }}>
                  <ClipboardList className="w-5 h-5 text-amber-500" /> Pending Actions
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--ck-bg-secondary)" }}>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {opsData.pendingApprovals}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: "var(--ck-text)" }}>Pending Approvals</p>
                      <p className="text-sm" style={{ color: "var(--ck-text-muted)" }}>Require your attention</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "var(--ck-bg-secondary)" }}>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      {opsData.pendingUsers}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: "var(--ck-text)" }}>Pending User Approvals</p>
                      <p className="text-sm" style={{ color: "var(--ck-text-muted)" }}>New registrations awaiting</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Role Distribution */}
            {clubData && (
              <motion.div variants={itemVariants} className="ck-card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--ck-text)" }}>
                  <Users className="w-5 h-5 text-indigo-500" /> Team Distribution
                </h2>
                <div className="space-y-3">
                  {clubData.roleDistribution.map((r) => {
                    const total = clubData.overview.totalUsers || 1;
                    const pct = Math.round((r.count / total) * 100);
                    return (
                      <div key={r.role}>
                        <div className="flex justify-between text-sm mb-1">
                          <span style={{ color: "var(--ck-text-secondary)" }}>{r.role.replace(/_/g, " ")}</span>
                          <span className="font-medium" style={{ color: "var(--ck-text)" }}>{r.count}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--ck-border)" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Quick Start for regular members */}
            {user && !["FACULTY", "STUDENT_COORDINATOR"].includes(user.role) && (
              <motion.div variants={itemVariants} className="ck-card p-6 lg:col-span-2">
                <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--ck-text)" }}>🚀 Quick Start</h2>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ck-text-secondary)" }}>
                  Welcome to CyberKavach! Browse upcoming <strong>Events</strong> to register and participate,
                  check the <strong>Leaderboard</strong> to see top contributors, view your <strong>Teams</strong>,
                  and use the <strong>Attendance</strong> module during events to check in via QR codes.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

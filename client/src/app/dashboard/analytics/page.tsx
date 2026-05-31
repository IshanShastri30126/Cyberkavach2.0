"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { BarChart3, Users, Calendar, FileCheck, Award, TrendingUp, ClipboardList } from "lucide-react";

export default function AnalyticsPage() {
  const { user, token } = useAuth();
  const [clubData, setClubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        if (user?.role && ["FACULTY", "STUDENT_COORDINATOR"].includes(user.role)) {
          const data = await api<any>("/analytics/club", { token });
          setClubData(data);
        } else {
          const data = await api<any>("/analytics/operations", { token });
          setClubData(data);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-mono tracking-tighter" style={{ color: "var(--ck-text)" }}>ANALYTICS MODULE</h1>
        <p className="mt-1" style={{ color: "var(--ck-text-secondary)" }}>SYSTEM PERFORMANCE // OPERATIONAL INSIGHTS</p>
      </div>

      {clubData?.overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(clubData.overview).map(([key, value], i) => {
            return (
              <motion.div key={key} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="ck-card p-5 group">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-red-900 to-red-600 flex items-center justify-center text-white mb-3 shadow-[0_0_10px_rgba(220,38,38,0.3)] group-hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-shadow`}>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold font-mono" style={{ color: "var(--ck-text)" }}>{String(value).padStart(2, '0')}</p>
                <p className="text-xs mt-1 uppercase tracking-widest font-semibold" style={{ color: "var(--ck-text-muted)" }}>{key.replace(/([A-Z])/g, " $1").replace("total ", "").trim()}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {clubData?.approvalStats && (
        <div className="ck-card p-6 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 uppercase tracking-tighter" style={{ color: "var(--ck-text)" }}><ClipboardList className="w-5 h-5 text-red-500" /> Approval Distribution</h3>
          <div className="space-y-3">
            {clubData.approvalStats.map((s: any) => {
              const total = clubData.approvalStats.reduce((sum: number, a: any) => sum + a.count, 0) || 1;
              const pct = Math.round((s.count / total) * 100);
              const color = s.status === "APPROVED" ? "from-red-600 to-red-400" : s.status === "REJECTED" ? "from-zinc-800 to-zinc-900" : "from-red-900 to-red-700";
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: "var(--ck-text-secondary)" }}>{s.status}</span>
                    <span className="font-medium" style={{ color: "var(--ck-text)" }}>{s.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-black/50 border border-red-900/20">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${color} shadow-[0_0_8px_rgba(220,38,38,0.4)]`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {clubData?.roleDistribution && (
        <div className="ck-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 uppercase tracking-tighter" style={{ color: "var(--ck-text)" }}><Users className="w-5 h-5 text-red-500" /> Member Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {clubData.roleDistribution.map((r: any) => (
              <div key={r.role} className="text-center p-4 rounded-xl border border-red-900/10 bg-black/40 hover:border-red-500/30 transition-colors">
                <p className="text-2xl font-bold font-mono" style={{ color: "var(--ck-text)" }}>{String(r.count).padStart(2, '0')}</p>
                <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--ck-text-muted)" }}>{r.role.replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, SERVER_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Trophy, Medal, Star, Search, Plus, Minus, Settings, X, Search as SearchIcon, Crown, Sparkles } from "lucide-react";
import { DefaultAvatar } from "@/components/default-avatar";

interface LeaderboardEntry { rank: number; user: { id: string; name: string; role: string; avatarUrl?: string }; totalPoints: number; badges: { name: string; icon: string }[]; }

const RANK_STYLES = [
  { bg: "from-[#CCFF00] via-[#99BF00] to-[#668000]", text: "text-black", color: "#CCFF00", shadowColor: "rgba(204,255,0,0.5)", icon: <Trophy className="w-7 h-7 text-black drop-shadow-[0_0_12px_rgba(204,255,0,0.8)]" /> },
  { bg: "from-[#FF4D00] via-[#CC3D00] to-[#992E00]", text: "text-white", color: "#FF4D00", shadowColor: "rgba(255,77,0,0.5)", icon: <Medal className="w-6 h-6 text-white drop-shadow-[0_0_10px_rgba(255,77,0,0.8)]" /> },
  { bg: "from-[#FF003C] via-[#CC0030] to-[#990024]", text: "text-white", color: "#FF003C", shadowColor: "rgba(255,0,60,0.5)", icon: <Medal className="w-6 h-6 text-white drop-shadow-[0_0_10px_rgba(255,0,60,0.8)]" /> },
];

export default function LeaderboardPage() {
  const { user, token } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("");
  const [search, setSearch] = useState("");

  const isCoord = user && ["FACULTY", "STUDENT_COORDINATOR"].includes(user.role);
  const isFaculty = user && ["FACULTY", "STUDENT_COORDINATOR"].includes(user.role);

  // Modals
  const [showGivePoints, setShowGivePoints] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [showDeductPoints, setShowDeductPoints] = useState(false);
  const [showManageBadges, setShowManageBadges] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  // Point Forms
  const [pointForm, setPointForm] = useState({ receiverId: "", points: "", category: "", reason: "" });
  const [deductForm, setDeductForm] = useState({ receiverId: "", points: "", reason: "" });
  const [badgeForm, setBadgeForm] = useState({ name: "", description: "", icon: "🏅", pointThreshold: "" });
  
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const loadData = async () => {
    try {
      const params = period ? `?period=${period}` : "";
      const data = await api<{ leaderboard: LeaderboardEntry[] }>(`/appreciation/leaderboard${params}`);
      setEntries(data.leaderboard);
      if (isCoord) {
        const catData = await api<{ categories: string[] }>("/appreciation/categories");
        setCategories(catData.categories);
      }
      if (isFaculty) {
        const badgeData = await api<{ badges: any[] }>("/appreciation/badges");
        setBadges(badgeData.badges);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [period, isCoord, isFaculty]);

  const searchMembers = async (q: string) => {
    setMemberSearch(q);
    if (q.length < 2) { setMemberResults([]); return; }
    try {
      const data = await api<{ users: any[] }>(`/users/search?q=${q}`, { token: token || undefined });
      setMemberResults(data.users.filter(u => u.id !== user?.id));
    } catch { setMemberResults([]); }
  };

  const handleGivePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return alert("Select a member");
    try {
      await api("/appreciation", {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ ...pointForm, points: parseInt(pointForm.points), receiverId: selectedMember.id })
      });
      setShowPointsAnimation(true);
      setTimeout(() => {
        setShowPointsAnimation(false);
        setShowGivePoints(false);
        setPointForm({ receiverId: "", points: "", category: "", reason: "" });
        setSelectedMember(null);
        setMemberSearch("");
        loadData();
      }, 2500);
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const handleDeductPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return alert("Select a member");
    try {
      await api("/appreciation/deduct", {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ ...deductForm, points: parseInt(deductForm.points), receiverId: selectedMember.id })
      });
      setShowDeductPoints(false); setDeductForm({ receiverId: "", points: "", reason: "" }); setSelectedMember(null); setMemberSearch("");
      loadData(); alert("Points deducted!");
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/appreciation/badges", {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ ...badgeForm, pointThreshold: parseInt(badgeForm.pointThreshold) })
      });
      setBadgeForm({ name: "", description: "", icon: "🏅", pointThreshold: "" });
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const filtered = search ? entries.filter((e) => e.user?.name.toLowerCase().includes(search.toLowerCase())) : entries;

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Crown className="w-4 h-4 text-[#CCFF00]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#CCFF00]">OPERATIVE RANKINGS</span>
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tighter uppercase text-white">
            RANKING <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CCFF00] via-[#FF4D00] to-[#FF003C]">MATRIX</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500 font-mono">OPERATIVE CREDITS // MISSION ACK</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isCoord && <button onClick={() => setShowGivePoints(true)} className="ck-btn-primary"><Plus className="w-4 h-4" /> Give Points</button>}
          {isCoord && <button onClick={() => setShowDeductPoints(true)} className="px-4 py-2 rounded-lg text-xs font-mono tracking-wider transition-all bg-rose-950/30 border border-rose-500/20 text-rose-300 hover:bg-rose-900/40 hover:border-rose-400/40 uppercase inline-flex items-center gap-1.5 backdrop-blur-sm"><Minus className="w-4 h-4" /> Penalty</button>}
          {isFaculty && <button onClick={() => setShowManageBadges(true)} className="ck-btn-secondary"><Settings className="w-4 h-4" /> Badges</button>}
        </div>
      </motion.div>

      {/* Give Points Modal */}
      <AnimatePresence>
        {showGivePoints && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="ck-glass-card p-6 w-full max-w-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />
              <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-bold font-mono tracking-tighter uppercase text-white">AWARD POINTS</h2><button onClick={() => setShowGivePoints(false)} className="text-zinc-500 hover:text-white transition"><X className="w-5 h-5"/></button></div>
              <form onSubmit={handleGivePoints} className="space-y-4">
                <div>
                  <label className="ck-label">Select Member</label>
                  {!selectedMember ? (
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input className="ck-input pl-9" placeholder="Search member..." value={memberSearch} onChange={(e) => searchMembers(e.target.value)} />
                      {memberResults.length > 0 && (
                        <div className="mt-1 max-h-40 overflow-y-auto border border-white/[0.06] rounded-lg absolute w-full z-10 backdrop-blur-xl" style={{ background: "rgba(8,10,15,0.95)" }}>
                          {memberResults.map(u => (
                            <button type="button" key={u.id} onClick={() => { setSelectedMember(u); setMemberResults([]); setMemberSearch(""); }} className="w-full text-left p-2.5 hover:bg-white/[0.04] text-sm text-zinc-400 hover:text-white transition-colors">{u.name} ({u.email})</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                      <span className="text-sm font-medium text-white">{selectedMember.name}</span>
                      <button type="button" onClick={() => setSelectedMember(null)} className="text-cyan-400 hover:text-cyan-300 text-xs font-mono">Remove</button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="ck-label">Points</label><input type="number" min="1" max="100" required className="ck-input" value={pointForm.points} onChange={(e) => setPointForm({...pointForm, points: e.target.value})} /></div>
                  <div><label className="ck-label">Category</label>
                    <select required className="ck-input" value={pointForm.category} onChange={(e) => setPointForm({...pointForm, category: e.target.value})}>
                      <option value="">Select...</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="ck-label">Reason (optional)</label><input className="ck-input" value={pointForm.reason} onChange={(e) => setPointForm({...pointForm, reason: e.target.value})} /></div>
                <button type="submit" className="ck-btn-primary w-full">Award Points</button>
              </form>

              <AnimatePresence>
                {showPointsAnimation && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 overflow-hidden"
                  >
                    {/* Floating stars/credits particles background */}
                    <div className="absolute inset-0 pointer-events-none">
                      {Array.from({ length: 15 }).map((_, pi) => {
                        const delay = pi * 0.15;
                        const left = Math.random() * 100;
                        const size = Math.random() * 12 + 8;
                        const color = pi % 2 === 0 ? "#CCFF00" : "#FF4D00";
                        return (
                          <motion.div
                            key={pi}
                            initial={{ y: 220, x: 0, opacity: 0 }}
                            animate={{ 
                              y: -50, 
                              x: Math.sin(pi) * 30,
                              opacity: [0, 1, 1, 0],
                              rotate: 360
                            }}
                            transition={{ 
                              duration: 2.2, 
                              delay,
                              repeat: Infinity,
                              ease: "easeOut"
                            }}
                            className="absolute font-bold"
                            style={{ left: `${left}%`, fontSize: `${size}px`, color, filter: `drop-shadow(0 0 6px ${color})` }}
                          >
                            ★
                          </motion.div>
                        );
                      })}
                    </div>

                    <motion.div 
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 100 }}
                      className="w-20 h-20 rounded-full bg-gradient-to-br from-[#CCFF00] to-[#FF4D00] flex items-center justify-center shadow-[0_0_40px_rgba(204,255,0,0.4)] z-10 mb-4"
                    >
                      <Star className="w-10 h-10 text-black fill-black" />
                    </motion.div>
                    
                    <h3 className="text-xl font-bold font-mono uppercase tracking-widest mb-1.5 z-10" style={{ color: "#CCFF00" }}>
                      Credits Dispatched
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider z-10">
                      Operative credentials loaded with point nodes.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deduct Points Modal */}
      <AnimatePresence>
        {showDeductPoints && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="ck-glass-card p-6 w-full max-w-md relative overflow-hidden border-rose-500/15">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-60" />
              <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-bold text-rose-400 font-mono tracking-tighter uppercase">PENALTY INFL</h2><button onClick={() => setShowDeductPoints(false)} className="text-zinc-500 hover:text-rose-400 transition"><X className="w-5 h-5"/></button></div>
              <form onSubmit={handleDeductPoints} className="space-y-4">
                <div>
                  <label className="ck-label">Select Member</label>
                  {!selectedMember ? (
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input className="ck-input pl-9" placeholder="Search member..." value={memberSearch} onChange={(e) => searchMembers(e.target.value)} />
                      {memberResults.length > 0 && (
                        <div className="mt-1 max-h-40 overflow-y-auto border border-white/[0.06] rounded-lg absolute w-full z-10 backdrop-blur-xl" style={{ background: "rgba(8,10,15,0.95)" }}>
                          {memberResults.map(u => (
                            <button type="button" key={u.id} onClick={() => { setSelectedMember(u); setMemberResults([]); setMemberSearch(""); }} className="w-full text-left p-2.5 hover:bg-white/[0.04] text-sm text-zinc-400 hover:text-white transition-colors">{u.name} ({u.email})</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                      <span className="text-sm font-medium text-white">{selectedMember.name}</span>
                      <button type="button" onClick={() => setSelectedMember(null)} className="text-rose-400 hover:text-rose-300 text-xs font-mono">Remove</button>
                    </div>
                  )}
                </div>
                <div><label className="ck-label">Points to Deduct</label><input type="number" min="1" max="100" required className="ck-input" value={deductForm.points} onChange={(e) => setDeductForm({...deductForm, points: e.target.value})} /></div>
                <div><label className="ck-label">Reason (Mandatory)</label><input required className="ck-input" value={deductForm.reason} onChange={(e) => setDeductForm({...deductForm, reason: e.target.value})} placeholder="Policy violation..." /></div>
                <button type="submit" className="w-full bg-gradient-to-r from-rose-900/40 to-red-900/40 hover:from-rose-800/50 hover:to-red-800/50 text-rose-200 border border-rose-500/20 rounded-lg py-2.5 px-4 font-mono text-sm tracking-wider transition-all uppercase backdrop-blur-sm">Deduct Points</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Badges Modal */}
      <AnimatePresence>
        {showManageBadges && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="ck-glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative border-cyan-500/15">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-mono tracking-tighter uppercase text-white">BADGE CONFIG</h2><button onClick={() => setShowManageBadges(false)} className="text-zinc-500 hover:text-cyan-400 transition"><X className="w-5 h-5"/></button></div>
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 font-mono text-cyan-300">CREATE NEW BADGE</h3>
                <form onSubmit={handleCreateBadge} className="space-y-3 p-4 border border-white/[0.06] rounded-xl bg-white/[0.02] backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="ck-label">Badge Name</label><input required className="ck-input" value={badgeForm.name} onChange={(e) => setBadgeForm({...badgeForm, name: e.target.value})} /></div>
                    <div><label className="ck-label">Emoji Icon</label><input required className="ck-input" value={badgeForm.icon} onChange={(e) => setBadgeForm({...badgeForm, icon: e.target.value})} /></div>
                  </div>
                  <div><label className="ck-label">Required Points Threshold</label><input type="number" min="1" required className="ck-input" value={badgeForm.pointThreshold} onChange={(e) => setBadgeForm({...badgeForm, pointThreshold: e.target.value})} /></div>
                  <div><label className="ck-label">Description</label><input className="ck-input" value={badgeForm.description} onChange={(e) => setBadgeForm({...badgeForm, description: e.target.value})} /></div>
                  <button type="submit" className="ck-btn-primary w-full mt-2">Create Badge</button>
                </form>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3 font-mono text-violet-300">EXISTING BADGES</h3>
                <div className="space-y-2">
                  {badges.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{b.icon}</span>
                        <div><p className="text-sm font-bold text-white font-mono">{b.name}</p><p className="text-xs text-zinc-400 font-mono">{b.pointThreshold} PTS REQUIRED</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ Period Filter ═══ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-white/[0.04] backdrop-blur-sm">
          {[{ value: "", label: "ALL TIME" }, { value: "month", label: "CURRENT CYCLE" }, { value: "semester", label: "SEMESTER WINDOW" }].map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)} 
              className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${period === p.value ? "bg-[#CCFF00] text-black font-bold shadow-[0_0_12px_rgba(204,255,0,0.3)]" : "text-slate-400 hover:text-[#CCFF00] hover:bg-white/[0.03]"}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="relative ck-search-container ck-input-icon-wrapper w-full sm:w-52">
          <Search className="w-4 h-4" style={{ color: "#CCFF00" }} />
          <input className="ck-input ck-search-input pl-9 w-full" placeholder="SEARCH OPERATIVE..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-2 border-violet-500/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">LOADING RANKINGS...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <Award className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
          <p className="text-lg text-zinc-500 font-mono">No data yet</p>
        </div>
      ) : (
        <>
          {/* ═══ Podium for top 3 ═══ */}
          {filtered.length >= 3 && !search && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-end justify-center gap-4 sm:gap-6 mb-8 pt-8"
            >
              {[1, 0, 2].map((idx) => {
                const entry = filtered[idx];
                if (!entry) return null;
                const style = RANK_STYLES[idx];
                const isFirst = idx === 0;
                const heights = ["h-40", "h-28", "h-20"];
                const sizes = isFirst ? "w-20 h-20" : "w-16 h-16";
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.12, type: "spring" }}
                    className="text-center relative"
                  >
                    {/* Light beam behind first place */}
                    {isFirst && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#CCFF00]/[0.04] rounded-full blur-3xl pointer-events-none" />
                    )}

                    <motion.div 
                      className={`${sizes} rounded-2xl bg-gradient-to-br ${style.bg} flex items-center justify-center mx-auto mb-3 border border-white/10 relative`}
                      style={{ boxShadow: `0 0 24px ${style.shadowColor}` }}
                      animate={{ y: isFirst ? [0, -8, 0] : idx === 1 ? [0, -4, 0] : [0, -3, 0] }}
                      transition={{ duration: 3.5 + idx, repeat: Infinity, ease: "easeInOut" }}
                    >
                      {style.icon}
                      {isFirst && <Sparkles className="w-3 h-3 text-black/50 absolute -top-1 -right-1" />}
                    </motion.div>
                    <p className="text-sm font-bold mb-0.5 font-mono tracking-tight text-white uppercase">{entry.user?.name}</p>
                    <p className="text-xs mb-3 font-mono font-bold" style={{ color: style.color }}>{entry.totalPoints} PTS</p>
                    <div
                      className={`${heights[idx]} w-28 sm:w-32 rounded-t-xl relative overflow-hidden border-x border-t border-white/[0.04]`}
                      style={{ background: `linear-gradient(180deg, ${style.color}15, transparent)` }}
                    >
                      {/* Rank number inside podium */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl font-black font-mono opacity-[0.06] text-white">#{idx + 1}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ═══ Full Ranking Table ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="ck-glass-card overflow-hidden"
          >
            <div className="overflow-x-auto w-full">
              <table className="ck-table whitespace-nowrap">
                <thead><tr><th>Rank</th><th>Member</th><th>Points</th><th>Badges</th></tr></thead>
                <tbody>
                  {filtered.map((entry, i) => {
                    const isTop3 = entry.rank <= 3;
                    const rankStyle = RANK_STYLES[entry.rank - 1];
                    return (
                      <motion.tr
                        key={entry.user?.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.03 }}
                        className={isTop3 ? "hover:bg-white/[0.03]" : ""}
                        style={isTop3 && rankStyle ? { borderLeft: `3px solid ${rankStyle.color}` } : undefined}
                      >
                        <td className="font-mono">
                          <span className="font-bold font-mono text-sm" style={{
                            color: entry.rank === 1 ? "#CCFF00" :
                                   entry.rank === 2 ? "#FF4D00" :
                                   entry.rank === 3 ? "#FF003C" :
                                   "var(--ck-text-muted)"
                          }}>
                            #{entry.rank}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {entry.user?.avatarUrl ? (
                                <img src={`${SERVER_BASE_URL}${entry.user.avatarUrl}`} alt="Avatar" className="w-9 h-9 rounded-xl object-cover border border-white/[0.06] shrink-0" />
                              ) : (
                                <DefaultAvatar className="w-9 h-9" />
                              )}
                              {isTop3 && rankStyle && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black" style={{ background: rankStyle.color, color: entry.rank === 1 ? "#000" : "#fff", boxShadow: `0 0 6px ${rankStyle.shadowColor}` }}>
                                  {entry.rank}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{entry.user?.name}</p>
                              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">{entry.user?.role?.replace(/_/g, " ")}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="font-semibold flex items-center gap-1.5 font-mono text-white">
                            <Star className="w-4 h-4 text-[#CCFF00] fill-[#CCFF00]/20 drop-shadow-[0_0_6px_rgba(204,255,0,0.5)]" />
                            {String(entry.totalPoints).padStart(2, '0')}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            {entry.badges.map((b, bi) => (
                              <span key={bi} title={b.name} className="text-xl drop-shadow-[0_0_4px_rgba(255,255,255,0.3)] hover:scale-125 transition-transform cursor-default">{b.icon}</span>
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

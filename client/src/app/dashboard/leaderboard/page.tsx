"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, SERVER_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Trophy, Medal, Star, Search, Plus, Minus, Settings, X, Search as SearchIcon } from "lucide-react";
import { DefaultAvatar } from "@/components/default-avatar";

interface LeaderboardEntry { rank: number; user: { id: string; name: string; role: string; avatarUrl?: string }; totalPoints: number; badges: { name: string; icon: string }[]; }

const RANK_STYLES = [
  { bg: "from-red-600 to-red-400", text: "text-white", icon: <Trophy className="w-6 h-6 shadow-[0_0_10px_rgba(220,38,38,0.5)]" /> },
  { bg: "from-zinc-400 to-zinc-600", text: "text-white", icon: <Medal className="w-6 h-6" /> },
  { bg: "from-red-900 to-red-700", text: "text-white", icon: <Medal className="w-6 h-6" /> },
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
      setShowGivePoints(false); setPointForm({ receiverId: "", points: "", category: "", reason: "" }); setSelectedMember(null); setMemberSearch("");
      loadData(); alert("Points awarded!");
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tighter uppercase" style={{ color: "var(--ck-text)" }}>RANKING_MATRIX</h1>
          <p className="mt-1" style={{ color: "var(--ck-text-secondary)" }}>OPERATIVE_CREDITS // MISSION_ACK</p>
        </div>
        <div className="flex gap-2">
          {isCoord && <button onClick={() => setShowGivePoints(true)} className="ck-btn-primary"><Plus className="w-4 h-4" /> Give Points</button>}
          {isCoord && <button onClick={() => setShowDeductPoints(true)} className="ck-btn-danger"><Minus className="w-4 h-4" /> Deduct</button>}
          {isFaculty && <button onClick={() => setShowManageBadges(true)} className="ck-btn-secondary"><Settings className="w-4 h-4" /> Badges</button>}
        </div>
      </div>

      {/* Give Points Modal */}
      <AnimatePresence>
        {showGivePoints && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="ck-card p-6 w-full max-w-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold font-mono tracking-tighter uppercase">AWARD_POINTS</h2><button onClick={() => setShowGivePoints(false)} className="text-red-500"><X className="w-5 h-5"/></button></div>
              <form onSubmit={handleGivePoints} className="space-y-4">
                <div>
                  <label className="ck-label">Select Member</label>
                  {!selectedMember ? (
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className="ck-input pl-9" placeholder="Search member..." value={memberSearch} onChange={(e) => searchMembers(e.target.value)} />
                      {memberResults.length > 0 && (
                        <div className="mt-1 max-h-40 overflow-y-auto border border-[var(--ck-border)] rounded-lg absolute w-full z-10" style={{ background: "var(--ck-bg)" }}>
                          {memberResults.map(u => (
                            <button type="button" key={u.id} onClick={() => { setSelectedMember(u); setMemberResults([]); setMemberSearch(""); }} className="w-full text-left p-2 hover:bg-[var(--ck-bg-secondary)] text-sm">{u.name} ({u.email})</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--ck-border)]">
                      <span className="text-sm font-medium">{selectedMember.name}</span>
                      <button type="button" onClick={() => setSelectedMember(null)} className="text-red-400 text-xs">Remove</button>
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deduct Points Modal */}
      <AnimatePresence>
        {showDeductPoints && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="ck-card p-6 w-full max-w-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
              <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-red-500 font-mono tracking-tighter uppercase">PENALTY_INFL</h2><button onClick={() => setShowDeductPoints(false)} className="text-red-500"><X className="w-5 h-5"/></button></div>
              <form onSubmit={handleDeductPoints} className="space-y-4">
                <div>
                  <label className="ck-label">Select Member</label>
                  {!selectedMember ? (
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input className="ck-input pl-9" placeholder="Search member..." value={memberSearch} onChange={(e) => searchMembers(e.target.value)} />
                      {memberResults.length > 0 && (
                        <div className="mt-1 max-h-40 overflow-y-auto border border-[var(--ck-border)] rounded-lg absolute w-full z-10" style={{ background: "var(--ck-bg)" }}>
                          {memberResults.map(u => (
                            <button type="button" key={u.id} onClick={() => { setSelectedMember(u); setMemberResults([]); setMemberSearch(""); }} className="w-full text-left p-2 hover:bg-[var(--ck-bg-secondary)] text-sm">{u.name} ({u.email})</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-lg border border-[var(--ck-border)]">
                      <span className="text-sm font-medium">{selectedMember.name}</span>
                      <button type="button" onClick={() => setSelectedMember(null)} className="text-red-400 text-xs">Remove</button>
                    </div>
                  )}
                </div>
                <div><label className="ck-label">Points to Deduct</label><input type="number" min="1" max="100" required className="ck-input" value={deductForm.points} onChange={(e) => setDeductForm({...deductForm, points: e.target.value})} /></div>
                <div><label className="ck-label">Reason (Mandatory)</label><input required className="ck-input" value={deductForm.reason} onChange={(e) => setDeductForm({...deductForm, reason: e.target.value})} placeholder="Policy violation..." /></div>
                <button type="submit" className="ck-btn-danger w-full">Deduct Points</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Badges Modal */}
      <AnimatePresence>
        {showManageBadges && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="ck-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-mono tracking-tighter uppercase">BADGE_CONFIG</h2><button onClick={() => setShowManageBadges(false)} className="text-red-500"><X className="w-5 h-5"/></button></div>
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2">Create New Badge</h3>
                <form onSubmit={handleCreateBadge} className="space-y-3 p-4 border border-[var(--ck-border)] rounded-xl bg-[var(--ck-bg-secondary)]">
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
                <h3 className="text-sm font-semibold mb-2">Existing Badges</h3>
                <div className="space-y-2">
                  {badges.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--ck-border)]">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{b.icon}</span>
                        <div><p className="text-sm font-bold">{b.name}</p><p className="text-xs text-gray-500">{b.pointThreshold} pts required</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Period Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ value: "", label: "ALL_TIME" }, { value: "month", label: "CURRENT_CYCLE" }, { value: "semester", label: "SEMESTER_WINDOW" }].map((p) => (
          <button key={p.value} onClick={() => setPeriod(p.value)} className={`px-4 py-2 rounded-lg text-xs font-mono tracking-widest transition-all ${period === p.value ? "bg-red-900 text-white shadow-[0_0_10px_rgba(220,38,38,0.3)] border border-red-500/50" : "bg-black/40 text-slate-400 border border-red-900/20 hover:text-red-400"}`}>
            {p.label}
          </button>
        ))}
          <div className="flex items-center gap-4">
          <div className="relative ck-search-container ck-input-icon-wrapper">
            <Search className="w-4 h-4 text-red-500/50" />
            <input className="ck-input ck-search-input w-48" placeholder="SEARCH_OPERATIVE..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20"><Award className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--ck-text-muted)" }} /><p className="text-lg" style={{ color: "var(--ck-text-secondary)" }}>No data yet</p></div>
      ) : (
        <>
          {/* Podium for top 3 */}
          {filtered.length >= 3 && !search && (
            <div className="flex items-end justify-center gap-4 mb-8 pt-8">
              {[1, 0, 2].map((idx) => {
                const entry = filtered[idx];
                if (!entry) return null;
                const style = RANK_STYLES[idx];
                const height = idx === 0 ? "h-32" : idx === 1 ? "h-24" : "h-20";
                return (
                  <motion.div key={idx} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.15 }} className="text-center">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${style.bg} flex items-center justify-center mx-auto mb-2 shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-red-500/30 ${style.text}`}>
                      {style.icon}
                    </div>
                    <p className="text-sm font-semibold mb-1 font-mono tracking-tighter" style={{ color: "var(--ck-text)" }}>{entry.user?.name.toUpperCase()}</p>
                    <p className="text-xs mb-2 font-mono" style={{ color: "var(--ck-text-muted)" }}>{entry.totalPoints} PTS</p>
                    <div className={`${height} w-24 rounded-t-xl bg-gradient-to-t ${style.bg} opacity-10 border-x border-t border-red-900/20`} />
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Full List */}
          <div className="ck-card overflow-hidden">
            <table className="ck-table">
              <thead><tr><th>Rank</th><th>Member</th><th>Points</th><th>Badges</th></tr></thead>
              <tbody>
                {filtered.map((entry, i) => (
                  <motion.tr key={entry.user?.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td className="font-mono"><span className="font-bold text-red-500">#{entry.rank}</span></td>
                    <td>
                      <div className="flex items-center gap-3">
                        {entry.user?.avatarUrl ? (
                          <img src={`${SERVER_BASE_URL}${entry.user.avatarUrl}`} alt="Avatar" className="w-8 h-8 rounded-lg object-cover border border-red-500/20 shrink-0" />
                        ) : (
                          <DefaultAvatar className="w-8 h-8" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{entry.user?.name}</p>
                          <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--ck-text-muted)" }}>{entry.user?.role?.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="font-semibold flex items-center gap-1 font-mono text-white"><Star className="w-4 h-4 text-red-500" />{String(entry.totalPoints).padStart(2, '0')}</span></td>
                    <td><div className="flex gap-1">{entry.badges.map((b, bi) => <span key={bi} title={b.name} className="text-xl">{b.icon}</span>)}</div></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

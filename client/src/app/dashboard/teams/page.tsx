"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, API_BASE } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { UsersRound, Plus, X, QrCode, Search, Calendar, Download, RefreshCw, Crown, ChevronDown, ChevronUp } from "lucide-react";

interface TeamMember { id: string; name: string; email: string; studentId?: string; }
interface Team {
  id: string; name: string; teamCode: string; qrCode?: string; leaderId?: string;
  leader?: { id: string; name: string };
  event?: { id: string; title: string; startDate: string };
  _count?: { members: number };
  members?: { user: TeamMember }[];
}

export default function TeamsPage() {
  const { user, token } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showReuse, setShowReuse] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", eventId: "" });
  const [reuseEventId, setReuseEventId] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [reusing, setReusing] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // Search/Sort/Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "members" | "newest">("newest");
  const [filterEventId, setFilterEventId] = useState("");

  const loadData = async () => {
    try {
      const [t, e] = await Promise.all([
        api<{ teams: Team[] }>("/teams/my", { token: token || undefined }),
        api<{ events: any[] }>("/events", { token: token || undefined }),
      ]);
      setTeams(t.teams); setEvents(e.events);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) loadData(); }, [token]);

  const searchMembers = async (q: string) => {
    setMemberSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const data = await api<{ users: any[] }>(`/users/search?q=${q}`, { token: token || undefined });
      setSearchResults(data.users.filter((u) => u.id !== user?.id && !selectedMembers.find((m) => m.id === u.id)));
    } catch { setSearchResults([]); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    try {
      await api("/teams", {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ ...form, memberIds: selectedMembers.map((m) => m.id) }),
      });
      setShowCreate(false); setForm({ name: "", eventId: "" }); setSelectedMembers([]);
      loadData();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setCreating(false); }
  };

  const handleReuse = async (teamId: string) => {
    if (!reuseEventId) { alert("Select an event"); return; }
    setReusing(true);
    try {
      await api(`/teams/${teamId}/reuse`, {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ eventId: reuseEventId }),
      });
      setShowReuse(null); setReuseEventId("");
      loadData();
      alert("Team reused successfully!");
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to reuse team"); }
    finally { setReusing(false); }
  };

  const downloadQR = async (teamId: string, teamCode: string) => {
    try {
      const res = await fetch(`${API_BASE}/teams/${teamId}/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${teamCode}.png`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { alert("Failed to download QR code"); }
  };

  const loadTeamDetails = async (teamId: string) => {
    if (expandedTeam === teamId) { setExpandedTeam(null); return; }
    try {
      const data = await api<{ team: Team }>(`/teams/${teamId}`, { token: token || undefined });
      setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, members: data.team.members, leader: data.team.leader } : t));
      setExpandedTeam(teamId);
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--ck-text)" }}>Teams</h1>
          <p className="mt-1" style={{ color: "var(--ck-text-secondary)" }}>Create and manage event teams</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="ck-btn-primary"><Plus className="w-4 h-4" /> Create Team</button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-black/20 p-3 rounded-xl border border-[var(--ck-border)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            className="ck-input pl-9 w-full bg-zinc-900 border-zinc-800 text-sm py-2" 
            placeholder="Search teams by name or code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select 
          className="ck-input bg-zinc-900 border-zinc-800 text-sm py-2 w-full sm:w-auto"
          value={filterEventId}
          onChange={(e) => setFilterEventId(e.target.value)}
        >
          <option value="">All Events</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
        <select 
          className="ck-input bg-zinc-900 border-zinc-800 text-sm py-2 w-full sm:w-auto"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="newest">Newest First</option>
          <option value="name">Alphabetical (A-Z)</option>
          <option value="members">Team Size</option>
        </select>
      </div>

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="ck-card p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: "var(--ck-text)" }}>Create Team</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-[var(--ck-border)]"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div><label className="ck-label">Team Name</label><input className="ck-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. CodeWarriors" /></div>
                <div><label className="ck-label">Event</label>
                  <select className="ck-input" value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })} required>
                    <option value="">Select event...</option>
                    {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="ck-label">Add Members</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ck-text-muted)" }} />
                    <input className="ck-input pl-9" placeholder="Search by name or email..." value={memberSearch} onChange={(e) => searchMembers(e.target.value)} />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 rounded-xl border border-[var(--ck-border)] max-h-40 overflow-y-auto" style={{ background: "var(--ck-bg)" }}>
                      {searchResults.map((u) => (
                        <button key={u.id} type="button" onClick={() => { setSelectedMembers([...selectedMembers, u]); setSearchResults([]); setMemberSearch(""); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--ck-bg-secondary)] transition" style={{ color: "var(--ck-text)" }}>
                          {u.name} ({u.email})
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedMembers.map((m) => (
                        <span key={m.id} className="ck-badge ck-badge-primary flex items-center gap-1">
                          {m.name}
                          <button type="button" onClick={() => setSelectedMembers(selectedMembers.filter((s) => s.id !== m.id))} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" disabled={creating} className="ck-btn-primary w-full">{creating ? "Creating..." : "Create Team"}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reuse Team Modal */}
      <AnimatePresence>
        {showReuse && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="ck-card p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4" style={{ color: "var(--ck-text)" }}>Reuse Team for Another Event</h2>
              <p className="text-sm mb-4" style={{ color: "var(--ck-text-secondary)" }}>
                Same team name and members will be cloned with a new team code and QR.
              </p>
              <div className="space-y-4">
                <div><label className="ck-label">Select New Event</label>
                  <select className="ck-input" value={reuseEventId} onChange={(e) => setReuseEventId(e.target.value)}>
                    <option value="">Choose event...</option>
                    {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowReuse(null); setReuseEventId(""); }} className="ck-btn-secondary flex-1">Cancel</button>
                  <button onClick={() => handleReuse(showReuse)} disabled={reusing || !reuseEventId} className="ck-btn-primary flex-1">
                    {reusing ? "Cloning..." : <><RefreshCw className="w-4 h-4" /> Reuse Team</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Team Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20">
          <UsersRound className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--ck-text-muted)" }} />
          <p className="text-lg" style={{ color: "var(--ck-text-secondary)" }}>No teams yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--ck-text-muted)" }}>Create a team to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams
            .filter(t => !filterEventId || t.event?.id === filterEventId)
            .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.teamCode.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
              if (sortBy === "name") return a.name.localeCompare(b.name);
              if (sortBy === "members") return (b._count?.members || 0) - (a._count?.members || 0);
              return 0; // newest is default from API
            })
            .map((team, i) => (
            <motion.div key={team.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="ck-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: "var(--ck-text)" }}>{team.name}</h3>
                    <code className="text-xs px-2 py-0.5 rounded mt-1 inline-block" style={{ background: "var(--ck-bg-secondary)", color: "var(--ck-text-muted)" }}>
                      {team.teamCode}
                    </code>
                  </div>
                  <span className="ck-badge ck-badge-primary">{team._count?.members || 0} members</span>
                </div>

                {/* Leader indicator */}
                {team.leader && (
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: "var(--ck-bg-secondary)" }}>
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-medium" style={{ color: "var(--ck-text-secondary)" }}>
                      Leader: {team.leader.name}
                    </span>
                  </div>
                )}

                {/* Event info */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-3.5 h-3.5" style={{ color: "var(--ck-text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--ck-text-secondary)" }}>{team.event?.title}</p>
                </div>

                {/* QR Code */}
                {team.qrCode && (
                  <div className="mt-3 flex justify-center">
                    <img src={team.qrCode} alt="Team QR Code" className="w-28 h-28 rounded-lg border-2 border-[var(--ck-border)]" />
                  </div>
                )}

                {/* Expanded member list */}
                <AnimatePresence>
                  {expandedTeam === team.id && team.members && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="mt-3 overflow-hidden">
                      <div className="p-3 rounded-xl space-y-1.5" style={{ background: "var(--ck-bg)" }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--ck-text)" }}>Members</p>
                        {team.members.map((m) => (
                          <div key={m.user.id} className="flex items-center gap-2 text-xs" style={{ color: "var(--ck-text-secondary)" }}>
                            {team.leader?.id === m.user.id && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                            <span className="font-medium">{m.user.name}</span>
                            <span style={{ color: "var(--ck-text-muted)" }}>({m.user.email})</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => loadTeamDetails(team.id)} className="ck-btn-secondary text-xs py-1.5 flex-1">
                    {expandedTeam === team.id ? <><ChevronUp className="w-3 h-3" /> Collapse</> : <><ChevronDown className="w-3 h-3" /> Members</>}
                  </button>
                  <button onClick={() => downloadQR(team.id, team.teamCode)} className="ck-btn-secondary text-xs py-1.5">
                    <Download className="w-3 h-3" /> QR
                  </button>
                  <button onClick={() => setShowReuse(team.id)} className="ck-btn-secondary text-xs py-1.5">
                    <RefreshCw className="w-3 h-3" /> Reuse
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

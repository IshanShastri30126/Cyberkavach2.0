"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { User, Star, Calendar, Award, TrendingUp, Shield, Edit2, X, Upload } from "lucide-react";
import { DefaultAvatar } from "@/components/default-avatar";

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit Profile State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editStudentId, setEditStudentId] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editInstitute, setEditInstitute] = useState("");
  const [editSemester, setEditSemester] = useState("");
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token || !user) return;
    setEditName(user.name || "");
    setEditStudentId(user.studentId || "");
    setEditPhone(user.phone || "");
    setEditDepartment(user.department || "");
    setEditInstitute(user.institute || "");
    setEditSemester(user.semester || "");

    const load = async () => {
      try {
        const data = await api<any>(`/appreciation/user/${user.id}/history`, { token });
        setHistory(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [token, user]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (editName) formData.append("name", editName);
      if (editPassword) formData.append("password", editPassword);
      if (editAvatar) formData.append("avatar", editAvatar);
      formData.append("studentId", editStudentId);
      formData.append("phone", editPhone);
      formData.append("department", editDepartment);
      formData.append("institute", editInstitute);
      formData.append("semester", editSemester);

      const res = await fetch("http://localhost:4000/api/users/profile", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update profile");
      }
      
      // Reload page to reflect changes
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error updating profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Profile Card */}
      <div className="ck-card p-8 mb-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {user?.avatarUrl ? (
            <img src={`http://localhost:4000${user.avatarUrl}`} alt="Avatar" className="w-20 h-20 rounded-xl object-cover border-2 border-[var(--ck-primary-dark)] shrink-0" />
          ) : (
            <DefaultAvatar className="w-20 h-20 border-2" />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: "var(--ck-text)" }}>{user?.name}</h1>
            <p style={{ color: "var(--ck-text-secondary)" }}>{user?.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-2">
              <span className="ck-badge ck-badge-primary">{user?.role?.replace(/_/g, " ")}</span>
              {user?.studentId && <span className="ck-badge ck-badge-info">ID: {user.studentId}</span>}
              {user?.department && <span className="ck-badge ck-badge-info">{user.department}</span>}
            </div>
          </div>
          <button onClick={() => setShowEditModal(true)} className="ck-btn-secondary p-2 hidden sm:flex self-start">
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        </div>
        <button onClick={() => setShowEditModal(true)} className="ck-btn-secondary w-full mt-4 sm:hidden flex justify-center">
          <Edit2 className="w-4 h-4" /> Edit Profile
        </button>
      </div>

      {/* Operative Details Grid */}
      <div className="ck-card p-6 mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2 uppercase tracking-tighter" style={{ color: "var(--ck-text)" }}>
          <User className="w-5 h-5 text-red-500" /> Operative Profile Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-lg border border-[var(--ck-border)] bg-black/30">
            <p className="text-[10px] uppercase font-semibold font-mono" style={{ color: "var(--ck-text-muted)" }}>Full Name</p>
            <p className="font-semibold mt-0.5 text-white">{user?.name}</p>
          </div>
          <div className="p-3 rounded-lg border border-[var(--ck-border)] bg-black/30">
            <p className="text-[10px] uppercase font-semibold font-mono" style={{ color: "var(--ck-text-muted)" }}>College Email ID</p>
            <p className="font-semibold mt-0.5 text-white">{user?.email}</p>
          </div>
          <div className="p-3 rounded-lg border border-[var(--ck-border)] bg-black/30">
            <p className="text-[10px] uppercase font-semibold font-mono" style={{ color: "var(--ck-text-muted)" }}>Student ID</p>
            <p className="font-semibold mt-0.5 text-white">{user?.studentId || "N/A"}</p>
          </div>
          <div className="p-3 rounded-lg border border-[var(--ck-border)] bg-black/30">
            <p className="text-[10px] uppercase font-semibold font-mono" style={{ color: "var(--ck-text-muted)" }}>Department</p>
            <p className="font-semibold mt-0.5 text-white">{user?.department || "N/A"}</p>
          </div>
          <div className="p-3 rounded-lg border border-[var(--ck-border)] bg-black/30">
            <p className="text-[10px] uppercase font-semibold font-mono" style={{ color: "var(--ck-text-muted)" }}>Institute</p>
            <p className="font-semibold mt-0.5 text-white">{user?.institute || "N/A"}</p>
          </div>
          <div className="p-3 rounded-lg border border-[var(--ck-border)] bg-black/30">
            <p className="text-[10px] uppercase font-semibold font-mono" style={{ color: "var(--ck-text-muted)" }}>Semester</p>
            <p className="font-semibold mt-0.5 text-white">{user?.semester || "N/A"}</p>
          </div>
          <div className="p-3 rounded-lg border border-[var(--ck-border)] bg-black/30 sm:col-span-2">
            <p className="text-[10px] uppercase font-semibold font-mono" style={{ color: "var(--ck-text-muted)" }}>Contact Info / Phone</p>
            <p className="font-semibold mt-0.5 text-white">{user?.phone || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="ck-card p-5 text-center">
          <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold" style={{ color: "var(--ck-text)" }}>{history?.totalPoints || 0}</p>
          <p className="text-xs" style={{ color: "var(--ck-text-muted)" }}>Total Points</p>
        </div>
        <div className="ck-card p-5 text-center">
          <Award className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
          <p className="text-2xl font-bold" style={{ color: "var(--ck-text)" }}>{history?.badges?.length || 0}</p>
          <p className="text-xs" style={{ color: "var(--ck-text-muted)" }}>Badges</p>
        </div>
        <div className="ck-card p-5 text-center">
          <Calendar className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
          <p className="text-2xl font-bold" style={{ color: "var(--ck-text)" }}>{history?.eventParticipation || 0}</p>
          <p className="text-xs" style={{ color: "var(--ck-text-muted)" }}>Events</p>
        </div>
      </div>

      {/* Badges */}
      {history?.badges?.length > 0 && (
        <div className="ck-card p-6 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ck-text)" }}><Shield className="w-5 h-5 text-indigo-500" /> Badges Earned</h3>
          <div className="flex flex-wrap gap-3">
            {history.badges.map((b: any) => (
              <motion.div key={b.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-3 rounded-xl text-center" style={{ background: "var(--ck-bg-secondary)" }}>
                <span className="text-3xl">{b.badge.icon}</span>
                <p className="text-xs font-medium mt-1" style={{ color: "var(--ck-text)" }}>{b.badge.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Point History */}
      {history?.points?.length > 0 && (
        <div className="ck-card p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--ck-text)" }}><TrendingUp className="w-5 h-5 text-emerald-500" /> Contribution History</h3>
          <div className="space-y-2">
            {history.points.slice(0, 20).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--ck-bg-secondary)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--ck-text)" }}>{p.category}</p>
                  {p.reason && <p className="text-xs" style={{ color: "var(--ck-text-muted)" }}>{p.reason}</p>}
                  <p className="text-xs" style={{ color: "var(--ck-text-muted)" }}>by {p.giver?.name} · {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold ${p.points >= 0 ? "text-emerald-500" : "text-red-500"}`}>{p.points >= 0 ? "+" : ""}{p.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="ck-card p-6 w-full max-w-lg relative">
              <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-[var(--ck-text-muted)] hover:text-white z-20">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>
              
              <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                <div>
                  <label className="ck-label">Full Name</label>
                  <input className="ck-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="ck-label">Student ID</label>
                    <input className="ck-input" value={editStudentId} onChange={(e) => setEditStudentId(e.target.value)} required />
                  </div>
                  <div>
                    <label className="ck-label">Contact / Phone</label>
                    <input className="ck-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="ck-label">Department</label>
                    <input className="ck-input" value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} required />
                  </div>
                  <div>
                    <label className="ck-label">Semester</label>
                    <input className="ck-input" value={editSemester} onChange={(e) => setEditSemester(e.target.value)} required />
                  </div>
                </div>

                <div>
                  <label className="ck-label">Institute</label>
                  <input className="ck-input" value={editInstitute} onChange={(e) => setEditInstitute(e.target.value)} required />
                </div>

                <div>
                  <label className="ck-label">New Password (Optional)</label>
                  <input className="ck-input" type="password" placeholder="Leave blank to keep current" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} minLength={6} />
                </div>

                <div>
                  <label className="ck-label">Avatar Photograph</label>
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={(e) => setEditAvatar(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="ck-input flex items-center justify-between pointer-events-none">
                      <span className="truncate">{editAvatar ? editAvatar.name : "Select an image..."}</span>
                      <Upload className="w-4 h-4 text-[var(--ck-primary-light)]" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="ck-btn-primary w-full mt-4">
                  {submitting ? "Updating..." : "Save Changes"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

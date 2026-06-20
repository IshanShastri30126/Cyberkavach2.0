"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, API_BASE, getFileUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Star,
  Calendar,
  Award,
  TrendingUp,
  Shield,
  Edit2,
  X,
  Upload,
  Mail,
  Hash,
  BookOpen,
  Building,
  GraduationCap,
  Phone,
  Fingerprint
} from "lucide-react";
import { DefaultAvatar } from "@/components/default-avatar";

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  
  // Edit Profile State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBiometricScan, setShowBiometricScan] = useState(false);
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-3 border-violet-500/30 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-xs uppercase font-mono text-[var(--ck-text-secondary)] tracking-widest">Loading Operative Dossier...</p>
      </div>
    );
  }

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

      const res = await fetch(`${API_BASE}/users/profile`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update profile");
      }
      
      setShowEditModal(false);
      setShowBiometricScan(true);
      setTimeout(() => {
        window.location.reload();
      }, 2800);
    } catch (err: any) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error updating profile");
    } finally {
      setSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  } as const;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Dossier Card */}
      <div className="ck-card p-6 sm:p-8 relative overflow-hidden bg-black/40 border border-zinc-800 shadow-md hover:border-[#CCFF00]/25 transition-all">
        <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-[#CCFF00]/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left relative z-10">
          <div className="relative shrink-0 group">
            {user?.avatarUrl && !imgError ? (
              <img
                src={getFileUrl(user.avatarUrl)}
                alt="Avatar"
                onError={() => setImgError(true)}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-[#CCFF00]/60 shadow-[0_0_15px_rgba(204,255,0,0.25)]"
              />
            ) : (
              <DefaultAvatar className="w-24 h-24 rounded-2xl border-2 border-[#CCFF00]/20" />
            )}
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer" onClick={() => setShowEditModal(true)}>
              <Edit2 className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">{user?.name}</h1>
              <span className="ck-badge ck-badge-primary self-center sm:self-start text-[9px] px-2 py-0.5">
                {user?.role?.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-sm font-mono text-[var(--ck-text-secondary)]">{user?.email}</p>
            
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-3 text-xs font-mono">
              {user?.studentId && (
                <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-900 text-[var(--ck-text-muted)]">
                  CLEARANCE: {user.studentId}
                </span>
              )}
              {user?.department && (
                <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-900 text-[var(--ck-text-muted)]">
                  DEPT: {user.department}
                </span>
              )}
            </div>
          </div>
          
          {/* Responsive single Edit Button */}
          <button
            onClick={() => setShowEditModal(true)}
            className="ck-btn-secondary px-4 py-2 flex items-center gap-2 text-xs font-mono tracking-widest uppercase transition shrink-0 self-center sm:self-start"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Metrics Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.01 }}
          className="ck-card p-5 bg-gradient-to-br from-zinc-950/60 to-black border-zinc-800 hover:border-[#CCFF00]/30 transition-all duration-300 relative group overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 w-12 h-12 rounded-full bg-[#CCFF00]/5 group-hover:bg-[#CCFF00]/10 transition-colors pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#CCFF00]/15 to-transparent text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center shadow-[0_0_10px_rgba(204,255,0,0.1)]">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl font-extrabold font-mono text-white tracking-tighter">
                {history?.totalPoints || 0}
              </p>
              <p className="text-[10px] uppercase font-mono tracking-widest text-[var(--ck-text-secondary)] font-bold">Total Points</p>
            </div>
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.01 }}
          className="ck-card p-5 bg-gradient-to-br from-zinc-950/60 to-black border-zinc-800 hover:border-[#FF4D00]/30 transition-all duration-300 relative group overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 w-12 h-12 rounded-full bg-[#FF4D00]/5 group-hover:bg-[#FF4D00]/10 transition-colors pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF4D00]/15 to-transparent text-[#FF4D00] border border-[#FF4D00]/30 flex items-center justify-center shadow-[0_0_10px_rgba(255,77,0,0.1)]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl font-extrabold font-mono text-white tracking-tighter">
                {history?.badges?.length || 0}
              </p>
              <p className="text-[10px] uppercase font-mono tracking-widest text-[var(--ck-text-secondary)] font-bold">Badges unlocked</p>
            </div>
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4, scale: 1.01 }}
          className="ck-card p-5 bg-gradient-to-br from-zinc-950/60 to-black border-zinc-800 hover:border-[#CCFF00]/30 transition-all duration-300 relative group overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 w-12 h-12 rounded-full bg-[#CCFF00]/5 group-hover:bg-[#CCFF00]/10 transition-colors pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#CCFF00]/15 to-transparent text-[#CCFF00] border border-[#CCFF00]/30 flex items-center justify-center shadow-[0_0_10px_rgba(204,255,0,0.1)]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-3xl font-extrabold font-mono text-white tracking-tighter">
                {history?.eventParticipation || 0}
              </p>
              <p className="text-[10px] uppercase font-mono tracking-widest text-[var(--ck-text-secondary)] font-bold">Events Participated</p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Operative Details Grid */}
      <div className="ck-card p-6 bg-black/30 border border-zinc-800 shadow-md">
        <h3 className="text-sm font-bold mb-5 flex items-center gap-2 uppercase tracking-tight text-white font-mono border-b border-zinc-850 pb-3">
          <User className="w-4 h-4" style={{ color: "#CCFF00" }} /> OPERATIVE DOSSIER DETAILS
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-mono">
          {/* Full Name */}
          <div className="p-3.5 rounded-xl border border-zinc-900/60 bg-zinc-950/30 flex items-center gap-4 hover:border-zinc-800 transition duration-300">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-[var(--ck-text-secondary)] border border-zinc-850">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--ck-text-muted)] font-semibold">Full Name</p>
              <p className="font-bold mt-0.5 text-white truncate">{user?.name}</p>
            </div>
          </div>

          {/* Email */}
          <div className="p-3.5 rounded-xl border border-zinc-900/60 bg-zinc-950/30 flex items-center gap-4 hover:border-zinc-800 transition duration-300">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-[var(--ck-text-secondary)] border border-zinc-850">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--ck-text-muted)] font-semibold">College Email</p>
              <p className="font-bold mt-0.5 text-white truncate">{user?.email}</p>
            </div>
          </div>

          {/* Student ID */}
          <div className="p-3.5 rounded-xl border border-zinc-900/60 bg-zinc-950/30 flex items-center gap-4 hover:border-zinc-800 transition duration-300">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-[var(--ck-text-secondary)] border border-zinc-850">
              <Hash className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--ck-text-muted)] font-semibold">Student ID</p>
              <p className="font-bold mt-0.5 text-white truncate">{user?.studentId || "N/A"}</p>
            </div>
          </div>

          {/* Department */}
          <div className="p-3.5 rounded-xl border border-zinc-900/60 bg-zinc-950/30 flex items-center gap-4 hover:border-zinc-800 transition duration-300">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-[var(--ck-text-secondary)] border border-zinc-850">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--ck-text-muted)] font-semibold">Department</p>
              <p className="font-bold mt-0.5 text-white truncate">{user?.department || "N/A"}</p>
            </div>
          </div>

          {/* Institute */}
          <div className="p-3.5 rounded-xl border border-zinc-900/60 bg-zinc-950/30 flex items-center gap-4 hover:border-zinc-800 transition duration-300">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-[var(--ck-text-secondary)] border border-zinc-850">
              <Building className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--ck-text-muted)] font-semibold">Institute</p>
              <p className="font-bold mt-0.5 text-white truncate">{user?.institute || "N/A"}</p>
            </div>
          </div>

          {/* Semester */}
          <div className="p-3.5 rounded-xl border border-zinc-900/60 bg-zinc-950/30 flex items-center gap-4 hover:border-zinc-800 transition duration-300">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-[var(--ck-text-secondary)] border border-zinc-850">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--ck-text-muted)] font-semibold">Semester</p>
              <p className="font-bold mt-0.5 text-white truncate">{user?.semester || "N/A"}</p>
            </div>
          </div>

          {/* Contact info */}
          <div className="p-3.5 rounded-xl border border-zinc-900/60 bg-zinc-950/30 flex items-center gap-4 hover:border-zinc-800 transition duration-300 sm:col-span-2">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 flex items-center justify-center text-[var(--ck-text-secondary)] border border-zinc-850">
              <Phone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--ck-text-muted)] font-semibold">Contact Phone</p>
              <p className="font-bold mt-0.5 text-white truncate">{user?.phone || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges showcase section */}
      {history?.badges?.length > 0 && (
        <div className="ck-card p-6 bg-black/30 border border-zinc-800 shadow-md">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-white font-mono border-b border-zinc-850 pb-3">
            <Shield className="w-4 h-4" style={{ color: "#FF4D00" }} /> BADGES VAULT
          </h3>
          <div className="flex flex-wrap gap-3">
            {history.badges.map((b: any) => (
              <motion.div
                key={b.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                className="p-3.5 rounded-xl text-center border border-zinc-900 bg-zinc-950/40 hover:border-[#CCFF00]/30 min-w-[90px] transition-all cursor-help"
                title={b.badge.description}
              >
                <span className="text-3xl drop-shadow-[0_0_8px_rgba(204,255,0,0.35)]">{b.badge.icon}</span>
                <p className="text-[10px] font-mono font-bold mt-1.5 text-[var(--ck-text-secondary)] uppercase">{b.badge.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Point history list */}
      {history?.points?.length > 0 && (
        <div className="ck-card p-6 bg-black/30 border border-zinc-800 shadow-md">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-tight text-white font-mono border-b border-zinc-850 pb-3">
            <TrendingUp className="w-4 h-4" style={{ color: "#CCFF00" }} /> CONTRIBUTION LEDGER
          </h3>
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {history.points.slice(0, 20).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-900 bg-zinc-950/30 text-xs font-mono">
                <div>
                  <p className="font-bold text-white uppercase">{p.category}</p>
                  {p.reason && <p className="text-[10px] text-[var(--ck-text-secondary)] mt-0.5">{p.reason}</p>}
                  <p className="text-[9px] text-[var(--ck-text-muted)] mt-0.5">Approved by {p.giver?.name || "System"} · {new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${p.points >= 0 ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/40" : "bg-red-950/30 text-red-400 border border-red-900/40"}`}>
                  {p.points >= 0 ? `+${p.points}` : p.points} PTS
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="ck-card p-6 w-full max-w-lg relative bg-zinc-955/95 border border-zinc-800 shadow-lg">
              <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition z-20">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-tight font-mono">Edit Profile Dossier</h2>
              
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
      {/* Biometric Scanning Success Overlay */}
      <AnimatePresence>
        {showBiometricScan && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6"
          >
            <div className="relative w-48 h-48 flex items-center justify-center border border-[#CCFF00]/20 rounded-full bg-zinc-900/50 shadow-[0_0_50px_rgba(204,255,0,0.1)] mb-6 overflow-hidden">
              {/* Scan line */}
              <motion.div 
                className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent shadow-[0_0_8px_rgba(204,255,0,0.8)]"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Fingerprint className="w-20 h-20 text-[#CCFF00] drop-shadow-[0_0_15px_rgba(204,255,0,0.5)]" />
              </motion.div>
            </div>
            
            <h3 className="text-xl font-bold font-mono uppercase tracking-widest mb-2" style={{ color: "#CCFF00" }}>
              BIOMETRIC VERIFIED
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider text-center max-w-sm">
              DNA Profile updated successfully. Recalibrating agent credentials.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

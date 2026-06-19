"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Plus, Trash2, Save, Users, GripVertical, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingManagementPage() {
  const { token, user } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCMSAnimation, setShowCMSAnimation] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await api<any>("/settings/landing-team");
        setTeam(data.team || []);
      } catch (err) {
        console.error("Failed to load landing team", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api("/settings/landing-team", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({ team })
      });
      setShowCMSAnimation(true);
      setTimeout(() => {
        setShowCMSAnimation(false);
      }, 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update team");
    } finally {
      setSaving(false);
    }
  };

  const addMember = () => {
    setTeam([...team, { 
      id: Date.now().toString(), 
      name: "New Member", 
      role: "TECH", 
      designation: "Position", 
      imageUrl: "",
      github: "",
      linkedin: "",
      instagram: "",
      email: ""
    }]);
  };

  const removeMember = (id: string) => {
    setTeam(team.filter(m => m.id !== id));
  };

  const updateMember = (id: string, field: string, value: string) => {
    setTeam(team.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-[#CCFF00] rounded-full animate-spin" />
      </div>
    );
  }

  // Only allow Student Coordinators and Faculty to see this page. This check is also on the backend.
  if (user?.role !== "FACULTY" && user?.role !== "STUDENT_COORDINATOR") {
    return (
      <div className="p-10 text-center text-rose-400 font-mono uppercase text-sm tracking-wider">
        Access Denied. You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tighter uppercase" style={{ color: "var(--ck-text)" }}>LANDING PAGE CMS</h1>
          <p className="mt-1 text-xs font-mono" style={{ color: "var(--ck-text-secondary)" }}>MANAGE PUBLIC TEAM DIRECTORY // CORE DIAGNOSTICS</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="ck-btn-primary flex items-center gap-2 font-mono uppercase text-xs">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="ck-card p-6 bg-black/40 border border-zinc-800 shadow-md">
        <div className="flex justify-between items-center mb-6 border-b border-zinc-850 pb-4">
          <h3 className="text-sm font-bold flex items-center gap-2 font-mono uppercase text-white">
            <Users className="w-5 h-5" style={{ color: "#CCFF00" }} /> Public Team Members
          </h3>
          <button onClick={addMember} className="ck-btn-secondary text-xs flex items-center gap-1.5 font-mono uppercase">
            <Plus className="w-3.5 h-3.5" /> Add Member
          </button>
        </div>
        
        {team.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 font-mono text-xs uppercase">No members configured.</div>
        ) : (
          <div className="space-y-4">
            {team.map((member, index) => (
              <motion.div 
                key={member.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:border-[#CCFF00]/30 shadow-[0_0_15px_rgba(204,255,0,0.03)] items-start sm:items-center transition-all duration-300"
              >
                <div className="cursor-grab text-zinc-650 hover:text-zinc-400 hidden sm:block">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center shadow-[inset_0_0_8px_rgba(204,255,0,0.1)]">
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-6 h-6" style={{ color: "#CCFF00" }} />
                  )}
                </div>
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-zinc-500">Name</label>
                    <input className="ck-input w-full py-1.5 text-sm" value={member.name} onChange={(e) => updateMember(member.id, "name", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-zinc-500">Role Category</label>
                    <select className="ck-input w-full py-1.5 text-sm" value={member.role} onChange={(e) => updateMember(member.id, "role", e.target.value)}>
                      <option value="FACULTY">Faculty</option>
                      <option value="STUDENT_COORDINATOR">Student Coordinator</option>
                      <option value="TECH">Tech</option>
                      <option value="SOCIAL_MEDIA">Social Media</option>
                      <option value="CONTENT">Content</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-zinc-500">Designation (Subtitle)</label>
                    <input className="ck-input w-full py-1.5 text-sm" value={member.designation} onChange={(e) => updateMember(member.id, "designation", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-zinc-500">Image URL</label>
                    <input className="ck-input w-full py-1.5 text-sm" value={member.imageUrl} onChange={(e) => updateMember(member.id, "imageUrl", e.target.value)} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-zinc-500">GitHub Username</label>
                    <input className="ck-input w-full py-1.5 text-sm" value={member.github || ""} onChange={(e) => updateMember(member.id, "github", e.target.value)} placeholder="e.g. johndoe" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-zinc-500">LinkedIn Username</label>
                    <input className="ck-input w-full py-1.5 text-sm" value={member.linkedin || ""} onChange={(e) => updateMember(member.id, "linkedin", e.target.value)} placeholder="e.g. johndoe" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-zinc-500">Instagram Username</label>
                    <input className="ck-input w-full py-1.5 text-sm" value={member.instagram || ""} onChange={(e) => updateMember(member.id, "instagram", e.target.value)} placeholder="e.g. johndoe" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-zinc-500">Email Address</label>
                    <input className="ck-input w-full py-1.5 text-sm" value={member.email || ""} onChange={(e) => updateMember(member.id, "email", e.target.value)} placeholder="e.g. john@cyberkavach.com" />
                  </div>
                </div>
                
                <button onClick={() => removeMember(member.id)} className="p-2.5 bg-rose-500/10 hover:bg-rose-600 text-rose-450 hover:text-white rounded-lg border border-rose-500/20 transition-all self-end sm:self-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* CMS Sync Success Overlay */}
      <AnimatePresence>
        {showCMSAnimation && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#CCFF00] to-[#FF4D00] flex items-center justify-center shadow-[0_0_30px_rgba(204,255,0,0.3)] mb-4 border border-white/10"
            >
              <CheckCircle className="w-10 h-10 text-black animate-pulse" />
            </motion.div>
            
            <h3 className="text-xl font-bold font-mono uppercase tracking-widest mb-1.5" style={{ color: "#CCFF00" }}>
              CMS DATABASE SYNCHRONIZED
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider text-center max-w-sm">
              Public directories written to edge cache network.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

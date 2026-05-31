"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Plus, Trash2, Save, Users, GripVertical } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingManagementPage() {
  const { token, user } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      alert("Landing page team updated successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update team");
    } finally {
      setSaving(false);
    }
  };

  const addMember = () => {
    setTeam([...team, { id: Date.now().toString(), name: "New Member", role: "TECH", designation: "Position", imageUrl: "" }]);
  };

  const removeMember = (id: string) => {
    setTeam(team.filter(m => m.id !== id));
  };

  const updateMember = (id: string, field: string, value: string) => {
    setTeam(team.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  // Only allow Student Coordinators and Faculty to see this page. This check is also on the backend.
  if (user?.role !== "FACULTY" && user?.role !== "STUDENT_COORDINATOR") {
    return <div className="p-10 text-center text-red-400">Access Denied. You do not have permission to view this page.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--ck-text)" }}>Landing Page CMS</h1>
          <p className="mt-1" style={{ color: "var(--ck-text-secondary)" }}>Manage the team members displayed on the public landing page</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="ck-btn-primary flex items-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="ck-card p-6 bg-black/40">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2"><Users className="text-red-500 w-5 h-5"/> Public Team Members</h3>
          <button onClick={addMember} className="ck-btn-secondary text-xs flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Member</button>
        </div>
        
        {team.length === 0 ? (
          <div className="text-center py-10 text-slate-500">No members configured.</div>
        ) : (
          <div className="space-y-4">
            {team.map((member, index) => (
              <motion.div key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 items-start sm:items-center">
                
                <div className="cursor-grab text-zinc-600 hover:text-zinc-400 hidden sm:block">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-6 h-6 text-zinc-500" />
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
                </div>
                
                <button onClick={() => removeMember(member.id)} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors self-end sm:self-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

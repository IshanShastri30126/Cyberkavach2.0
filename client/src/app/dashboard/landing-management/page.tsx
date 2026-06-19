"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, apiUpload, SERVER_BASE_URL } from "@/lib/api";
import { 
  Plus, Trash2, Save, Users, GripVertical, CheckCircle, X, 
  Edit, Eye, Upload, Link as LinkIcon, Globe, Shield, 
  Mail, Phone, BookOpen, UserCheck, ShieldAlert 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingManagementPage() {
  const { token, user } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCMSAnimation, setShowCMSAnimation] = useState(false);

  // Edit Modal State
  const [activeMember, setActiveMember] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "socials" | "media" | "cyber" | "skills">("basic");
  const [uploadingField, setUploadingField] = useState<string | null>(null);

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

  const handleAddMember = () => {
    setActiveMember({
      id: "member_" + Date.now().toString(),
      name: "New Crew Officer",
      role: "TECH",
      designation: "Security Researcher",
      imageUrl: "",
      coverPosterUrl: "",
      department: "CSE - CSPIT",
      joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      studentId: "",
      email: "",
      phone: "",
      github: "",
      linkedin: "",
      instagram: "",
      cyberAvatarUrl: "",
      cyberName: "",
      cyberSpecialAbility: "",
      cyberBackstory: "",
      about: ""
    });
    setActiveTab("basic");
  };

  const handleEditMember = (member: any) => {
    setActiveMember({
      ...member,
      coverPosterUrl: member.coverPosterUrl || "",
      department: member.department || "",
      joinedDate: member.joinedDate || "",
      studentId: member.studentId || "",
      phone: member.phone || "",
      cyberAvatarUrl: member.cyberAvatarUrl || "",
      cyberName: member.cyberName || "",
      cyberSpecialAbility: member.cyberSpecialAbility || "",
      cyberBackstory: member.cyberBackstory || "",
      about: member.about || ""
    });
    setActiveTab("basic");
  };

  const handleDeleteMember = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this crew member?")) {
      setTeam(team.filter(m => m.id !== id));
    }
  };

  const handleSaveModal = () => {
    if (!activeMember) return;
    const exists = team.some(m => m.id === activeMember.id);
    let updatedTeam;
    if (exists) {
      updatedTeam = team.map(m => m.id === activeMember.id ? activeMember : m);
    } else {
      updatedTeam = [...team, activeMember];
    }
    setTeam(updatedTeam);
    setActiveMember(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file || !activeMember) return;

    setUploadingField(fieldName);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiUpload<{ fileUrl: string }>("/settings/upload", fd, token || undefined);
      setActiveMember({
        ...activeMember,
        [fieldName]: `${SERVER_BASE_URL}${res.fileUrl}`
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingField(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-[#CCFF00] rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== "FACULTY" && user?.role !== "STUDENT_COORDINATOR") {
    return (
      <div className="p-10 text-center text-rose-400 font-mono uppercase text-sm tracking-wider">
        Access Denied. You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold font-mono tracking-tighter uppercase" style={{ color: "var(--ck-text)" }}>Landing CMS Directory</h1>
          <p className="mt-1 text-xs font-mono" style={{ color: "var(--ck-text-secondary)" }}>MANAGE PUBLIC CREW MESH // DIRECTORY DIAGNOSTICS</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAddMember} className="ck-btn-secondary text-xs flex items-center gap-1.5 font-mono uppercase">
            <Plus className="w-4 h-4" /> Add Crew Member
          </button>
          <button onClick={handleSave} disabled={saving} className="ck-btn-primary flex items-center gap-2 font-mono uppercase text-xs">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Commit Settings"}
          </button>
        </div>
      </div>

      {/* Grid of Crew Member Cards */}
      {team.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-zinc-800 bg-zinc-950/20 text-zinc-500 font-mono text-xs uppercase">
          No crew members configured. Click "Add Crew Member" to begin operations.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {team.map((member) => (
            <div 
              key={member.id} 
              className="group relative rounded-xl border border-zinc-800 hover:border-[#CCFF00]/40 bg-zinc-950/40 p-5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(204,255,0,0.06)] flex flex-col justify-between overflow-hidden"
            >
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-zinc-700 group-hover:border-[#CCFF00] transition-colors" />
              <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-zinc-700 group-hover:border-[#CCFF00] transition-colors" />
              <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-zinc-700 group-hover:border-[#CCFF00] transition-colors" />
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-zinc-700 group-hover:border-[#CCFF00] transition-colors" />

              {/* Cover Banner Mockup (Top) */}
              <div className="h-16 w-full -mx-5 -mt-5 mb-4 bg-zinc-900 border-b border-zinc-800 overflow-hidden relative">
                {member.coverPosterUrl ? (
                  <img src={member.coverPosterUrl} alt="Cover Banner" className="w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-zinc-950 to-zinc-900 opacity-60" />
                )}
                <div className="absolute top-3 left-4 text-[7px] font-mono text-zinc-500 uppercase tracking-widest">
                  {member.role}
                </div>
              </div>

              {/* Member Card Body */}
              <div className="relative">
                {/* Floating Circular Avatar */}
                <div className="w-14 h-14 rounded-full border-2 border-zinc-800 bg-zinc-900 overflow-hidden shadow-lg -mt-10 mb-3 group-hover:border-[#CCFF00] transition-colors relative z-10 mx-auto sm:mx-0">
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-650">
                      <Users className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="text-center sm:text-left">
                  <h3 className="text-base font-bold text-white tracking-tight truncate group-hover:text-[#CCFF00] transition-colors">{member.name}</h3>
                  <span className="text-[9px] font-mono text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/25 rounded px-2 py-0.5 mt-1 inline-block uppercase tracking-wider">
                    {member.role.replace("_", " ")}
                  </span>
                  <p className="text-xs text-zinc-400 mt-2 truncate">{member.designation}</p>
                  {member.department && (
                    <p className="text-[10px] text-zinc-500 mt-0.5 font-mono uppercase">{member.department}</p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center gap-2 mt-5 pt-3 border-t border-zinc-850 justify-between">
                <a 
                  href={`/team/${member.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-450 hover:text-white border border-zinc-800 transition-colors"
                  title="View Public Profile"
                >
                  <Eye className="w-4 h-4" />
                </a>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditMember(member)}
                    className="p-2 rounded bg-[#CCFF00]/5 hover:bg-[#CCFF00] text-[#CCFF00] hover:text-black border border-[#CCFF00]/20 transition-colors flex items-center gap-1 text-xs font-mono uppercase"
                    title="Edit Member Info"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button 
                    onClick={(e) => handleDeleteMember(member.id, e)}
                    className="p-2 rounded bg-rose-500/5 hover:bg-rose-600 text-rose-450 hover:text-white border border-rose-500/20 transition-colors"
                    title="Delete Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Edit/Add Member Modal Overlay */}
      <AnimatePresence>
        {activeMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="ck-card w-full max-w-4xl flex flex-col relative bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden"
              style={{ maxHeight: "90vh" }}
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#CCFF00] via-[#FF4D00] to-[#FF003C] z-10" />

              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 pt-5 pb-3 border-b border-zinc-900 shrink-0">
                <div>
                  <h2 className="text-lg font-bold font-mono uppercase text-white tracking-wide flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#CCFF00]" /> Configure Crew Member
                  </h2>
                  <p className="text-[9px] font-mono text-zinc-500 mt-0.5">ID // {activeMember.id}</p>
                </div>
                <button 
                  onClick={() => setActiveMember(null)}
                  className="p-2 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Stepper/Tabs */}
              <div className="px-6 py-3 border-b border-zinc-900 bg-zinc-950/40 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
                {[
                  { id: "basic", label: "Basic Info", icon: UserCheck },
                  { id: "socials", label: "Social Links", icon: Globe },
                  { id: "media", label: "Custom Media", icon: Upload },
                  { id: "cyber", label: "Cyber Persona", icon: Shield },
                  { id: "skills", label: "Skills / About", icon: BookOpen }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono uppercase tracking-wider transition-all duration-300 ${
                        active 
                          ? "bg-[#CCFF00]/10 text-[#CCFF00] border-[#CCFF00]/30 shadow-[0_0_12px_rgba(204,255,0,0.08)]" 
                          : "bg-transparent text-zinc-500 border-transparent hover:text-zinc-350 hover:bg-zinc-900/30"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Content Box */}
              <div className="flex-1 overflow-y-auto p-6 min-h-0">
                {activeTab === "basic" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Full Name *</label>
                      <input 
                        type="text"
                        className="ck-input w-full mt-1"
                        value={activeMember.name} 
                        onChange={(e) => setActiveMember({ ...activeMember, name: e.target.value })}
                        placeholder="e.g. Hitansh Parikh"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Role Division *</label>
                      <select 
                        className="ck-input w-full mt-1"
                        value={activeMember.role} 
                        onChange={(e) => setActiveMember({ ...activeMember, role: e.target.value })}
                      >
                        <option value="FACULTY">Faculty Coordinator</option>
                        <option value="STUDENT_COORDINATOR">Student Coordinator</option>
                        <option value="TECH">Technical Division</option>
                        <option value="SOCIAL_MEDIA">Social Media Division</option>
                        <option value="CONTENT">Content Division</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Designation (Subtitle) *</label>
                      <input 
                        type="text"
                        className="ck-input w-full mt-1"
                        value={activeMember.designation} 
                        onChange={(e) => setActiveMember({ ...activeMember, designation: e.target.value })}
                        placeholder="e.g. Lead Student Coordinator, Web Developer"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Department</label>
                      <input 
                        type="text"
                        className="ck-input w-full mt-1"
                        value={activeMember.department} 
                        onChange={(e) => setActiveMember({ ...activeMember, department: e.target.value })}
                        placeholder="e.g. CSE - CSPIT"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Joined Date</label>
                      <input 
                        type="text"
                        className="ck-input w-full mt-1"
                        value={activeMember.joinedDate} 
                        onChange={(e) => setActiveMember({ ...activeMember, joinedDate: e.target.value })}
                        placeholder="e.g. December 2025"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Student ID</label>
                      <input 
                        type="text"
                        className="ck-input w-full mt-1"
                        value={activeMember.studentId} 
                        onChange={(e) => setActiveMember({ ...activeMember, studentId: e.target.value })}
                        placeholder="e.g. 22DCS116"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Email Address</label>
                      <input 
                        type="email"
                        className="ck-input w-full mt-1"
                        value={activeMember.email} 
                        onChange={(e) => setActiveMember({ ...activeMember, email: e.target.value })}
                        placeholder="e.g. hitansh@gmail.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Phone Number</label>
                      <input 
                        type="text"
                        className="ck-input w-full mt-1"
                        value={activeMember.phone} 
                        onChange={(e) => setActiveMember({ ...activeMember, phone: e.target.value })}
                        placeholder="e.g. +91 99999 88888"
                      />
                    </div>
                  </div>
                )}

                {activeTab === "socials" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">GitHub Username (Not full link)</label>
                      <input 
                        type="text"
                        className="ck-input w-full mt-1"
                        value={activeMember.github || ""} 
                        onChange={(e) => setActiveMember({ ...activeMember, github: e.target.value })}
                        placeholder="e.g. hitanshparikh"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">LinkedIn Username (Not full link)</label>
                      <input 
                        type="text"
                        className="ck-input w-full mt-1"
                        value={activeMember.linkedin || ""} 
                        onChange={(e) => setActiveMember({ ...activeMember, linkedin: e.target.value })}
                        placeholder="e.g. hitansh-parikh"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Instagram Username (Not full link)</label>
                      <input 
                        type="text"
                        className="ck-input w-full mt-1"
                        value={activeMember.instagram || ""} 
                        onChange={(e) => setActiveMember({ ...activeMember, instagram: e.target.value })}
                        placeholder="e.g. hitansh_parikh"
                      />
                    </div>
                  </div>
                )}

                {activeTab === "media" && (
                  <div className="space-y-6">
                    {/* Profile image upload */}
                    <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40">
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Profile Photo Avatar</label>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-14 h-14 rounded-full border border-zinc-800 bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
                          {activeMember.imageUrl ? (
                            <img src={activeMember.imageUrl} alt="Profile Photo" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-5 h-5 text-zinc-650" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input 
                            type="text" 
                            className="ck-input w-full text-xs" 
                            value={activeMember.imageUrl || ""} 
                            onChange={(e) => setActiveMember({ ...activeMember, imageUrl: e.target.value })}
                            placeholder="Direct URL or upload file..."
                          />
                          <div className="relative">
                            <input 
                              type="file" 
                              id="profile-img-upload" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, "imageUrl")}
                            />
                            <label 
                              htmlFor="profile-img-upload"
                              className="ck-btn-secondary text-[10px] font-mono uppercase inline-flex items-center gap-1.5 cursor-pointer py-1.5 px-3"
                            >
                              {uploadingField === "imageUrl" ? (
                                <div className="w-3.5 h-3.5 border border-zinc-500 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              Upload Profile Photo
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cover Banner Poster upload */}
                    <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40">
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Cover Background Poster Banner</label>
                      <div className="mt-2 space-y-3">
                        {activeMember.coverPosterUrl && (
                          <div className="h-24 w-full rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
                            <img src={activeMember.coverPosterUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <input 
                            type="text" 
                            className="ck-input w-full text-xs" 
                            value={activeMember.coverPosterUrl || ""} 
                            onChange={(e) => setActiveMember({ ...activeMember, coverPosterUrl: e.target.value })}
                            placeholder="Direct URL or upload file..."
                          />
                          <div className="relative">
                            <input 
                              type="file" 
                              id="cover-img-upload" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, "coverPosterUrl")}
                            />
                            <label 
                              htmlFor="cover-img-upload"
                              className="ck-btn-secondary text-[10px] font-mono uppercase inline-flex items-center gap-1.5 cursor-pointer py-1.5 px-3 shrink-0"
                            >
                              {uploadingField === "coverPosterUrl" ? (
                                <div className="w-3.5 h-3.5 border border-zinc-500 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              Upload Banner
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "cyber" && (
                  <div className="space-y-4">
                    {/* Cyber Character Avatar upload */}
                    <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40">
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Cyber Character Avatar (Optional)</label>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-14 h-14 rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
                          {activeMember.cyberAvatarUrl ? (
                            <img src={activeMember.cyberAvatarUrl} alt="Cyber Avatar" className="w-full h-full object-cover animate-pulse" />
                          ) : (
                            <Shield className="w-5 h-5 text-zinc-650" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input 
                            type="text" 
                            className="ck-input w-full text-xs" 
                            value={activeMember.cyberAvatarUrl || ""} 
                            onChange={(e) => setActiveMember({ ...activeMember, cyberAvatarUrl: e.target.value })}
                            placeholder="Direct URL or upload file..."
                          />
                          <div className="relative">
                            <input 
                              type="file" 
                              id="cyber-img-upload" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, "cyberAvatarUrl")}
                            />
                            <label 
                              htmlFor="cyber-img-upload"
                              className="ck-btn-secondary text-[10px] font-mono uppercase inline-flex items-center gap-1.5 cursor-pointer py-1.5 px-3"
                            >
                              {uploadingField === "cyberAvatarUrl" ? (
                                <div className="w-3.5 h-3.5 border border-zinc-500 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              Upload Cyber Avatar
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Cyber Character Name (e.g. Ghost)</label>
                        <input 
                          type="text" 
                          className="ck-input w-full mt-1" 
                          value={activeMember.cyberName || ""} 
                          onChange={(e) => setActiveMember({ ...activeMember, cyberName: e.target.value })}
                          placeholder="e.g. Ghost"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Special Ability / Skills Tag</label>
                        <input 
                          type="text" 
                          className="ck-input w-full mt-1" 
                          value={activeMember.cyberSpecialAbility || ""} 
                          onChange={(e) => setActiveMember({ ...activeMember, cyberSpecialAbility: e.target.value })}
                          placeholder="e.g. Infiltrator & Recon: Covert operations"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Cyber Character Backstory (Detailed lore paragraph)</label>
                      <textarea 
                        className="ck-input w-full mt-1" 
                        rows={4} 
                        value={activeMember.cyberBackstory || ""} 
                        onChange={(e) => setActiveMember({ ...activeMember, cyberBackstory: e.target.value })}
                        placeholder="Ghost's real name is Hitansh Parikh, and he is a former SAS operator..."
                      />
                    </div>
                  </div>
                )}

                {activeTab === "skills" && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold">Bulleted Roles / Skills List (One per line)</label>
                        <span className="text-[9px] font-mono text-zinc-600">Press Enter for new line.</span>
                      </div>
                      <textarea 
                        className="ck-input w-full mt-1" 
                        rows={8}
                        value={activeMember.about || ""} 
                        onChange={(e) => setActiveMember({ ...activeMember, about: e.target.value })}
                        placeholder="Web Developer: Building beautiful, functional websites with a knack for detail.&#10;3D Artist/Animator: Crafting stunning visuals that bring ideas to life.&#10;Video Creator: Compelling storytelling through engaging videos."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-900 bg-zinc-950 shrink-0">
                <button 
                  onClick={() => setActiveMember(null)}
                  className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl transition font-mono text-xs uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveModal}
                  className="ck-btn-primary font-mono text-xs uppercase flex items-center gap-1"
                >
                  <Save className="w-4 h-4" /> Save Member Info
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

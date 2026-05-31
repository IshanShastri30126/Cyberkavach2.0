"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, SERVER_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Users, Tag, Shield, AlertCircle, CheckCircle, UserPlus, Mail, Copy, ExternalLink } from "lucide-react";

interface EventDetail {
  id: string; title: string; description?: string; venue?: string;
  startDate: string; endDate: string; registrationDeadline?: string;
  posterUrl?: string; slug: string; rules?: string; tags: string[];
  minTeamSize?: number; maxTeamSize?: number; maxCapacity?: number;
  isPublished: boolean; eventType: string; googleFormUrl?: string;
  creator: { name: string; role: string };
  _count: { registrations: number; teams: number };
}

export default function PublicEventPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showJoinTeamModal, setShowJoinTeamModal] = useState(false);
  const [joinTeamCode, setJoinTeamCode] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    email: "",
    phone: "",
    department: "",
    semester: "",
    institute: "",
    teammateCount: "0",
    teamName: ""
  });
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [teammateEmails, setTeammateEmails] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        studentId: user.studentId || "",
        email: user.email || "",
        phone: user.phone || "",
        department: user.department || "",
        semester: user.semester || "",
        institute: user.institute || "",
        teammateCount: "0",
        teamName: ""
      });
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api<{ event: EventDetail }>(`/events/public/${slug}`);
        setEvent(data.event);
        
        // If token is present, check if user is already registered for this event
        if (token && data.event) {
          const regData = await api<{ registered: boolean; teamCode?: string }>(`/events/${data.event.id}/is-registered`, { token });
          setRegistered(regData.registered);
          // Also fetch team info to see if user has an invite code
          try {
            const myTeams = await api<{ teams: any[] }>("/teams/my", { token });
            const eventTeam = myTeams.teams.find(t => t.eventId === data.event.id);
            if (eventTeam) {
              setInviteCode(eventTeam.teamCode);
            }
          } catch (err) {
            console.error("Failed to load team code:", err);
          }
        }
      } catch (err) { 
        setError(err instanceof Error ? err.message : "Event not found"); 
      } finally { 
        setLoading(false); 
      }
    };
    load();
  }, [slug, token]);

  const handleRegisterClick = () => {
    if (!token) { router.push(`/?redirect=/events/${slug}`); return; }
    setFormData({
      name: user?.name || "",
      studentId: user?.studentId || "",
      email: user?.email || "",
      phone: user?.phone || "",
      department: user?.department || "",
      semester: user?.semester || "",
      institute: user?.institute || "",
      teammateCount: "0",
      teamName: ""
    });
    setInviteCode(null);
    setTeammateEmails("");
    setShowFormModal(true);
  };

  const handleGoogleFormRegisterClick = () => {
    if (!token) { router.push(`/?redirect=/events/${slug}`); return; }
    handleGoogleFormRegister();
  };

  const handleGoogleFormRegister = async () => {
    if (!token) return;
    setRegistering(true);
    try {
      window.open(event!.googleFormUrl || undefined, "_blank", "noopener,noreferrer");
      await api(`/events/${event!.id}/register`, { method: "POST", token });
      setRegistered(true);
      alert("Registration confirmed and welcome email sent! Status updated.");
    } catch (err) {
      console.error("Google form background register failed:", err);
      alert("Failed to confirm registration in the portal.");
    } finally {
      setRegistering(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setRegistering(true);
    try {
      const body: any = {
        name: formData.name,
        studentId: formData.studentId,
        phone: formData.phone,
        department: formData.department,
        semester: formData.semester,
        institute: formData.institute
      };
      if (event?.maxTeamSize && event.maxTeamSize > 1) {
        if (formData.teamName) {
          body.teamName = formData.teamName;
        }
        if (teammateEmails.trim()) {
          body.teamMembers = teammateEmails.split(",").map(email => email.trim()).filter(Boolean);
        }
      }
      const response = await api<{ registration: any; teamCode?: string }>(
        `/events/${event!.id}/register`,
        { method: "POST", token, body: JSON.stringify(body) }
      );
      setRegistered(true);
      if (response.teamCode) {
        setInviteCode(response.teamCode);
      }
      alert("Registered successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleJoinTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setRegistering(true);
    try {
      await api(`/teams/join`, {
        method: "POST",
        token,
        body: JSON.stringify({ teamCode: joinTeamCode })
      });
      setRegistered(true);
      setInviteCode(joinTeamCode);
      setShowJoinTeamModal(false);
      alert("Joined team successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to join team");
    } finally {
      setRegistering(false);
    }
  };

  const deadlinePassed = event?.registrationDeadline
    ? new Date() > new Date(event.registrationDeadline) : false;
  const isFull = event?.maxCapacity
    ? event._count.registrations >= event.maxCapacity : false;
  const capacityPercent = event?.maxCapacity
    ? Math.min(100, Math.round((event._count.registrations / event.maxCapacity) * 100)) : 0;

  // Countdown to deadline
  const getTimeLeft = () => {
    if (!event?.registrationDeadline) return null;
    const diff = new Date(event.registrationDeadline).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return { days, hours, mins };
  };
  const timeLeft = event ? getTimeLeft() : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="ck-card p-8 max-w-md text-center border-red-900 bg-black/40">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2 text-white">Event Not Found</h2>
          <p className="text-sm text-slate-400">{error || "This event doesn't exist or has been unpublished."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-80 md:h-[450px] overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-red-950/20 to-black/80 z-10" />
        
        {/* Event Poster or Default Banner */}
        <img 
          src={event.posterUrl ? `${SERVER_BASE_URL}${event.posterUrl}` : "/images/cyber_banner.png"} 
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover opacity-40 z-0" 
        />
        
        <div className="absolute inset-0 flex items-end z-20">
          <div className="w-full max-w-7xl mx-auto px-6 md:px-8 pb-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                <span className="text-sm font-semibold text-red-400 font-mono tracking-wider uppercase">CyberKavach Club</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 uppercase font-mono tracking-tighter">{event.title}</h1>
              {event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold bg-red-950/50 text-red-400 border border-red-900/30 backdrop-blur-sm uppercase font-mono">
                      <Tag className="w-3 h-3 inline mr-1 text-red-500" />{tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 -mt-10 relative z-30 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="ck-card p-8">
              <h2 className="text-xl font-bold font-mono tracking-tighter uppercase mb-6 text-white border-b border-red-950 pb-2">Event Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/30 flex items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold font-mono text-slate-500">Date</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/30 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold font-mono text-slate-500">Time</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {new Date(event.startDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      {" — "}
                      {new Date(event.endDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                {event.venue && (
                  <div className="flex items-center gap-4 col-span-1 sm:col-span-2 lg:col-span-1">
                    <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/30 flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold font-mono text-slate-500">Venue</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{event.venue}</p>
                    </div>
                  </div>
                )}
              </div>
              {event.description && (
                <div className="mt-6 pt-6 border-t border-red-950/40">
                  <h3 className="text-sm font-bold font-mono tracking-wider uppercase mb-3 text-red-400">About</h3>
                  <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
            </motion.div>

            {/* Rules */}
            {event.rules && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="ck-card p-8">
                <h2 className="text-xl font-bold font-mono tracking-tighter uppercase mb-4 text-white border-b border-red-950 pb-2">Rules & Guidelines</h2>
                <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">{event.rules}</p>
              </motion.div>
            )}

            {/* Team Requirements */}
            {(event.minTeamSize || event.maxTeamSize) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="ck-card p-8">
                <h2 className="text-xl font-bold font-mono tracking-tighter uppercase mb-4 text-white border-b border-red-950 pb-2">Team Requirements</h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/30 flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {event.minTeamSize && event.maxTeamSize
                        ? `${event.minTeamSize} — ${event.maxTeamSize} members per team`
                        : event.minTeamSize
                        ? `Minimum ${event.minTeamSize} members`
                        : `Maximum ${event.maxTeamSize} members`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Form your team after registering via the Teams page
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar — Registration Card */}
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="ck-card p-8 sticky top-6">
              <h3 className="text-xl font-bold font-mono tracking-tighter uppercase mb-6 text-white border-b border-red-950 pb-2">Registration</h3>

              {/* Capacity Bar */}
              {event.maxCapacity && (
                <div className="mb-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-mono text-slate-400"><Users className="w-3.5 h-3.5 inline mr-1 text-red-500" />{event._count.registrations} registered</span>
                    <span className="font-medium font-mono text-slate-300">{event.maxCapacity} spots total</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-black border border-red-950">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${capacityPercent}%` }} transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full ${capacityPercent >= 90 ? "bg-red-600" : capacityPercent >= 70 ? "bg-amber-600" : "bg-gradient-to-r from-red-900 to-red-500"}`} />
                  </div>
                  {isFull && <p className="text-xs text-red-500 mt-2 font-medium font-mono">🔴 Event is at full capacity</p>}
                </div>
              )}

              {/* Deadline Countdown */}
              {event.registrationDeadline && (
                <div className="mb-6 p-4 rounded-xl border border-red-950/40 bg-black/50">
                  {timeLeft ? (
                    <>
                      <p className="text-[10px] uppercase font-bold font-mono text-center text-slate-500 mb-3 tracking-widest">Registration closes in</p>
                      <div className="flex gap-4 justify-center">
                        {[{ v: timeLeft.days, l: "Days" }, { v: timeLeft.hours, l: "Hrs" }, { v: timeLeft.mins, l: "Min" }].map((t) => (
                          <div key={t.l} className="text-center">
                            <p className="text-3xl font-extrabold font-mono text-red-500 tracking-tighter">{t.v}</p>
                            <p className="text-[9px] uppercase font-mono text-slate-500 tracking-wider mt-0.5">{t.l}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-red-500 font-semibold text-center font-mono">⏰ Registration deadline has passed</p>
                  )}
                </div>
              )}

              {/* Register Button */}
              {event.googleFormUrl ? (
                registered ? (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald-950 bg-emerald-950/30 text-emerald-400">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold uppercase font-mono tracking-widest">You&apos;re registered!</p>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleFormRegisterClick}
                    disabled={registering}
                    className="ck-btn-primary w-full py-3.5 text-sm disabled:opacity-50"
                  >
                    <ExternalLink className="w-5 h-5 inline mr-2" /> 
                    {registering ? "Registering..." : "Register via Google Form"}
                  </button>
                )
              ) : registered ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald-950 bg-emerald-950/30 text-emerald-400">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-semibold uppercase font-mono tracking-widest">You&apos;re registered!</p>
                  </div>
                  {inviteCode && (
                    <div className="p-4 rounded-xl border border-red-950/40 bg-red-950/10 text-center font-mono">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Your Invite Code</p>
                      <p className="text-lg font-bold text-red-400 tracking-wider select-all">{inviteCode}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(inviteCode);
                          alert("Invite Code copied to clipboard!");
                        }}
                        className="text-[10px] text-red-500 hover:text-white underline mt-1 flex items-center gap-1 mx-auto"
                      >
                        <Copy className="w-3 h-3" /> Copy Code
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleRegisterClick}
                    disabled={registering || deadlinePassed || isFull}
                    className="ck-btn-primary w-full py-3.5 text-sm disabled:opacity-50"
                  >
                    {registering ? "Registering..." : !token ? (
                      <><UserPlus className="w-5 h-5" /> Login & Register</>
                    ) : deadlinePassed ? "Deadline Passed" : isFull ? "Full" : (
                      <><UserPlus className="w-5 h-5" /> Register Now</>
                    )}
                  </button>
                  {token && (event.minTeamSize && event.minTeamSize > 1) && (
                    <button
                      onClick={() => setShowJoinTeamModal(true)}
                      className="ck-btn-secondary w-full py-3 text-xs"
                    >
                      Join Team via Invite Code
                    </button>
                  )}
                </div>
              )}

              {!event.maxCapacity && (
                <p className="text-xs mt-4 text-center font-mono text-slate-500">
                  <Users className="w-3.5 h-3.5 inline mr-1 text-red-500" />{event._count.registrations} registered · Open spots
                </p>
              )}

              {/* Organizer */}
              <div className="mt-6 pt-6 border-t border-red-950">
                <p className="text-[10px] uppercase font-semibold font-mono text-slate-500" style={{ color: "var(--ck-text-muted)" }}>Organized by</p>
                <p className="text-sm font-bold text-white mt-1">{event.creator.name}</p>
                <p className="text-xs text-red-400 font-mono mt-0.5 uppercase tracking-wider">{event.creator.role.replace(/_/g, " ")}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Registration Details Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="ck-card max-w-md w-full p-6 relative">
            <button onClick={() => setShowFormModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
            
            {registered ? (
              <div className="text-center py-4 space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <CheckCircle className="w-8 h-8 text-emerald-400 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-mono text-white uppercase tracking-tighter">ACCESS GRANTED</h3>
                  <p className="text-xs text-emerald-400/80 font-mono mt-1 uppercase tracking-widest font-semibold">Registration Successful</p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 text-left space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-500 uppercase">Event</span>
                    <span className="text-white font-semibold truncate max-w-[200px]">{event.title}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-500 uppercase">Registrant</span>
                    <span className="text-white font-semibold">{formData.name}</span>
                  </div>
                  {formData.studentId && (
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">ID</span>
                      <span className="text-white font-semibold">{formData.studentId}</span>
                    </div>
                  )}
                  {formData.teamName && (
                    <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                      <span className="text-zinc-500 uppercase">Team Name</span>
                      <span className="text-white font-semibold">{formData.teamName}</span>
                    </div>
                  )}
                </div>

                {inviteCode && (
                  <div className="p-5 rounded-xl border border-red-950/40 bg-red-950/10 text-center relative overflow-hidden group">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold mb-2">Teammate Invite Code</p>
                    <p className="text-2xl font-extrabold text-red-400 tracking-wider font-mono select-all select-none">{inviteCode}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(inviteCode);
                        alert("Invite Code copied to clipboard!");
                      }}
                      className="text-xs text-red-400 hover:text-white underline mt-2.5 flex items-center gap-1.5 mx-auto font-mono"
                    >
                      <Copy className="w-3.5 h-3.5" /> COPY INVITE CODE
                    </button>
                  </div>
                )}

                <button 
                  onClick={() => setShowFormModal(false)} 
                  className="ck-btn-primary w-full py-3 font-mono font-bold uppercase tracking-wider text-xs"
                >
                  Complete
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold font-mono text-white mb-2 uppercase tracking-tighter">Registration Form</h3>
                <p className="text-xs text-slate-400 mb-6 font-mono">Fill in your operational details to register.</p>
                
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Full Name *</label>
                    <input 
                      className="ck-input" 
                      placeholder="e.g. John Doe" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="ck-label font-mono uppercase tracking-wider text-[10px]">College / Guest ID *</label>
                      <input 
                        className="ck-input" 
                        placeholder="e.g. 22CS101" 
                        value={formData.studentId} 
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} 
                        required 
                      />
                    </div>
                    <div>
                      <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Contact Phone *</label>
                      <input 
                        className="ck-input" 
                        placeholder="Phone number" 
                        value={formData.phone} 
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Semester</label>
                      <input 
                        className="ck-input" 
                        placeholder="1-8" 
                        value={formData.semester} 
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })} 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Department</label>
                      <input 
                        className="ck-input" 
                        placeholder="e.g. Computer Science" 
                        value={formData.department} 
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Institute / College</label>
                    <input 
                      className="ck-input" 
                      placeholder="e.g. CSPIT" 
                      value={formData.institute} 
                      onChange={(e) => setFormData({ ...formData, institute: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Email (Login Identifier)</label>
                    <input className="ck-input bg-zinc-900 border-zinc-800 text-zinc-550 cursor-not-allowed text-xs truncate" value={formData.email} disabled />
                  </div>

                  {event && event.maxTeamSize && event.maxTeamSize > 1 && (
                    <div className="p-4 rounded-xl border border-red-900/30 bg-red-950/10 space-y-4">
                      <p className="text-xs font-semibold text-red-400 font-mono uppercase tracking-wider">Team Configurations Required</p>
                      <div>
                        <label className="ck-label font-mono text-[10px]">Team Name *</label>
                        <input 
                          className="ck-input" 
                          placeholder="e.g. Hex Hunters" 
                          value={formData.teamName} 
                          onChange={(e) => setFormData({ ...formData, teamName: e.target.value })} 
                          required 
                        />
                      </div>
                      <div>
                        <label className="ck-label font-mono text-[10px]">Teammate Emails (comma-separated)</label>
                        <input 
                          className="ck-input" 
                          placeholder="e.g. member1@gmail.com, member2@gmail.com" 
                          value={teammateEmails} 
                          onChange={(e) => setTeammateEmails(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="ck-label font-mono text-[10px]">Estimated Teammates Count</label>
                        <input 
                          type="number" 
                          min="1" 
                          max={event.maxTeamSize - 1} 
                          className="ck-input" 
                          placeholder="Number of teammates" 
                          value={formData.teammateCount} 
                          onChange={(e) => setFormData({ ...formData, teammateCount: e.target.value })} 
                        />
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={registering} className="ck-btn-primary w-full mt-6">
                    {registering ? "Processing Registration..." : "Confirm Registration"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Join Team via Invite Code Modal */}
      {showJoinTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="ck-card max-w-md w-full p-6 relative">
            <button onClick={() => setShowJoinTeamModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
            <h3 className="text-xl font-bold font-mono text-white mb-2 uppercase tracking-tighter">Join Event Team</h3>
            <p className="text-xs text-slate-400 mb-6 font-mono">Enter the invite code generated by your team leader.</p>
            
            <form onSubmit={handleJoinTeamSubmit} className="space-y-4">
              <div>
                <label className="ck-label font-mono uppercase tracking-wider text-[10px]">Invite Code *</label>
                <input 
                  className="ck-input tracking-widest text-center uppercase font-mono font-bold border-red-500/30 text-red-400 focus:border-red-500" 
                  placeholder="CK-T-XXXXXX" 
                  value={joinTeamCode} 
                  onChange={(e) => setJoinTeamCode(e.target.value.toUpperCase())} 
                  required 
                />
              </div>

              <button type="submit" disabled={registering || !joinTeamCode.trim()} className="ck-btn-primary w-full mt-6">
                {registering ? "Joining Team..." : "Join Team & Register"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

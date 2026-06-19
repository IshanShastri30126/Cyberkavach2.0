"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, SERVER_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Clock, Users, Tag, Shield, AlertCircle, CheckCircle, UserPlus, Mail, Copy, ExternalLink, Eye, X, Search, Phone, FileText, Download } from "lucide-react";

const LinkedinIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: '1.2em', height: '1.2em', ...style }}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ width: '1.2em', height: '1.2em', ...style }}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

interface EventDetail {
  id: string; title: string; description?: string; venue?: string;
  startDate: string; endDate: string; registrationDeadline?: string;
  posterUrl?: string; slug: string; rules?: string; tags: string[];
  minTeamSize?: number; maxTeamSize?: number; maxCapacity?: number;
  isPublished: boolean; eventType: string; googleFormUrl?: string;
  creator: { name: string; role: string };
  _count: { registrations: number; teams: number };
  documentUrl?: string;
  organizers?: string;
  socialLinks?: string;
}

// Theme → gradient mapping for dynamic background
const EVENT_THEME_GRADIENTS: Record<string, string> = {
  hackathon: "from-[#0a0014] via-[#130030] to-[#020020]",
  workshop: "from-[#001a0a] via-[#002e14] to-[#001208]",
  competition: "from-[#1a0000] via-[#300005] to-[#110000]",
  seminar: "from-[#00101a] via-[#001e30] to-[#000b14]",
  meetup: "from-[#0d0014] via-[#1a0028] to-[#080010]",
  general: "from-[#0a0a0a] via-[#111111] to-[#050505]",
};

const EVENT_THEME_ACCENT: Record<string, string> = {
  hackathon: "#a855f7",
  workshop: "#22c55e",
  competition: "#ef4444",
  seminar: "#3b82f6",
  meetup: "#f59e0b",
  general: "#CCFF00",
};

// Animated letter-by-letter title
function AnimatedTitle({ text, accent }: { text: string; accent: string }) {
  return (
    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 uppercase font-mono tracking-tighter">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.3 }}
          style={char !== " " && i % 6 === 0 ? { color: accent } : {}}
        >
          {char}
        </motion.span>
      ))}
    </h1>
  );
}

// Formatted description — detects bullet points and paragraph breaks
function FormattedDescription({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);
  const highlights: string[] = [];
  const regularParagraphs: string[] = [];

  paragraphs.forEach(p => {
    const trimmed = p.trim();
    const isBulletBlock = trimmed.split("\n").every(line => /^[•\-*>]/.test(line.trim()));
    if (isBulletBlock) {
      highlights.push(...trimmed.split("\n").map(l => l.replace(/^[•\-*>]\s*/, "").trim()).filter(Boolean));
    } else {
      regularParagraphs.push(trimmed);
    }
  });

  return (
    <div className="space-y-5">
      {regularParagraphs.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed text-slate-300">
          {p.split("\n").map((line, li) => (
            <React.Fragment key={li}>
              {line}
              {li < p.split("\n").length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      ))}
      {highlights.length > 0 && (
        <div>
          <p className="text-[10px] font-bold font-mono tracking-widest uppercase text-red-400 mb-3">✦ Key Highlights</p>
          <ul className="space-y-2">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PublicEventPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  // Read ?invite= from URL for QR deep-link
  const inviteFromUrl = searchParams?.get("invite") || "";
  const isFullFromUrl = searchParams?.get("isFull") === "true";
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
  const [showPosterLightbox, setShowPosterLightbox] = useState(false);

  // Auto-fill invite code from QR deep-link
  useEffect(() => {
    if (inviteFromUrl) {
      setJoinTeamCode(inviteFromUrl);
      if (!isFullFromUrl) {
        setShowJoinTeamModal(true);
      }
    }
  }, [inviteFromUrl]);

  // Teammate search states
  const [memberSearch, setMemberSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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

  const searchMembers = async (q: string) => {
    setMemberSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const data = await api<{ users: any[] }>(`/users/search?q=${q}`, { token: token || undefined });
      // Only show users who are approved, not current user, and not already selected
      setSearchResults(data.users.filter((u) => u.id !== user?.id && !selectedMembers.find((m) => m.id === u.id)));
    } catch { setSearchResults([]); }
  };

  // Sync estimated count with selected members
  useEffect(() => {
    setFormData(prev => ({ ...prev, teammateCount: selectedMembers.length.toString() }));
  }, [selectedMembers]);

  const handleRegisterClick = () => {
    if (!token) { router.push(`/auth?redirect=/events/${slug}`); return; }
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
    setSelectedMembers([]);
    setMemberSearch("");
    setSearchResults([]);
    setShowFormModal(true);
  };

  const handleGoogleFormRegisterClick = () => {
    if (!token) { router.push(`/auth?redirect=/events/${slug}`); return; }
    handleGoogleFormRegister();
  };

  const handleGoogleFormRegister = async () => {
    if (!token) return;
    setRegistering(true);
    try {
      window.open(event!.googleFormUrl || undefined, "_blank", "noopener,noreferrer");
      await api(`/events/${event!.id}/register`, { method: "POST", token });
      setRegistered(true);
      showToast("Registration confirmed! Welcome email dispatched.", "success");
    } catch (err) {
      console.error("Google form background register failed:", err);
      showToast("Failed to confirm registration in the portal.", "error");
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
        if (selectedMembers.length > 0) {
          body.teamMembers = selectedMembers.map(m => m.email);
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
      showToast("Registered successfully!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Registration failed", "error");
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
      showToast("Joined team successfully!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to join team", "error");
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

  const themeGradient = event ? (EVENT_THEME_GRADIENTS[event.eventType] || EVENT_THEME_GRADIENTS.general) : "from-black to-black";
  const themeAccent = event ? (EVENT_THEME_ACCENT[event.eventType] || EVENT_THEME_ACCENT.general) : "#CCFF00";

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeGradient}`}>
      {/* Hero Section */}
      <div className="relative h-80 md:h-[450px] overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-red-950/20 to-black/80 z-10" />
        
        {/* Event Poster or Default Banner */}
        <img
          src={event.posterUrl ? `${SERVER_BASE_URL}${event.posterUrl}` : "/images/cyber_banner.png"}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover opacity-80 z-0"
        />

        <div className="absolute inset-0 flex items-end z-20">
          <div className="w-full max-w-7xl mx-auto px-6 md:px-8 pb-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 shadow-[0_0_8px_rgba(239,68,68,0.5)]" style={{ color: themeAccent }} />
                <span className="text-sm font-semibold font-mono tracking-wider uppercase" style={{ color: themeAccent }}>CyberKavach Club</span>
              </div>
              <AnimatedTitle text={event.title} accent={themeAccent} />
              <div className="flex flex-wrap items-center gap-3">
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 rounded-full text-xs font-semibold bg-red-950/50 text-red-400 border border-red-900/30 backdrop-blur-sm uppercase font-mono">
                        <Tag className="w-3 h-3 inline mr-1 text-red-500" />{tag}
                      </span>
                    ))}
                  </div>
                )}
                {event.posterUrl && (
                  <button
                    onClick={() => setShowPosterLightbox(true)}
                    className="px-3 py-1.5 rounded-full text-xs font-mono font-bold bg-black/60 border border-zinc-800 hover:border-red-500/50 hover:text-red-400 transition-all flex items-center gap-1.5 w-fit"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Full Poster
                  </button>
                )}
              </div>
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
                  <h3 className="text-sm font-bold font-mono tracking-wider uppercase mb-4" style={{ color: themeAccent }}>About This Event</h3>
                  <FormattedDescription text={event.description} />
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

            {/* Supportive Documents Card */}
            {(() => {
              const parseDocs = (docUrl?: string | null): string[] => {
                if (!docUrl) return [];
                if (docUrl.startsWith("[")) {
                  try {
                    return JSON.parse(docUrl);
                  } catch {
                    return [docUrl];
                  }
                }
                return [docUrl];
              };
              const docs = parseDocs(event.documentUrl);
              if (docs.length === 0) return null;
              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="ck-card p-8">
                  <h2 className="text-xl font-bold font-mono tracking-tighter uppercase mb-4 text-white border-b border-red-950 pb-2">Supportive Documents</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {docs.map((docUrl, idx) => (
                      <a key={idx} href={`${SERVER_BASE_URL}${docUrl}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-[#0D0F14]/30 hover:border-red-500/40 hover:bg-[#0D0F14]/50 transition-all font-mono">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-5 h-5 text-red-500 shrink-0" />
                          <span className="text-xs text-zinc-350 truncate">{docUrl.split("/").pop()}</span>
                        </div>
                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest shrink-0 border border-red-900/30 px-2 py-0.5 rounded">DOWNLOAD</span>
                      </a>
                    ))}
                  </div>
                </motion.div>
              );
            })()}

            {/* Organizing Team Section */}
            {(() => {
              let organizers: any[] = [];
              if (event.organizers) {
                try {
                  organizers = JSON.parse(event.organizers);
                } catch (e) {
                  console.error(e);
                }
              }
              if (organizers.length === 0) return null;
              // Sort: Faculty Coordinator first, then Student Coordinator, then others
              const roleOrder = (role: string) => {
                const r = role.toLowerCase();
                if (r.includes("faculty")) return 0;
                if (r.includes("student") || r.includes("coordinator")) return 1;
                return 2;
              };
              const sorted = [...organizers].sort((a, b) => roleOrder(a.role) - roleOrder(b.role));
              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="ck-card p-8">
                  <h2 className="text-xl font-bold font-mono tracking-tighter uppercase mb-6 text-white border-b border-red-950 pb-2">Organizing Team</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sorted.map((org: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-zinc-800 bg-[#0D0F14]/30 flex flex-col justify-between hover:border-red-500/30 transition-all group relative overflow-hidden">
                        {/* Corner brackets */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500/20 group-hover:border-red-500 transition-colors" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-500/20 group-hover:border-red-500 transition-colors" />
                        {/* Faculty/Student coordinator badge */}
                        {(org.role.toLowerCase().includes("faculty") || org.role.toLowerCase().includes("coordinator")) && (
                          <div className="absolute top-2 right-6 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-widest" style={{ backgroundColor: `${themeAccent}18`, color: themeAccent, border: `1px solid ${themeAccent}30` }}>PRIMARY</div>
                        )}
                        <div>
                          <p className="text-xs font-mono text-red-500 uppercase tracking-widest font-bold mb-1">{org.role}</p>
                          <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">{org.name}</h3>
                        </div>
                        <div className="mt-4 pt-3 border-t border-zinc-900 space-y-1.5 text-xs text-slate-400 font-mono">
                          {org.phone && (
                            <a href={`tel:${org.phone}`} className="flex items-center gap-2 hover:text-white transition font-bold">
                              <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: themeAccent }} />
                              <span style={{ color: themeAccent }}>{org.phone}</span>
                            </a>
                          )}
                          <a href={`mailto:${org.email}`} className="flex items-center gap-2 hover:text-white transition">
                            <Mail className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span className="truncate">{org.email}</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })()}
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

            {/* CyberKavach Community Links Card — with event socialLinks */}
            {(() => {
              let socialLinks: Record<string, string> = {};
              if (event.socialLinks) {
                try { socialLinks = JSON.parse(event.socialLinks); } catch {}
              }
              const instagramUrl = socialLinks.instagram || "https://instagram.com/cyberkavach";
              const linkedinUrl = socialLinks.linkedin || "https://linkedin.com/company/cyberkavach";
              const whatsappUrl = socialLinks.whatsapp || "https://chat.whatsapp.com/cyberkavach";
              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="ck-card p-6 mt-4">
                  <h3 className="text-sm font-bold font-mono tracking-tighter uppercase mb-4 text-white border-b border-red-950 pb-2">CyberKavach Network</h3>
                  <div className="space-y-2.5">
                    <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-800 bg-[#0D0F14]/30 hover:border-blue-500/40 hover:bg-blue-950/10 transition-all font-mono text-xs text-slate-350 group">
                      <LinkedinIcon className="w-4 h-4" style={{ color: themeAccent }} />
                      <span className="group-hover:text-white transition">LinkedIn Channel</span>
                    </a>
                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-800 bg-[#0D0F14]/30 hover:border-pink-500/40 hover:bg-pink-950/10 transition-all font-mono text-xs text-slate-350 group">
                      <InstagramIcon className="w-4 h-4" style={{ color: themeAccent }} />
                      <span className="group-hover:text-white transition">Instagram Feed</span>
                    </a>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-800 bg-[#0D0F14]/30 hover:border-green-500/40 hover:bg-green-950/10 transition-all font-mono text-xs text-slate-350 group">
                      <span className="text-sm leading-none shrink-0" style={{ color: themeAccent }}>💬</span>
                      <span className="group-hover:text-white transition">WhatsApp Community</span>
                    </a>
                    {isFullFromUrl && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg border border-red-900/40 bg-red-950/10 font-mono text-xs text-red-400">
                        <Users className="w-4 h-4 shrink-0" />
                        <span>This team is currently full.</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })()}
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
                        type="tel"
                        inputMode="numeric"
                        placeholder="Phone number (digits only)"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9+\-\s]/g, "") })}
                        maxLength={15}
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
                    <div className="p-4 rounded-xl border border-red-900/30 bg-red-950/10 space-y-4 font-mono">
                      <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Team Configurations Required</p>
                      <div>
                        <label className="ck-label text-[10px]">Team Name *</label>
                        <input 
                          className="ck-input" 
                          placeholder="e.g. Hex Hunters" 
                          value={formData.teamName} 
                          onChange={(e) => setFormData({ ...formData, teamName: e.target.value })} 
                          required 
                        />
                      </div>
                      <div>
                        <label className="ck-label text-[10px]">Add Teammates * (Must be registered & approved)</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            className="ck-input pl-9" 
                            placeholder="Search teammate by name or email..." 
                            value={memberSearch} 
                            onChange={(e) => searchMembers(e.target.value)} 
                          />
                        </div>
                        {searchResults.length > 0 && (
                          <div className="mt-2 rounded-xl border border-red-900/30 max-h-40 overflow-y-auto bg-black/95 z-50 relative">
                            {searchResults.map((u) => (
                              <button 
                                key={u.id} 
                                type="button" 
                                onClick={() => { 
                                  setSelectedMembers([...selectedMembers, u]); 
                                  setSearchResults([]); 
                                  setMemberSearch(""); 
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs hover:bg-red-950/20 text-slate-300 border-b border-red-950/20 last:border-b-0 flex items-center justify-between"
                              >
                                <span className="truncate">{u.name} ({u.email})</span>
                                {u.isApproved ? (
                                  <span className="text-[9px] text-emerald-400 shrink-0 font-bold ml-2">APPROVED</span>
                                ) : (
                                  <span className="text-[9px] text-amber-500 shrink-0 font-bold ml-2">PENDING</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        {selectedMembers.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {selectedMembers.map((m) => (
                              <span key={m.id} className="ck-badge ck-badge-primary flex items-center gap-1.5 py-1 text-xs">
                                <span>{m.name}</span>
                                {!m.isApproved && (
                                  <span className="text-[8px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded border border-amber-500/25">UNAPPROVED</span>
                                )}
                                <button 
                                  type="button" 
                                  onClick={() => setSelectedMembers(selectedMembers.filter((s) => s.id !== m.id))} 
                                  className="hover:text-red-400 p-0.5"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="ck-label text-[10px]">Estimated Teammates Count</label>
                        <input 
                          type="number" 
                          min="1" 
                          max={event.maxTeamSize - 1} 
                          className="ck-input cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-400" 
                          placeholder="Number of teammates" 
                          value={formData.teammateCount} 
                          disabled
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

      {/* Poster Lightbox Modal */}
      {showPosterLightbox && event.posterUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in" onClick={() => setShowPosterLightbox(false)}>
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowPosterLightbox(false)} className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/80 hover:bg-red-500/20 text-red-500 border border-zinc-800"><X className="w-5 h-5" /></button>
            <img 
              src={`${SERVER_BASE_URL}${event.posterUrl}`} 
              alt={event.title} 
              className="max-w-full max-h-[85vh] object-contain rounded-xl border border-zinc-800 shadow-2xl" 
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 p-4 rounded-xl border shadow-2xl ${
              toast.type === "success" 
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200" 
                : toast.type === "error" 
                ? "bg-red-950/90 border-red-500/50 text-red-200" 
                : "bg-zinc-900/90 border-zinc-700/50 text-zinc-200"
            }`}
          >
            {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
            <span className="text-sm font-mono tracking-tight">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80 p-0.5 rounded bg-black/30">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PublicEventPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <PublicEventPageContent />
    </Suspense>
  );
}

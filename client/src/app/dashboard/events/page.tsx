"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, apiUpload } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Plus, X, ExternalLink, Users, MapPin, Clock, Eye, EyeOff,
  Search, Upload, ChevronRight, ChevronLeft, Image, FileText,
  Link2, BookOpen, UserPlus, Info, CheckCircle2, ChevronDown,
  Terminal, Award, Presentation, AlertTriangle, Check, UploadCloud, Layers, Edit
} from "lucide-react";

// ─── Mini Calendar Component ────────────────────────────────
function MiniCalendar({ selectedDate, onSelect, rangeStart, rangeEnd, label, onClear }: {
  selectedDate: string; onSelect: (iso: string) => void;
  rangeStart?: string; rangeEnd?: string; label: string;
  onClear?: () => void;
}) {
  const sel = selectedDate ? new Date(selectedDate) : null;
  const [viewDate, setViewDate] = useState(() => sel ? new Date(sel.getFullYear(), sel.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  useEffect(() => {
    if (sel) {
      setViewDate(new Date(sel.getFullYear(), sel.getMonth(), 1));
    }
  }, [selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const isInRange = (d: Date) => {
    if (!rangeStart || !rangeEnd) return false;
    const rs = new Date(rangeStart); rs.setHours(0, 0, 0, 0);
    const re = new Date(rangeEnd); re.setHours(0, 0, 0, 0);
    return d >= rs && d <= re;
  };

  const isSelected = (d: Date) => {
    if (!sel) return false;
    return d.getFullYear() === sel.getFullYear() && d.getMonth() === sel.getMonth() && d.getDate() === sel.getDate();
  };

  const handleDayClick = (day: number) => {
    const time = sel ? `${String(sel.getHours()).padStart(2, "0")}:${String(sel.getMinutes()).padStart(2, "0")}` : "09:00";
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${time}`;
    onSelect(dateStr);
  };

  const handleTimeChange = (time: string) => {
    if (!sel) return;
    const dateStr = `${sel.getFullYear()}-${String(sel.getMonth() + 1).padStart(2, "0")}-${String(sel.getDate()).padStart(2, "0")}T${time}`;
    onSelect(dateStr);
  };

  const currentTime = sel ? `${String(sel.getHours()).padStart(2, "0")}:${String(sel.getMinutes()).padStart(2, "0")}` : "";

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-zinc-700 shadow-md">
      <div className="px-3.5 py-2.5 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">{label}</span>
        <div className="flex items-center gap-1">
          {sel && (
            <span className="text-[10px] text-red-400 font-bold font-mono bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded">
              {sel.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {sel && onClear && (
            <button type="button" onClick={onClear} className="text-[10px] text-red-500 hover:text-white transition bg-red-950/50 hover:bg-red-905 border border-red-900/40 rounded px-1.5 py-0.5 font-mono">
              CLEAR
            </button>
          )}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-xs font-semibold font-mono tracking-wide uppercase text-zinc-300">{MONTHS[month]} {year}</span>
          <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"><ChevronRight className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-[9px] text-zinc-600 font-bold uppercase font-mono py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const d = new Date(year, month, day); d.setHours(0, 0, 0, 0);
            const selected = isSelected(d);
            const inRange = isInRange(d);
            const isPast = d < today;
            return (
              <button key={day} type="button" disabled={isPast}
                onClick={() => handleDayClick(day)}
                className={`w-full aspect-square rounded-lg text-xs font-bold font-mono transition-all duration-150 ${
                  selected ? "bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)] border border-red-400/40" :
                  inRange ? "bg-red-950/30 text-red-300 border border-red-900/20" :
                  isPast ? "text-zinc-800 cursor-not-allowed" :
                  "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}>{day}</button>
            );
          })}
        </div>
        {sel && (
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider font-mono">Time:</span>
            <input type="time" value={currentTime} onChange={(e) => handleTimeChange(e.target.value)}
              className="ck-input py-1 px-2 text-xs flex-1 max-w-[100px] border border-zinc-800 focus:border-red-500/50" />
          </div>
        )}
      </div>
    </div>
  );
}

interface Event {
  id: string; title: string; description?: string; venue?: string; startDate: string; endDate: string;
  slug: string; isPublished: boolean; isDraft: boolean; maxCapacity?: number; tags: string[]; eventType: string;
  posterUrl?: string; registrationDeadline?: string; minTeamSize?: number; maxTeamSize?: number;
  documentUrl?: string; rules?: string; googleFormUrl?: string;
  creator: { id: string; name: string; role: string };
  _count: { registrations: number; teams?: number; attendance?: number };
}

const STEPS = [
  { id: 1, label: "Basic Info", icon: Info },
  { id: 2, label: "Schedule", icon: Calendar },
  { id: 3, label: "Participants", icon: UserPlus },
  { id: 4, label: "Details & Media", icon: Image },
];

const EVENT_TYPES = [
  { value: "general", label: "General", icon: Layers, desc: "Standard events and social gatherings" },
  { value: "workshop", label: "Workshop", icon: BookOpen, desc: "Interactive hands-on learning sessions" },
  { value: "hackathon", label: "Hackathon", icon: Terminal, desc: "Intense coding and building sprints" },
  { value: "seminar", label: "Seminar", icon: Presentation, desc: "Educational talks and presentations" },
  { value: "competition", label: "Competition", icon: Award, desc: "Cybersecurity contests and challenges" },
  { value: "meetup", label: "Meetup", icon: Users, desc: "Networking and community meetups" },
];

export default function EventsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "upcoming" | "past">("all");
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const isCoord = user && ["FACULTY", "STUDENT_COORDINATOR", "TECH"].includes(user.role);

  const [form, setForm] = useState({
    title: "", description: "", venue: "", startDate: "", endDate: "",
    maxCapacity: "", eventType: "general", tags: "",
    registrationDeadline: "", minTeamSize: "", maxTeamSize: "", rules: "",
    googleFormUrl: "",
    documentUrl: "",
    posterUrl: "",
  });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Drag & Drop state
  const [isPosterDragging, setIsPosterDragging] = useState(false);
  const [isDocDragging, setIsDocDragging] = useState(false);

  const load = async () => {
    try {
      const endpoint = isCoord ? "/events/all" : "/events";
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (isCoord && statusFilter !== "all") params.set("status", statusFilter);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const data = await api<{ events: Event[] }>(`${endpoint}${qs}`, { token: token || undefined });
      setEvents(data.events);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); }, [token, searchQuery, statusFilter]);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPosterFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPosterPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else { setPosterPreview(null); }
  };

  // Drag and drop handlers for poster
  const handlePosterDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPosterDragging(true);
  };
  const handlePosterDragLeave = () => {
    setIsPosterDragging(false);
  };
  const handlePosterDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPosterDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPosterPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Drag and drop handlers for supporting document
  const handleDocDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDocDragging(true);
  };
  const handleDocDragLeave = () => {
    setIsDocDragging(false);
  };
  const handleDocDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDocDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setDocumentFile(file);
    }
  };

  // Tag helper functions
  const tagList = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed) return;
    if (tagList.includes(trimmed)) return;
    const updatedTags = [...tagList, trimmed].join(",");
    setForm({ ...form, tags: updatedTags });
  };
  const removeTag = (indexToRemove: number) => {
    const updatedTags = tagList.filter((_, i) => i !== indexToRemove).join(",");
    setForm({ ...form, tags: updatedTags });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    try {
      const body: any = {
        title: form.title, description: form.description || undefined,
        venue: form.venue || undefined,
        startDate: form.startDate, endDate: form.endDate,
        maxCapacity: form.maxCapacity ? parseInt(form.maxCapacity) : null,
        eventType: form.eventType,
        tags: tagList,
        registrationDeadline: form.registrationDeadline || null,
        minTeamSize: form.minTeamSize ? parseInt(form.minTeamSize) : null,
        maxTeamSize: form.maxTeamSize ? parseInt(form.maxTeamSize) : null,
        rules: form.rules || null,
        googleFormUrl: form.googleFormUrl || null,
        documentUrl: form.documentUrl || null,
      };

      let eventId = editingEventId;
      if (editingEventId) {
        await api(`/events/${editingEventId}`, {
          method: "PATCH", token: token || undefined, body: JSON.stringify(body),
        });
      } else {
        const created = await api<{ event: Event }>("/events", {
          method: "POST", token: token || undefined, body: JSON.stringify(body),
        });
        eventId = created.event.id;
      }

      if (posterFile && eventId) {
        const fd = new FormData();
        fd.append("poster", posterFile);
        await apiUpload(`/events/${eventId}/poster`, fd, token || undefined);
      }
      if (documentFile && eventId) {
        const fd = new FormData();
        fd.append("document", documentFile);
        await apiUpload(`/events/${eventId}/document`, fd, token || undefined);
      }

      setShowCreate(false); setStep(1); setEditingEventId(null);
      setForm({ title: "", description: "", venue: "", startDate: "", endDate: "", maxCapacity: "", eventType: "general", tags: "", registrationDeadline: "", minTeamSize: "", maxTeamSize: "", rules: "", googleFormUrl: "", documentUrl: "", posterUrl: "" });
      setPosterFile(null); setPosterPreview(null); setDocumentFile(null);
      load();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
    finally { setCreating(false); }
  };

  const handleStartEdit = (event: Event) => {
    setEditingEventId(event.id);
    setForm({
      title: event.title || "",
      description: event.description || "",
      venue: event.venue || "",
      startDate: event.startDate || "",
      endDate: event.endDate || "",
      maxCapacity: event.maxCapacity ? String(event.maxCapacity) : "",
      eventType: event.eventType || "general",
      tags: event.tags ? event.tags.join(",") : "",
      registrationDeadline: event.registrationDeadline || "",
      minTeamSize: event.minTeamSize ? String(event.minTeamSize) : "",
      maxTeamSize: event.maxTeamSize ? String(event.maxTeamSize) : "",
      rules: event.rules || "",
      googleFormUrl: event.googleFormUrl || "",
      documentUrl: event.documentUrl || "",
      posterUrl: event.posterUrl || "",
    });
    setPosterPreview(event.posterUrl ? `http://localhost:4000${event.posterUrl}` : null);
    setPosterFile(null);
    setDocumentFile(null);
    setStep(1);
    setShowCreate(true);
  };

  const handlePublish = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api(`/events/${id}/publish`, { method: "PATCH", token: token || undefined });
      load();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  const handleRegister = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api(`/events/${id}/register`, { method: "POST", token: token || undefined });
      alert("Registered successfully!"); load();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
  };

  // Client-side time filter
  const now = new Date();
  const filteredEvents = events.filter((ev) => {
    if (timeFilter === "upcoming") return new Date(ev.startDate) >= now;
    if (timeFilter === "past") return new Date(ev.endDate) < now;
    return true;
  });

  // Step Validation logic
  const isStepValid = (stepNum: number) => {
    if (stepNum === 1) return form.title.length >= 3;
    if (stepNum === 2) {
      if (!form.startDate || !form.endDate) return false;
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end <= start) return false;
      if (form.registrationDeadline) {
        const deadline = new Date(form.registrationDeadline);
        if (deadline > start) return false;
      }
      return true;
    }
    if (stepNum === 3) {
      if (form.maxCapacity) {
        const cap = parseInt(form.maxCapacity);
        if (isNaN(cap) || cap <= 0) return false;
      }
      if (form.minTeamSize) {
        const minS = parseInt(form.minTeamSize);
        if (isNaN(minS) || minS <= 0) return false;
      }
      if (form.maxTeamSize) {
        const maxS = parseInt(form.maxTeamSize);
        if (isNaN(maxS) || maxS <= 0) return false;
      }
      if (form.minTeamSize && form.maxTeamSize) {
        const minS = parseInt(form.minTeamSize);
        const maxS = parseInt(form.maxTeamSize);
        if (!isNaN(minS) && !isNaN(maxS) && minS > maxS) return false;
      }
      return true;
    }
    return true;
  };

  const canGoNext = () => isStepValid(step);

  const canNavigateTo = (targetStep: number) => {
    if (targetStep <= step) return true;
    for (let i = 1; i < targetStep; i++) {
      if (!isStepValid(i)) return false;
    }
    return true;
  };

  const navigateToStep = (targetStep: number) => {
    setDirection(targetStep > step ? 1 : -1);
    setStep(targetStep);
  };

  const getDateWarnings = () => {
    const warnings: string[] = [];
    const nowTime = new Date();
    
    if (form.startDate) {
      const start = new Date(form.startDate);
      if (start < nowTime) {
        warnings.push("Start date is in the past.");
      }
    }
    
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end <= start) {
        warnings.push("End date must be after start date.");
      }
    }
    
    if (form.registrationDeadline) {
      const deadline = new Date(form.registrationDeadline);
      if (deadline < nowTime) {
        warnings.push("Registration deadline is in the past.");
      }
      if (form.startDate) {
        const start = new Date(form.startDate);
        if (deadline > start) {
          warnings.push("Registration deadline should be before start date.");
        }
      }
    }
    return warnings;
  };

  const getParticipantWarnings = () => {
    const warnings: string[] = [];
    if (form.maxCapacity && parseInt(form.maxCapacity) <= 0) {
      warnings.push("Max capacity must be greater than 0.");
    }
    if (form.minTeamSize && parseInt(form.minTeamSize) <= 0) {
      warnings.push("Min team size must be greater than 0.");
    }
    if (form.maxTeamSize && parseInt(form.maxTeamSize) <= 0) {
      warnings.push("Max team size must be greater than 0.");
    }
    if (form.minTeamSize && form.maxTeamSize && parseInt(form.minTeamSize) > parseInt(form.maxTeamSize)) {
      warnings.push("Min team size cannot exceed max team size.");
    }
    return warnings;
  };

  // Motion variants for dynamic sliding step transitions
  const stepVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
    }),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--ck-text)" }}>Events</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--ck-text-secondary)" }}>Manage and browse club events</p>
        </div>
        {isCoord && (
          <button 
            onClick={() => { 
              setEditingEventId(null); 
              setForm({ title: "", description: "", venue: "", startDate: "", endDate: "", maxCapacity: "", eventType: "general", tags: "", registrationDeadline: "", minTeamSize: "", maxTeamSize: "", rules: "", googleFormUrl: "", documentUrl: "", posterUrl: "" }); 
              setPosterFile(null); 
              setPosterPreview(null); 
              setDocumentFile(null); 
              setShowCreate(true); 
              setStep(1); 
            }} 
            className="ck-btn-primary"
          >
            <Plus className="w-4 h-4" /> Create Event
          </button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm ck-search-container ck-input-icon-wrapper">
          <Search className="w-4 h-4 text-red-500/50" />
          <input className="ck-input ck-search-input" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        {isCoord && (
          <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-red-900/20">
            {(["all", "published", "draft"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === s ? "bg-red-900 text-white shadow-[0_0_8px_rgba(220,38,38,0.3)]" : "text-slate-400 hover:text-red-400"}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-red-900/20">
          {(["all", "upcoming", "past"] as const).map((t) => (
            <button key={t} onClick={() => setTimeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${timeFilter === t ? "bg-red-600 text-white shadow-[0_0_8px_rgba(220,38,38,0.3)]" : "text-slate-400 hover:text-red-400"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Create Event Modal — Timeline Stepper */}
      <AnimatePresence>
        {showCreate && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="ck-card w-full max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-red-500 to-red-900" />

              {/* Header */}
              <div className="flex justify-between items-center p-6 pb-0">
                <h2 className="text-xl font-bold font-mono tracking-wide" style={{ color: "var(--ck-text)" }}>{editingEventId ? "EDIT EVENT" : "CREATE NEW EVENT"}</h2>
                <button onClick={() => { setShowCreate(false); setStep(1); setEditingEventId(null); }} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition"><X className="w-5 h-5" /></button>
              </div>

              {/* Timeline Stepper */}
              <div className="px-6 pt-5 pb-2">
                <div className="flex items-center justify-between">
                  {STEPS.map((s, i) => {
                    const isReachable = canNavigateTo(s.id);
                    return (
                      <React.Fragment key={s.id}>
                        <button type="button" 
                          disabled={!isReachable}
                          onClick={() => { if (isReachable) navigateToStep(s.id); }}
                          className={`flex flex-col items-center gap-1.5 group transition-opacity duration-300 ${isReachable ? "cursor-pointer" : "cursor-not-allowed opacity-40"}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                            step === s.id ? "border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                            : s.id < step ? "border-emerald-500 bg-emerald-500/20"
                            : "border-zinc-700 bg-zinc-900"
                          }`}>
                            {s.id < step ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              : <s.icon className={`w-4 h-4 ${step === s.id ? "text-red-400" : "text-zinc-500"}`} />}
                          </div>
                          <span className={`text-[11px] font-mono uppercase tracking-wider ${step === s.id ? "text-red-400 font-semibold" : s.id < step ? "text-emerald-400" : "text-zinc-600"}`}>
                            {s.label}
                          </span>
                        </button>
                        {i < STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-2 rounded transition-colors duration-300 ${s.id < step ? "bg-emerald-500/50" : "bg-zinc-800"}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleCreate} className="p-6 pt-4 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  {/* Step 1: Basic Info */}
                  {step === 1 && (
                    <motion.div
                      key="s1"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="space-y-4"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="ck-label mb-0">Event Name *</label>
                          {form.title.length > 0 && (
                            <span className={`text-[10px] font-mono uppercase ${form.title.length >= 3 ? "text-emerald-400" : "text-red-400"}`}>
                              {form.title.length < 3 ? "Too short (min 3 chars)" : "Acceptable"}
                            </span>
                          )}
                        </div>
                        <input 
                          className={`ck-input ${form.title.length > 0 && form.title.length < 3 ? "border-red-500/50 focus:border-red-500 focus:shadow-[0_0_12px_rgba(239,68,68,0.4)]" : ""}`} 
                          placeholder="e.g. CyberHack 3.0" 
                          value={form.title} 
                          onChange={(e) => setForm({ ...form, title: e.target.value })} 
                          required 
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="ck-label mb-0">Description</label>
                          <span className="text-[10px] text-zinc-500 font-mono">{form.description.length} / 500 chars</span>
                        </div>
                        <textarea className="ck-input" rows={4} maxLength={500} placeholder="Describe the event, its purpose, and what participants can expect..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                      </div>
                      
                      {/* Visual Event Type Selector */}
                      <div>
                        <label className="ck-label mb-2">Event Type</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {EVENT_TYPES.map((type) => {
                            const IconComp = type.icon;
                            const isSelected = form.eventType === type.value;
                            return (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => setForm({ ...form, eventType: type.value })}
                                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group ${
                                  isSelected
                                    ? "border-red-500 bg-red-950/20 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
                                    : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/30"
                                }`}
                              >
                                <div className={`p-2 rounded-lg mb-2 transition-colors duration-300 ${
                                  isSelected ? "bg-red-500/20 text-red-400" : "bg-zinc-900 text-zinc-400 group-hover:text-white"
                                }`}>
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <span className={`text-xs font-semibold uppercase tracking-wider font-mono ${
                                  isSelected ? "text-red-400" : "text-zinc-300"
                                }`}>
                                  {type.label}
                                </span>
                                <span className="text-[10px] text-zinc-500 mt-1 line-clamp-1 group-hover:text-zinc-400 transition-colors">
                                  {type.desc}
                                </span>
                                {isSelected && (
                                  <div className="absolute top-2.5 right-2.5 bg-red-500 text-white rounded-full p-0.5 shadow-[0_0_5px_rgba(239,68,68,0.5)]">
                                    <Check className="w-2.5 h-2.5" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="ck-label">Venue</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/50 pointer-events-none" />
                            <input className="ck-input pl-10" placeholder="e.g. Lab 301, CSPIT" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
                          </div>
                        </div>
                        {/* Interactive Tag Input */}
                        <div>
                          <label className="ck-label">Tags</label>
                          <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-zinc-800 bg-black/50 min-h-[44px] mb-1.5 focus-within:border-red-500/50 focus-within:ring-1 focus-within:ring-red-500/30 transition-all duration-300">
                            {tagList.map((tag, idx) => (
                              <span key={idx} className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/40 border border-red-900/30 text-[10px] text-red-200 uppercase font-mono tracking-wider transition-all duration-200 hover:bg-red-900/30">
                                {tag}
                                <button type="button" onClick={() => removeTag(idx)} className="p-0.5 rounded-full text-red-400 hover:text-white hover:bg-red-600/30 transition">
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                            <input
                              type="text"
                              placeholder={tagList.length === 0 ? "cybersecurity, networking, etc. (Press Enter)" : "Add..."}
                              className="flex-1 min-w-[80px] bg-transparent border-0 outline-none text-xs text-white focus:ring-0 placeholder:text-zinc-600 font-mono py-0.5"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  const val = e.currentTarget.value.trim();
                                  if (val) {
                                    addTag(val);
                                    e.currentTarget.value = "";
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const val = e.currentTarget.value.trim();
                                if (val) {
                                  addTag(val);
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-zinc-600 font-mono">Press Enter or comma to add tag.</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Schedule */}
                  {step === 2 && (
                    <motion.div
                      key="s2"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <MiniCalendar label="Start Date & Time *" selectedDate={form.startDate}
                          onSelect={(v) => setForm({ ...form, startDate: v })}
                          rangeStart={form.startDate} rangeEnd={form.endDate} />
                        <MiniCalendar label="End Date & Time *" selectedDate={form.endDate}
                          onSelect={(v) => setForm({ ...form, endDate: v })}
                          rangeStart={form.startDate} rangeEnd={form.endDate} />
                        <MiniCalendar label="Registration Deadline" selectedDate={form.registrationDeadline}
                          onSelect={(v) => setForm({ ...form, registrationDeadline: v })}
                          rangeStart={form.startDate} rangeEnd={form.endDate}
                          onClear={() => setForm({ ...form, registrationDeadline: "" })} />
                      </div>
                      
                      {/* Date Validation Warnings */}
                      {getDateWarnings().length > 0 && (
                        <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 space-y-1">
                          {getDateWarnings().map((warn, i) => (
                            <p key={i} className="text-xs font-mono flex items-center gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{warn}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {form.startDate && form.endDate && getDateWarnings().length === 0 && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-xs text-emerald-400 font-mono flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {new Date(form.startDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                              {" at "}
                              {new Date(form.startDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              {" — "}
                              {new Date(form.endDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                              {" at "}
                              {new Date(form.endDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 3: Participants */}
                  {step === 3 && (
                    <motion.div
                      key="s3"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="ck-label">Max Capacity</label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/50 pointer-events-none" />
                          <input className="ck-input pl-10" type="number" min="1" placeholder="e.g. 100 (Leave blank for unlimited)" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="ck-label">Min Team Size</label>
                          <input className="ck-input" type="number" min="1" placeholder="e.g. 2" value={form.minTeamSize} onChange={(e) => setForm({ ...form, minTeamSize: e.target.value })} />
                        </div>
                        <div>
                          <label className="ck-label">Max Team Size</label>
                          <input className="ck-input" type="number" min="1" placeholder="e.g. 5" value={form.maxTeamSize} onChange={(e) => setForm({ ...form, maxTeamSize: e.target.value })} />
                        </div>
                      </div>
                      
                      {/* Capacity warnings */}
                      {getParticipantWarnings().length > 0 && (
                        <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 space-y-1">
                          {getParticipantWarnings().map((warn, i) => (
                            <p key={i} className="text-xs font-mono flex items-center gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{warn}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      <div>
                        <label className="ck-label">Google Form Link <span className="text-zinc-500">(Optional)</span></label>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/50 pointer-events-none" />
                          <input className="ck-input pl-10" type="url" placeholder="https://forms.google.com/..." value={form.googleFormUrl} onChange={(e) => setForm({ ...form, googleFormUrl: e.target.value })} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Details & Media */}
                  {step === 4 && (
                    <motion.div
                      key="s4"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="space-y-4"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="ck-label mb-0">Rules & Guidelines</label>
                          <span className="text-[10px] text-zinc-500 font-mono">{form.rules.length} / 1000 chars</span>
                        </div>
                        <textarea className="ck-input" rows={4} maxLength={1000} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} placeholder="1. All participants must register before the deadline&#10;2. Team leader must be present at check-in&#10;3. ..." />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="ck-label">Event Poster</label>
                          <div 
                            onDragOver={handlePosterDragOver}
                            onDragLeave={handlePosterDragLeave}
                            onDrop={handlePosterDrop}
                            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all duration-300 group cursor-pointer relative overflow-hidden ${
                              isPosterDragging 
                                ? "border-red-500 bg-red-950/20 scale-[1.01] shadow-[0_0_15px_rgba(239,68,68,0.25)]" 
                                : "border-zinc-800 bg-zinc-950/30 hover:border-red-500/40 hover:bg-zinc-900/10"
                            }`}
                            onClick={() => document.getElementById("poster-upload")?.click()}>
                            {posterPreview ? (
                              <div className="relative group/preview">
                                <img src={posterPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain border border-zinc-800" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                  <p className="text-xs text-zinc-300 font-mono">Click to replace image</p>
                                </div>
                                <button type="button" onClick={(ev) => { ev.stopPropagation(); setPosterFile(null); setPosterPreview(null); }}
                                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-red-400 hover:text-white hover:bg-red-600 transition shadow-[0_0_8px_rgba(0,0,0,0.5)]"><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <div className="py-2">
                                <UploadCloud className={`w-8 h-8 mx-auto mb-2 transition-all duration-300 ${isPosterDragging ? "text-red-500 scale-110 animate-pulse" : "text-zinc-600 group-hover:text-red-500"}`} />
                                <p className="text-xs font-semibold font-mono text-zinc-300">{isPosterDragging ? "Drop your image here!" : "Click or drag & drop event poster"}</p>
                                <p className="text-[10px] text-zinc-500 mt-1 font-mono">PNG, JPG up to 5MB</p>
                              </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" id="poster-upload" onChange={handlePosterChange} />
                          </div>
                        </div>

                        <div>
                          <label className="ck-label">Supporting Document <span className="text-zinc-500">(Optional Template)</span></label>
                          <div 
                            onDragOver={handleDocDragOver}
                            onDragLeave={handleDocDragLeave}
                            onDrop={handleDocDrop}
                            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all duration-300 group cursor-pointer relative ${
                              isDocDragging 
                                ? "border-red-500 bg-red-950/20 scale-[1.01] shadow-[0_0_15px_rgba(239,68,68,0.25)]" 
                                : "border-zinc-800 bg-zinc-950/30 hover:border-red-500/40 hover:bg-zinc-900/10"
                            }`}
                            onClick={() => document.getElementById("doc-upload")?.click()}>
                            <div className="py-2">
                              <FileText className={`w-8 h-8 mx-auto mb-2 transition-all duration-300 ${isDocDragging ? "text-red-500 scale-110 animate-pulse" : "text-zinc-600 group-hover:text-red-500"}`} />
                              <p className="text-xs font-semibold font-mono text-zinc-300">
                                {documentFile ? documentFile.name : (editingEventId && form.documentUrl ? form.documentUrl.split("/").pop() : (isDocDragging ? "Drop your document here!" : "Click or drag & drop document"))}
                              </p>
                              {(documentFile || (editingEventId && form.documentUrl)) && (
                                <div className="mt-2 flex items-center justify-center gap-2 animate-fade-in">
                                  {documentFile && (
                                    <span className="text-[9px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded font-mono border border-zinc-850">
                                      {(documentFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </span>
                                  )}
                                  <button type="button" 
                                    onClick={(ev) => { 
                                      ev.stopPropagation(); 
                                      setDocumentFile(null); 
                                      if (editingEventId) setForm({ ...form, documentUrl: "" }); 
                                    }} 
                                    className="text-red-400 hover:text-white transition bg-red-950/50 hover:bg-red-900 border border-red-900/30 p-1 rounded-full"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                              {!documentFile && !(editingEventId && form.documentUrl) && <p className="text-[10px] text-zinc-500 mt-1 font-mono">PDF, DOC, DOCX, TXT</p>}
                            </div>
                            <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" id="doc-upload"
                              onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-850">
                  <div>
                    {step > 1 && (
                      <button type="button" onClick={() => navigateToStep(step - 1)} className="ck-btn-secondary py-2 px-4 text-xs">
                        <ChevronLeft className="w-3.5 h-3.5" /> Back
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Step {step} of {STEPS.length}</span>
                    {step < STEPS.length ? (
                      <button type="button" onClick={() => { if (canGoNext()) navigateToStep(step + 1); }}
                        disabled={!canGoNext()}
                        className="ck-btn-primary py-2 px-4 text-xs">
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button type="submit" disabled={creating || !canGoNext()} className="ck-btn-primary py-2 px-5 text-xs">
                        {creating ? "Saving..." : (editingEventId ? "Save Changes" : "Create Event (Draft)")}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Grid */}
      {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div> : filteredEvents.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--ck-text-muted)" }} />
          <p className="text-lg" style={{ color: "var(--ck-text-secondary)" }}>No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => isCoord ? router.push(`/dashboard/events/${event.id}`) : undefined}
              className={`ck-card overflow-hidden ${isCoord ? "cursor-pointer hover:ring-2 hover:ring-indigo-500/30" : ""} transition-all`}>
              {/* Poster/Header */}
              <div className="h-36 bg-gradient-to-br from-red-900/10 to-black flex items-center justify-center relative overflow-hidden">
                {event.posterUrl ? (
                  <img src={`http://localhost:4000${event.posterUrl}`} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <Calendar className="w-12 h-12 text-red-900 opacity-20" />
                )}
                <div className="absolute top-3 right-3 flex gap-1">
                  {event.isPublished ? <span className="ck-badge ck-badge-success">Published</span> : <span className="ck-badge ck-badge-warning">Draft</span>}
                </div>
                {/* Capacity mini-bar */}
                {event.maxCapacity && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
                    <div className="h-full bg-gradient-to-r from-red-900 to-red-500 shadow-[0_0_8px_rgba(220,38,38,0.5)]"
                      style={{ width: `${Math.min(100, Math.round((event._count.registrations / event.maxCapacity) * 100))}%` }} />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-lg mb-1" style={{ color: "var(--ck-text)" }}>{event.title}</h3>
                {event.description && <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--ck-text-secondary)" }}>{event.description}</p>}
                <div className="space-y-1.5 mb-4 font-mono">
                  <p className="text-[10px] flex items-center gap-1.5" style={{ color: "var(--ck-text-muted)" }}>
                    <Clock className="w-3.5 h-3.5" /> {new Date(event.startDate).toLocaleDateString()} — {new Date(event.endDate).toLocaleDateString()}
                  </p>
                  {event.venue && <p className="text-[10px] flex items-center gap-1.5" style={{ color: "var(--ck-text-muted)" }}><MapPin className="w-3.5 h-3.5" /> {event.venue}</p>}
                  <p className="text-[10px] flex items-center gap-1.5" style={{ color: "var(--ck-text-muted)" }}>
                    <Users className="w-3.5 h-3.5" /> {event._count.registrations} / {event.maxCapacity || "∞"} registered
                  </p>
                  {event.registrationDeadline && (
                    <p className="text-[10px] flex items-center gap-1.5" style={{ color: new Date(event.registrationDeadline) < now ? "#dc2626" : "var(--ck-text-muted)" }}>
                      <Clock className="w-3.5 h-3.5" /> Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
                      {new Date(event.registrationDeadline) < now && " (Expired)"}
                    </p>
                  )}
                </div>
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {event.tags.map((tag) => <span key={tag} className="ck-badge ck-badge-info text-[10px]">{tag}</span>)}
                  </div>
                )}
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {event.isPublished && (
                    <button onClick={(e) => handleRegister(event.id, e)} className="ck-btn-primary flex-1 text-xs py-2">Register</button>
                  )}
                  {isCoord && user && ["FACULTY", "STUDENT_COORDINATOR"].includes(user.role) && (
                    <button onClick={(e) => handlePublish(event.id, e)} className="ck-btn-secondary text-xs py-2">
                      {event.isPublished ? <><EyeOff className="w-3 h-3" /> Unpublish</> : <><Eye className="w-3 h-3" /> Publish</>}
                    </button>
                  )}
                  {isCoord && (
                    <button onClick={(e) => { e.stopPropagation(); handleStartEdit(event); }} className="ck-btn-secondary text-xs py-2">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  {event.isPublished && (
                    <a href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer" className="ck-btn-secondary text-xs py-2"
                      onClick={(e) => e.stopPropagation()}>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {isCoord && (
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/events/${event.id}`); }}
                      className="ck-btn-secondary text-xs py-2">
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

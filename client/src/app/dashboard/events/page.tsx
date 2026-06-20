"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, apiUpload, getFileUrl } from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Plus, X, ExternalLink, Users, MapPin, Clock, Eye, EyeOff,
  Search, Upload, ChevronRight, ChevronLeft, Image, FileText,
  Link2, BookOpen, UserPlus, Info, CheckCircle2, ChevronDown,
  Terminal, Award, Presentation, AlertTriangle, Check, UploadCloud, Layers, Edit, Mail
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
            <span className="text-[10px] font-bold font-mono border px-2 py-0.5 rounded" style={{ color: "#CCFF00", backgroundColor: "rgba(204,255,0,0.1)", borderColor: "rgba(204,255,0,0.25)" }}>
              {sel.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {sel && onClear && (
            <button type="button" onClick={onClear} className="text-[10px] transition border rounded px-1.5 py-0.5 font-mono" style={{ color: "#CCFF00", borderColor: "rgba(204,255,0,0.25)" }}>
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
                  selected ? "bg-[#CCFF00] text-black shadow-[0_0_10px_rgba(204,255,0,0.4)] border border-[#CCFF00]" :
                  inRange ? "bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30" :
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
              className="ck-input py-1 px-2 text-xs flex-1 max-w-[100px] border border-zinc-800 focus:border-[#CCFF00]/50" />
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
  organizers?: string;
  socialLinks?: string;
  isApproved: boolean;
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "active" | "past">("active");
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const isCoord = user && ["FACULTY", "STUDENT_COORDINATOR"].includes(user.role);
  const isCore = user && ["FACULTY", "STUDENT_COORDINATOR", "TECH", "CONTENT", "SOCIAL_MEDIA"].includes(user.role);

  interface Organizer {
    name: string;
    role: string;
    email: string;
    phone: string;
  }

  const [form, setForm] = useState({
    title: "", description: "", venue: "", startDate: "", endDate: "",
    maxCapacity: "", eventType: "general", tags: "",
    registrationDeadline: "", minTeamSize: "", maxTeamSize: "", rules: "",
    googleFormUrl: "",
    documentUrl: "",
    posterUrl: "",
    // Social links for the event
    instagramUrl: "",
    linkedinUrl: "",
    whatsappUrl: "",
  });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<string[]>([]);
  const [organizersList, setOrganizersList] = useState<Organizer[]>([]);
  const [newOrganizer, setNewOrganizer] = useState<Organizer>({ name: "", role: "Student Coordinator", email: "", phone: "" });

  // Drag & Drop state
  const [isPosterDragging, setIsPosterDragging] = useState(false);
  const [isDocDragging, setIsDocDragging] = useState(false);

  const load = async () => {
    try {
      const endpoint = isCore ? "/events/all" : "/events";
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
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      setDocumentFiles(prev => [...prev, ...files]);
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
        maxCapacity: form.maxCapacity ? parseInt(form.maxCapacity) : undefined,
        eventType: form.eventType,
        tags: tagList,
        registrationDeadline: form.registrationDeadline || undefined,
        minTeamSize: form.minTeamSize ? parseInt(form.minTeamSize) : undefined,
        maxTeamSize: form.maxTeamSize ? parseInt(form.maxTeamSize) : undefined,
        rules: form.rules || undefined,
        googleFormUrl: form.googleFormUrl || undefined,
        documentUrl: editingEventId ? JSON.stringify(existingDocuments) : undefined,
        organizers: JSON.stringify(organizersList),
        socialLinks: JSON.stringify({
          instagram: form.instagramUrl || undefined,
          linkedin: form.linkedinUrl || undefined,
          whatsapp: form.whatsappUrl || undefined,
        }),
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
      if (documentFiles.length > 0 && eventId) {
        const fd = new FormData();
        documentFiles.forEach(file => {
          fd.append("document", file);
        });
        await apiUpload(`/events/${eventId}/document`, fd, token || undefined);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowCreate(false);
        setStep(1);
        setEditingEventId(null);
        setForm({ title: "", description: "", venue: "", startDate: "", endDate: "", maxCapacity: "", eventType: "general", tags: "", registrationDeadline: "", minTeamSize: "", maxTeamSize: "", rules: "", googleFormUrl: "", documentUrl: "", posterUrl: "", instagramUrl: "", linkedinUrl: "", whatsappUrl: "" });
        setPosterFile(null); setPosterPreview(null);
        setDocumentFiles([]);
        setExistingDocuments([]);
        setOrganizersList([]);
        load();
      }, 2500);
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
      // Parse socialLinks
      instagramUrl: "",
      linkedinUrl: "",
      whatsappUrl: "",
    });

    // Pre-populate social links if they exist
    if (event.socialLinks) {
      try {
        const sl = JSON.parse(event.socialLinks);
        setForm(prev => ({
          ...prev,
          instagramUrl: sl.instagram || "",
          linkedinUrl: sl.linkedin || "",
          whatsappUrl: sl.whatsapp || "",
        }));
      } catch {}
    }
    setPosterPreview(event.posterUrl ? getFileUrl(event.posterUrl) : null);
    setPosterFile(null);
    
    // Parse documents
    let docs: string[] = [];
    if (event.documentUrl) {
      if (event.documentUrl.startsWith("[")) {
        try { docs = JSON.parse(event.documentUrl); } catch { docs = [event.documentUrl]; }
      } else { docs = [event.documentUrl]; }
    }
    setExistingDocuments(docs);
    setDocumentFiles([]);

    // Parse organizers
    let orgs: Organizer[] = [];
    if (event.organizers) {
      try { orgs = JSON.parse(event.organizers); } catch { orgs = []; }
    }
    setOrganizersList(orgs);
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

  const handleApproveDirectly = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const data = await api<{ requests: any[] }>("/approvals?type=EVENT_PERMISSION", { token: token || undefined });
      const pendingRequest = data.requests?.find(r => r.status === "PENDING" && r.metadata?.eventId === eventId);
      if (pendingRequest) {
        await api(`/approvals/${pendingRequest.id}/decide`, {
          method: "POST",
          token: token || undefined,
          body: JSON.stringify({ status: "APPROVED", comment: "Approved directly from event card." })
        });
        alert("Event approved successfully!");
        load();
      } else {
        alert("No pending approval request found for this event.");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Approval failed");
    }
  };

  const handleSendEmail = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to broadcast this event via email to all club members?")) return;
    try {
      await api(`/events/${id}/send-email`, { method: "POST", token: token || undefined });
      alert("Email notifications sent successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send emails");
    }
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
    if (timeFilter === "active") return new Date(ev.endDate) >= now;
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
              setForm({ title: "", description: "", venue: "", startDate: "", endDate: "", maxCapacity: "", eventType: "general", tags: "", registrationDeadline: "", minTeamSize: "", maxTeamSize: "", rules: "", googleFormUrl: "", documentUrl: "", posterUrl: "", instagramUrl: "", linkedinUrl: "", whatsappUrl: "" }); 
              setPosterFile(null); 
              setPosterPreview(null); 
              setDocumentFiles([]); 
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
          <Search className="w-4 h-4" style={{ color: "#CCFF00" }} />
          <input className="ck-input ck-search-input" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        {isCoord && (
          <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-[#1A1E26]">
            {(["all", "published", "draft"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${statusFilter === s ? "bg-[#CCFF00] text-black font-bold shadow-[0_0_8px_rgba(204,255,0,0.3)]" : "text-slate-400 hover:text-[#CCFF00]"}`}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1 p-1 rounded-xl bg-black/40 border border-[#1A1E26]">
          {(["active", "past", "all"] as const).map((t) => (
            <button key={t} onClick={() => setTimeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${timeFilter === t ? "bg-[#CCFF00] text-black font-bold shadow-[0_0_8px_rgba(204,255,0,0.3)]" : "text-slate-400 hover:text-[#CCFF00]"}`}>
              {t === "past" ? "archive" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Create Event Modal — Timeline Stepper */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="ck-card w-full max-w-2xl lg:max-w-4xl flex flex-col relative"
              style={{ maxHeight: "90vh" }}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF4D00] via-[#CCFF00] to-[#FF003C] rounded-t-xl z-10" />

              {/* Header — never scrolls */}
              <div className="flex justify-between items-center px-6 pt-6 pb-0 shrink-0">
                <h2 className="text-xl font-bold font-mono tracking-wide" style={{ color: "var(--ck-text)" }}>{editingEventId ? "EDIT EVENT" : "CREATE NEW EVENT"}</h2>
                <button onClick={() => { setShowCreate(false); setStep(1); setEditingEventId(null); }} className="p-2 rounded-lg hover:bg-[#FF003C]/10 text-[#FF003C] transition"><X className="w-5 h-5" /></button>
              </div>

              {/* Timeline Stepper — never scrolls */}
              <div className="px-6 pt-5 pb-3 shrink-0">
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
                            step === s.id ? "border-[#CCFF00] bg-[#CCFF00]/20 shadow-[0_0_15px_rgba(204,255,0,0.3)]"
                            : s.id < step ? "border-[#FF4D00] bg-[#FF4D00]/20"
                            : "border-zinc-700 bg-zinc-900"
                          }`}>
                            {s.id < step ? <CheckCircle2 className="w-5 h-5" style={{ color: "#FF4D00" }} />
                              : <s.icon className="w-4 h-4" style={{ color: step === s.id ? "#CCFF00" : "#4B5563" }} />}
                          </div>
                          <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: step === s.id ? "#CCFF00" : (s.id < step ? "#FF4D00" : "#4B5563") }}>
                            {s.label}
                          </span>
                        </button>
                        {i < STEPS.length - 1 && (
                          <div className="flex-1 h-0.5 mx-2 rounded transition-colors duration-300" style={{ backgroundColor: s.id < step ? "#FF4D00" : "#1A1E26" }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable form area */}
              <form onSubmit={handleCreate} className="flex-1 overflow-y-auto px-6 pb-6 pt-2 min-h-0">
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
                            <span className="text-[10px] font-mono uppercase" style={{ color: form.title.length >= 3 ? "#CCFF00" : "#FF003C" }}>
                              {form.title.length < 3 ? "Too short (min 3 chars)" : "Acceptable"}
                            </span>
                          )}
                        </div>
                        <input 
                          className={`ck-input ${form.title.length > 0 && form.title.length < 3 ? "border-[#FF003C]/50 focus:border-[#FF003C] focus:shadow-[0_0_12px_rgba(255,0,60,0.4)]" : ""}`} 
                          placeholder="e.g. CyberHack 3.0" 
                          value={form.title} 
                          onChange={(e) => setForm({ ...form, title: e.target.value })} 
                          required 
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="ck-label mb-0">Description</label>
                          <span className="text-[10px] text-zinc-500 font-mono">{form.description.length} / 10000000 chars</span>
                        </div>
                        <textarea className="ck-input" rows={4} maxLength={10000000} placeholder="Describe the event, its purpose, and what participants can expect..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
                                    ? "border-[#CCFF00] bg-[#CCFF00]/10 shadow-[0_0_12px_rgba(204,255,0,0.15)]"
                                    : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/30"
                                }`}
                              >
                                <div className="p-2 rounded-lg mb-2 transition-colors duration-300" style={{
                                  backgroundColor: isSelected ? "rgba(204,255,0,0.1)" : "rgba(0,0,0,0.4)",
                                  color: isSelected ? "#CCFF00" : "#8892A4"
                                }}>
                                  <IconComp className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-wider font-mono" style={{
                                  color: isSelected ? "#CCFF00" : "#F0F4FF"
                                }}>
                                  {type.label}
                                </span>
                                <span className="text-[10px] text-zinc-500 mt-1 line-clamp-1 group-hover:text-zinc-400 transition-colors">
                                  {type.desc}
                                </span>
                                {isSelected && (
                                  <div className="absolute top-2.5 right-2.5 rounded-full p-0.5" style={{ backgroundColor: "#CCFF00", color: "#000", boxShadow: "0 0 5px #CCFF00" }}>
                                    <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
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
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#CCFF00" }} />
                            <input className="ck-input pl-10" placeholder="e.g. Lab 301, CSPIT" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
                          </div>
                        </div>
                        {/* Interactive Tag Input */}
                        <div>
                          <label className="ck-label">Tags</label>
                          <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-zinc-800 bg-black/50 min-h-[44px] mb-1.5 focus-within:border-[#CCFF00]/50 focus-within:ring-1 focus-within:ring-[#CCFF00]/30 transition-all duration-300">
                            {tagList.map((tag, idx) => (
                              <span key={idx} className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-900/30 text-[10px] text-cyan-200 uppercase font-mono tracking-wider transition-all duration-200 hover:bg-cyan-900/30">
                                {tag}
                                <button type="button" onClick={() => removeTag(idx)} className="p-0.5 rounded-full transition hover:text-white" style={{ color: "#CCFF00" }}>
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
                        <div className="p-3.5 rounded-lg bg-[#FF003C]/10 border border-[#FF003C]/20 text-[#FF003C] space-y-1">
                          {getDateWarnings().map((warn, i) => (
                            <p key={i} className="text-xs font-mono flex items-center gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{warn}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {form.startDate && form.endDate && getDateWarnings().length === 0 && (
                        <div className="p-3 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/20">
                          <p className="text-xs font-mono flex items-center gap-2" style={{ color: "#CCFF00" }}>
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
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#CCFF00" }} />
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
                        <div className="p-3 rounded-lg bg-[#FF003C]/10 border border-[#FF003C]/20 text-[#FF003C] space-y-1">
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
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#CCFF00" }} />
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
                          <span className="text-[10px] text-zinc-500 font-mono">{form.rules.length} / 10000000 chars</span>
                        </div>
                        <textarea className="ck-input" rows={4} maxLength={10000000} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} placeholder="1. All participants must register before the deadline&#10;2. Team leader must be present at check-in&#10;3. ..." />
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
                                ? "border-[#CCFF00] bg-[#CCFF00]/5 scale-[1.01] shadow-[0_0_15px_rgba(204,255,0,0.15)]" 
                                : "border-zinc-800 bg-[#0D0F14]/30 hover:border-[#CCFF00]/40 hover:bg-[#0D0F14]/50"
                            }`}
                            onClick={() => document.getElementById("poster-upload")?.click()}>
                            {posterPreview ? (
                              <div className="relative group/preview">
                                <img src={posterPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain border border-zinc-800" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                  <p className="text-xs text-zinc-300 font-mono">Click to replace image</p>
                                </div>
                                <button type="button" onClick={(ev) => { ev.stopPropagation(); setPosterFile(null); setPosterPreview(null); }}
                                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 transition shadow-[0_0_8px_rgba(0,0,0,0.5)] hover:text-white" style={{ color: "#CCFF00" }}><X className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <div className="py-2">
                                <UploadCloud className={`w-8 h-8 mx-auto mb-2 transition-all duration-300 ${isPosterDragging ? "scale-110 animate-pulse" : "text-zinc-650"}`} style={{ color: "#CCFF00" }} />
                                <p className="text-xs font-semibold font-mono text-zinc-300">{isPosterDragging ? "Drop your image here!" : "Click or drag & drop event poster"}</p>
                                <p className="text-[10px] text-zinc-500 mt-1 font-mono">PNG, JPG up to 5MB</p>
                              </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" id="poster-upload" onChange={handlePosterChange} />
                          </div>
                        </div>

                        <div>
                          <label className="ck-label">Supporting Documents <span className="text-zinc-500">(Optional Template)</span></label>
                          <div 
                            onDragOver={handleDocDragOver}
                            onDragLeave={handleDocDragLeave}
                            onDrop={handleDocDrop}
                            className={`border-2 border-dashed rounded-xl p-5 text-center transition-all duration-300 group cursor-pointer relative ${
                              isDocDragging 
                                ? "border-[#FF4D00] bg-[#FF4D00]/5 scale-[1.01] shadow-[0_0_15px_rgba(255,77,0,0.15)]" 
                                : "border-zinc-800 bg-[#0D0F14]/30 hover:border-[#FF4D00]/40 hover:bg-[#0D0F14]/50"
                            }`}
                            onClick={() => document.getElementById("doc-upload")?.click()}>
                            <div className="py-2">
                              <FileText className={`w-8 h-8 mx-auto mb-2 transition-all duration-300 ${isDocDragging ? "scale-110 animate-pulse" : "text-zinc-650"}`} style={{ color: "#FF4D00" }} />
                              <p className="text-xs font-semibold font-mono text-zinc-300">
                                {isDocDragging ? "Drop files here!" : "Click or drag & drop supporting files"}
                              </p>
                              <p className="text-[10px] text-zinc-500 mt-1 font-mono">PDF, DOC, DOCX, TXT (Multiple allowed)</p>
                            </div>
                            <input type="file" accept=".pdf,.doc,.docx,.txt" multiple className="hidden" id="doc-upload"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                if (files.length > 0) {
                                  setDocumentFiles(prev => [...prev, ...files]);
                                }
                              }} />
                          </div>
                        </div>
                      </div>

                      {/* File Lists */}
                      {(existingDocuments.length > 0 || documentFiles.length > 0) && (
                        <div className="p-4 rounded-xl border border-zinc-850 bg-black/40 space-y-3">
                          <p className="text-xs font-mono font-bold text-[#CCFF00] uppercase tracking-wider">File Clearance List</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Existing Documents */}
                            {existingDocuments.map((docUrl, idx) => (
                              <div key={`existing-${idx}`} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                  <span className="text-xs text-zinc-300 truncate font-mono">{docUrl.split("/").pop()}</span>
                                  <span className="text-[8px] font-bold font-mono px-1 rounded bg-[#CCFF00]/10 border border-[#CCFF00]/25 text-[#CCFF00] shrink-0">SAVED</span>
                                </div>
                                <button type="button" onClick={() => setExistingDocuments(prev => prev.filter((_, i) => i !== idx))}
                                  className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                            {/* Newly Selected Documents */}
                            {documentFiles.map((file, idx) => (
                              <div key={`new-${idx}`} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-3.5 h-3.5 text-[#FF4D00] shrink-0" />
                                  <span className="text-xs text-zinc-300 truncate font-mono">{file.name}</span>
                                  <span className="text-[8px] font-bold font-mono px-1 rounded bg-[#FF4D00]/10 border border-[#FF4D00]/25 text-[#FF4D00] shrink-0">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                  </span>
                                </div>
                                <button type="button" onClick={() => setDocumentFiles(prev => prev.filter((_, i) => i !== idx))}
                                  className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Organizing Team Section */}
                      <div className="p-4 rounded-xl border border-zinc-850 bg-black/40 space-y-4">
                        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                          <Users className="w-4 h-4 text-[#CCFF00]" />
                          <h3 className="text-sm font-black font-mono text-zinc-350 uppercase tracking-widest">Organizing Team Setup</h3>
                        </div>

                        {/* Add Organizer Form */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="ck-label text-[10px]">Name *</label>
                            <input className="ck-input text-xs py-1.5" placeholder="e.g. Prof. Alice" value={newOrganizer.name}
                              onChange={(e) => setNewOrganizer({ ...newOrganizer, name: e.target.value })} />
                          </div>
                          <div>
                            <label className="ck-label text-[10px]">Role / designation *</label>
                            <select className="ck-input text-xs py-1.5 bg-black" value={newOrganizer.role}
                              onChange={(e) => setNewOrganizer({ ...newOrganizer, role: e.target.value })}>
                              <option value="Faculty Coordinator">Faculty Coordinator</option>
                              <option value="Student Coordinator">Student Coordinator</option>
                              <option value="Tech Lead">Tech Lead</option>
                              <option value="Social Media Lead">Social Media Lead</option>
                              <option value="Co-Coordinator">Co-Coordinator</option>
                              <option value="Volunteer">Volunteer</option>
                            </select>
                          </div>
                          <div>
                            <label className="ck-label text-[10px]">Email *</label>
                            <input className="ck-input text-xs py-1.5" type="email" placeholder="alice@example.com" value={newOrganizer.email}
                              onChange={(e) => setNewOrganizer({ ...newOrganizer, email: e.target.value })} />
                          </div>
                          <div>
                             <label className="ck-label text-[10px]">Phone *</label>
                             <input
                               className="ck-input text-xs py-1.5"
                               type="tel"
                               inputMode="numeric"
                               placeholder="e.g. 9876543210"
                               value={newOrganizer.phone}
                               onChange={(e) => setNewOrganizer({ ...newOrganizer, phone: e.target.value.replace(/[^0-9+\-\s]/g, "") })}
                               maxLength={15}
                             />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button type="button" 
                            onClick={() => {
                              if (!newOrganizer.name || !newOrganizer.role || !newOrganizer.email || !newOrganizer.phone) {
                                alert("Please fill all organizer fields.");
                                return;
                              }
                              setOrganizersList([...organizersList, newOrganizer]);
                              setNewOrganizer({ name: "", role: "Student Coordinator", email: "", phone: "" });
                            }}
                            className="ck-btn-primary py-1.5 px-4 text-xs font-mono flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> ADD ORGANIZER
                          </button>
                        </div>

                        {/* Organizers List Cards */}
                        {organizersList.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                            {organizersList.map((org, idx) => (
                              <div key={idx} className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/80 relative group hover:border-[#CCFF00]/30 transition-all">
                                <button type="button" onClick={() => setOrganizersList(prev => prev.filter((_, i) => i !== idx))}
                                  className="absolute top-2.5 right-2.5 p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition"><X className="w-3 h-3" /></button>
                                <p className="text-xs font-bold text-white pr-6 font-mono truncate">{org.name}</p>
                                <p className="text-[9px] font-bold text-[#CCFF00] uppercase font-mono tracking-wider mt-0.5">{org.role}</p>
                                <div className="mt-2 space-y-0.5 text-[10px] text-zinc-450 font-mono">
                                  <p className="truncate">📧 {org.email}</p>
                                  <p>📞 {org.phone}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Social Links Section */}
                      <div className="p-4 rounded-xl border border-zinc-800 bg-black/40 space-y-3">
                        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                          <Link2 className="w-4 h-4" style={{ color: "#CCFF00" }} />
                          <h3 className="text-sm font-black font-mono text-zinc-350 uppercase tracking-widest">Event Social Links</h3>
                        </div>
                        <p className="text-[10px] text-zinc-500 font-mono">Optional. Shown on the public event page for attendees.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="ck-label text-[10px]">Instagram URL</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#CCFF00" }}>📸</span>
                              <input
                                className="ck-input pl-8 text-xs py-1.5"
                                type="url"
                                placeholder="https://instagram.com/..."
                                value={form.instagramUrl}
                                onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="ck-label text-[10px]">LinkedIn URL</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#CCFF00" }}>💼</span>
                              <input
                                className="ck-input pl-8 text-xs py-1.5"
                                type="url"
                                placeholder="https://linkedin.com/..."
                                value={form.linkedinUrl}
                                onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="ck-label text-[10px]">WhatsApp Invite URL</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#CCFF00" }}>💬</span>
                              <input
                                className="ck-input pl-8 text-xs py-1.5"
                                type="url"
                                placeholder="https://chat.whatsapp.com/..."
                                value={form.whatsappUrl}
                                onChange={(e) => setForm({ ...form, whatsappUrl: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-4 border-t border-zinc-800 sticky bottom-0 bg-[var(--ck-bg)] pb-1">
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
              <AnimatePresence>
                {showSuccess && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center"
                  >
                    <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-dashed rounded-full"
                        style={{ borderColor: "rgba(204,255,0,0.3)" }}
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }} 
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-2 border rounded-full bg-black/20"
                        style={{ borderColor: "rgba(255,77,0,0.3)" }}
                      />
                      <motion.div 
                        initial={{ scale: 0.5, rotate: -180, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        transition={{ type: "spring", damping: 12, stiffness: 100 }}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-[#CCFF00] to-[#FF4D00] flex items-center justify-center shadow-[0_0_30px_rgba(204,255,0,0.4)] z-10"
                      >
                        <Check className="w-10 h-10 text-black" strokeWidth={3} />
                      </motion.div>
                    </div>
                    
                    <motion.h3 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl font-bold font-mono tracking-wider mb-2 uppercase"
                      style={{ color: "#CCFF00" }}
                    >
                      Operation Logged
                    </motion.h3>
                    
                    <motion.p 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs font-mono tracking-widest uppercase max-w-md"
                      style={{ color: "#FF4D00" }}
                    >
                      Event telemetry synchronized with cosmic databases.
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Event Grid */}
      {loading ? <div className="flex justify-center py-20"><div className="ck-spinner" /></div> : filteredEvents.length === 0 ? (
        <div className="text-center py-20">
          <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--ck-text-muted)" }} />
          <p className="text-lg" style={{ color: "var(--ck-text-secondary)" }}>No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => isCore ? router.push(`/dashboard/events/${event.id}`) : undefined}
              className={`ck-card overflow-hidden hover:border-[rgba(204,255,0,0.3)] hover:shadow-[0_0_20px_rgba(204,255,0,0.08)] ${isCore ? "cursor-pointer" : ""} transition-all`}>
              {/* Poster/Header */}
              <div className="h-44 bg-gradient-to-br from-[#0D0F14]/50 to-black flex items-center justify-center relative overflow-hidden">
                {event.posterUrl ? (
                  <img src={getFileUrl(event.posterUrl)} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <Calendar className="w-12 h-12 opacity-20" style={{ color: "#CCFF00" }} />
                )}
                
                {/* Date Badge */}
                {(() => {
                  const dateObj = new Date(event.startDate);
                  const dateDay = dateObj.getDate();
                  const dateMonth = dateObj.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
                  return (
                    <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-[#CCFF00]/30 rounded-lg px-2 py-1 flex flex-col items-center justify-center min-w-[44px] shadow-[0_0_10px_rgba(204,255,0,0.15)] z-10">
                      <span className="text-sm font-bold leading-none font-mono" style={{ color: "#CCFF00" }}>{dateDay}</span>
                      <span className="text-[9px] font-bold tracking-wider font-mono mt-0.5" style={{ color: "#FF4D00" }}>{dateMonth}</span>
                    </div>
                  );
                })()}

                {/* Category Badge */}
                {(() => {
                  const typeObj = EVENT_TYPES.find(t => t.value === event.eventType);
                  const TypeIcon = typeObj?.icon || Layers;
                  return (
                    <span className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md border text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1 font-mono uppercase tracking-wider z-10" style={{ backgroundColor: "rgba(204,255,0,0.1)", borderColor: "rgba(204,255,0,0.25)", color: "#CCFF00" }}>
                      <TypeIcon className="w-2.5 h-2.5" style={{ color: "#CCFF00" }} />
                      {typeObj?.label || event.eventType}
                    </span>
                  );
                })()}

                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
                  {!event.isApproved && (
                    <span className="ck-badge bg-[#FF4D00]/10 border-[#FF4D00] text-[#FF4D00] shadow-[0_0_8px_rgba(255,77,0,0.2)]">
                      Awaiting Approval
                    </span>
                  )}
                  {event.isApproved && event.isPublished && <span className="ck-badge ck-badge-success">Published</span>}
                  {event.isApproved && !event.isPublished && <span className="ck-badge ck-badge-warning">Draft</span>}
                </div>
                {/* Capacity mini-bar */}
                {event.maxCapacity && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-10">
                    <div className="h-full bg-gradient-to-r from-[#FF4D00] to-[#CCFF00] shadow-[0_0_8px_rgba(204,255,0,0.3)]"
                      style={{ width: `${Math.min(100, Math.round((event._count.registrations / event.maxCapacity) * 100))}%` }} />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-lg mb-1" style={{ color: "var(--ck-text)" }}>{event.title}</h3>
                {event.description && <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--ck-text-secondary)" }}>{event.description}</p>}
                <div className="space-y-1.5 mb-4 font-mono">
                  <p className="text-[10px] flex items-center gap-1.5" style={{ color: "var(--ck-text-muted)" }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: "#CCFF00" }} /> {new Date(event.startDate).toLocaleDateString()} — {new Date(event.endDate).toLocaleDateString()}
                  </p>
                  {event.venue && <p className="text-[10px] flex items-center gap-1.5" style={{ color: "var(--ck-text-muted)" }}><MapPin className="w-3.5 h-3.5" style={{ color: "#CCFF00" }} /> {event.venue}</p>}
                  <p className="text-[10px] flex items-center gap-1.5" style={{ color: "var(--ck-text-muted)" }}>
                    <Users className="w-3.5 h-3.5" style={{ color: "#CCFF00" }} /> {event._count.registrations} / {event.maxCapacity || "∞"} registered
                  </p>
                  {event.registrationDeadline && (
                    <p className="text-[10px] flex items-center gap-1.5" style={{ color: new Date(event.registrationDeadline) < now ? "#FF003C" : "var(--ck-text-muted)" }}>
                      <Clock className="w-3.5 h-3.5" style={{ color: "#CCFF00" }} /> Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
                      {new Date(event.registrationDeadline) < now && " (Expired)"}
                    </p>
                  )}
                  {event.documentUrl && (() => {
                    let docs: string[] = [];
                    if (event.documentUrl.startsWith("[")) {
                      try { docs = JSON.parse(event.documentUrl); } catch { docs = [event.documentUrl]; }
                    } else { docs = [event.documentUrl]; }
                    return docs.length > 0 ? (
                      <div className="flex flex-col gap-1.5 mt-2.5 pt-2 border-t border-zinc-900/40">
                        <span className="text-[8px] font-mono uppercase text-zinc-500 tracking-wider">Resources:</span>
                        {docs.map((doc, idx) => (
                          <a
                            key={idx}
                            href={getFileUrl(doc)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-450 hover:text-[#CCFF00] transition truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="w-3.5 h-3.5 text-[#FF4D00] shrink-0" />
                            <span className="truncate">{doc.split("/").pop()}</span>
                          </a>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {event.tags.map((tag) => <span key={tag} className="ck-badge ck-badge-primary text-[10px]">{tag}</span>)}
                  </div>
                )}
                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  {event.isPublished && (
                    <button onClick={(e) => handleRegister(event.id, e)} className="ck-btn-primary flex-1 text-xs py-2">Register</button>
                  )}
                  {isCoord && user && ["FACULTY", "STUDENT_COORDINATOR"].includes(user.role) && (
                    <button 
                      onClick={(e) => handlePublish(event.id, e)} 
                      disabled={user.role === "STUDENT_COORDINATOR" && !event.isApproved}
                      className="ck-btn-secondary text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={user.role === "STUDENT_COORDINATOR" && !event.isApproved ? "Requires Faculty Approval" : ""}
                    >
                      {event.isPublished ? <><EyeOff className="w-3 h-3" /> Unpublish</> : <><Eye className="w-3 h-3" /> Publish</>}
                    </button>
                  )}
                  {user && user.role === "FACULTY" && !event.isApproved && (
                    <button 
                      onClick={(e) => handleApproveDirectly(event.id, e)} 
                      className="ck-btn-primary text-xs py-2 shadow-[0_0_10px_rgba(204,255,0,0.3)] border-none" style={{ backgroundColor: "#CCFF00", color: "#000" }}
                    >
                      Approve
                    </button>
                  )}
                  {isCoord && event.isApproved && event.isPublished && (
                    <button 
                      onClick={(e) => handleSendEmail(event.id, e)} 
                      className="ck-btn-secondary text-xs py-2 hover:bg-[#FF003C]/10 hover:text-[#FF003C]"
                      title="Send Email Broadcast"
                    >
                      <Mail className="w-3.5 h-3.5" />
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
                  {isCore && (
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

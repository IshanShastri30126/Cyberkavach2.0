"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import {
  Users, Clock, UserCheck, UserMinus, AlertTriangle,
  QrCode, Camera, Download, Search, ArrowLeft,
  Activity, CheckCircle, XCircle, ChevronRight, Radio,
  Wifi, WifiOff, Zap
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { io, Socket } from "socket.io-client";

/* ── helpers ─────────────────────────────────────── */
function getEventStatus(ev: any) {
  const now = new Date(), start = new Date(ev.startDate), end = new Date(ev.endDate || ev.startDate);
  if (now >= start && now <= end) return { label: "LIVE", color: "#CCFF00", dot: true };
  if (now < start) return { label: "UPCOMING", color: "#FF4D00", dot: false };
  return { label: "ENDED", color: "#4B5563", dot: false };
}

/* ─── Stat tile ─────────────────────────────────── */
function StatTile({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="ck-stat-card group"
      style={{ "--accent-color": accent } as React.CSSProperties}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#4B5563]">{label}</span>
        <span style={{ color: accent }} className="opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      <motion.p
        className="text-3xl font-black font-mono"
        style={{ color: accent }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        {String(value).padStart(2, "0")}
      </motion.p>
    </motion.div>
  );
}

export default function AttendancePage() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const queryEventId = searchParams?.get("eventId") || "";

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [checkinType, setCheckinType] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  const [searchQuery, setSearchQuery] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "CHECK_IN" | "CHECK_OUT" | "WARNINGS">("ALL");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isCoord = user && ["FACULTY", "STUDENT_COORDINATOR", "TECH"].includes(user.role);

  // Participant attendance states
  const [participantCheckedIn, setParticipantCheckedIn] = useState(false);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [agreeAttended, setAgreeAttended] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const checkMyStatus = async (eventId: string) => {
    if (!token) return;
    setLoadingStatus(true);
    try {
      const data = await api<{ checkedIn: boolean }>(`/attendance/my-status/${eventId}`, { token });
      setParticipantCheckedIn(data.checkedIn);
    } catch (err) {
      console.error("Failed to check status", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (selectedEvent && !isCoord && token) {
      checkMyStatus(selectedEvent);
    }
  }, [selectedEvent, isCoord, token]);

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeAttended) {
      showToast("PLEASE CONFIRM ATTENDANCE CHECKBOX", "error");
      return;
    }
    setSubmittingAttendance(true);
    try {
      await api("/attendance", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({
          eventId: selectedEvent,
          type: "CHECK_IN"
        })
      });
      showToast("ATTENDANCE SUBMITTED SUCCESSFULLY", "success");
      setParticipantCheckedIn(true);
    } catch (err: any) {
      showToast(err.message || "SUBMISSION FAILED", "error");
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // PWA Offline states and status updates
  const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true);
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Initial count from localStorage
    const saved = localStorage.getItem("ck_offline_checkins");
    if (saved) {
      try {
        const queue = JSON.parse(saved);
        setOfflineCount(queue.length);
      } catch {
        setOfflineCount(0);
      }
    }

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const syncOfflineCheckins = async () => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("ck_offline_checkins");
    if (!saved) return;
    try {
      const queue = JSON.parse(saved);
      if (queue.length === 0) return;

      let successCount = 0;
      for (const item of queue) {
        try {
          await api("/attendance", {
            method: "POST",
            token: token || undefined,
            body: JSON.stringify({
              eventId: item.eventId,
              type: item.type,
              teamCode: item.teamCode,
            }),
          });
          successCount++;
        } catch (err) {
          console.error("Failed to sync offline check-in:", err);
        }
      }

      localStorage.removeItem("ck_offline_checkins");
      setOfflineCount(0);
      showToast(`OFFLINE TELEMETRY SYNCHRONIZED: ${successCount} check-ins synced!`, "success");
      if (selectedEvent) {
        loadAttendance(selectedEvent);
      }
    } catch (err) {
      console.error("Error parsing offline checkins:", err);
    }
  };

  useEffect(() => {
    if (isOnline && token) {
      syncOfflineCheckins();
    }
  }, [isOnline, token]);

  useEffect(() => {
    if (!token) return;
    const endpoint = isCoord ? "/events/all" : "/events/registered";
    api<{ events: any[] }>(endpoint, { token })
      .then(d => {
        setEvents(d.events || []);
        if (queryEventId && d.events?.some((e: any) => e.id === queryEventId)) {
          setSelectedEvent(queryEventId);
        }
      })
      .catch(console.error);
  }, [token, isCoord, queryEventId]);

  const loadAttendance = async (eventId: string) => {
    setLoading(true);
    try {
      const data = await api<{ records: any[]; stats: any }>(`/attendance/event/${eventId}`, { token: token || undefined });
      setStats(data.stats);
      setRecords(data.records);
    } catch (err) {
      showToast("FAILED TO LOAD DATA", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!selectedEvent || !token) return;
    loadAttendance(selectedEvent);

    const SERVER_BASE = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
    socketRef.current = io(SERVER_BASE, { auth: { token } });
    socketRef.current.emit("join-event", selectedEvent);
    socketRef.current.on("attendance:new", (record: any) => {
      setRecords(prev => [record, ...prev]);
      setStats((prev: any) => prev ? {
        ...prev,
        currentlyPresent: record.type === "CHECK_IN" ? (prev.currentlyPresent || 0) + 1 : Math.max(0, (prev.currentlyPresent || 0) - 1),
        totalCheckedOut: record.type === "CHECK_OUT" ? (prev.totalCheckedOut || 0) + 1 : (prev.totalCheckedOut || 0),
      } : prev);
    });
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-event", selectedEvent);
        socketRef.current.disconnect();
      }
    };
  }, [selectedEvent, token]);

  useEffect(() => {
    if (showScanner && selectedEvent) {
      scannerRef.current = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 240, height: 240 } }, false);
      scannerRef.current.render(
        async (decoded) => {
          if (scannerRef.current) scannerRef.current.pause();
          try { await handleCheckIn(decoded); } catch {}
          finally { setTimeout(() => { if (scannerRef.current) scannerRef.current.resume(); }, 2000); }
        },
        () => {}
      );
    } else {
      scannerRef.current?.clear().catch(console.error);
      scannerRef.current = null;
    }
    return () => { scannerRef.current?.clear().catch(console.error); };
  }, [showScanner, selectedEvent]);

  const handleCheckIn = async (override?: string) => {
    const code = override || qrInput;
    if (!code && !qrInput.trim()) return;

    const payload = {
      eventId: selectedEvent,
      type: checkinType,
      teamCode: code || undefined,
      timestamp: new Date().toISOString()
    };

    if (!isOnline) {
      // Offline mode: save to queue
      try {
        const saved = localStorage.getItem("ck_offline_checkins") || "[]";
        const queue = JSON.parse(saved);
        queue.push(payload);
        localStorage.setItem("ck_offline_checkins", JSON.stringify(queue));
        setOfflineCount(queue.length);
        setQrInput("");
        showToast(`OFFLINE: Check-in cached locally (${queue.length} pending)`, "success");
        
        // Add a mock record to local UI log stream for visual feedback
        const mockRecord = {
          id: `offline-${Date.now()}`,
          type: checkinType,
          timestamp: payload.timestamp,
          teamCode: code,
          user: {
            name: "Offline Check-in",
            email: "Cached in LocalStorage"
          }
        };
        setRecords(prev => [mockRecord, ...prev]);
      } catch (err) {
        showToast("FAILED TO CACHE OFFLINE CHECK-IN", "error");
      }
      return;
    }

    try {
      const body: any = { eventId: selectedEvent, type: checkinType };
      if (code) body.teamCode = code;
      await api("/attendance", { method: "POST", token: token || undefined, body: JSON.stringify(body) });
      setQrInput("");
      showToast(`${checkinType === "CHECK_IN" ? "CHECK-IN" : "CHECK-OUT"} RECORDED`, "success");
      if (!override) loadAttendance(selectedEvent);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "FAILED", "error");
      if (override) throw err;
    }
  };

  const handleExportCSV = () => {
    if (!records.length) return;
    const ev = events.find(e => e.id === selectedEvent);
    const headers = ["Name", "Email", "Role", "Type", "Timestamp", "Late", "Early"];
    const rows = records.map(r => [r.user?.name || "", r.user?.email || "", r.user?.role || "", r.type, new Date(r.timestamp).toLocaleString(), r.isLate ? "Y" : "N", r.isEarly ? "Y" : "N"]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `attendance_${ev?.title || "event"}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast("CSV EXPORTED", "success");
  };

  const completionRate = stats && stats.totalRegistered > 0
    ? Math.round(((stats.currentlyPresent + stats.totalCheckedOut) / stats.totalRegistered) * 100) : 0;

  const filteredRecords = records.filter(r => {
    const q = logSearchQuery.toLowerCase();
    const match = !q || r.user?.name?.toLowerCase().includes(q) || r.user?.email?.toLowerCase().includes(q) || r.teamCode?.toLowerCase().includes(q);
    if (filterType === "CHECK_IN") return match && r.type === "CHECK_IN";
    if (filterType === "CHECK_OUT") return match && r.type === "CHECK_OUT";
    if (filterType === "WARNINGS") return match && (r.isLate || r.isEarly);
    return match;
  });

  const filteredEvents = events.filter(ev => ev.title.toLowerCase().includes(searchQuery.toLowerCase()));

  /* ── QR reader CSS ── */
  const QR_STYLE = `
    #qr-reader { border: none !important; }
    #qr-reader__dashboard_section_csr button {
      background: #CCFF00 !important; color: #000 !important;
      padding: 5px 10px !important; border: none !important;
      border-radius: 4px !important; font-size: 11px !important;
      font-family: 'JetBrains Mono', monospace !important;
      font-weight: 700 !important; cursor: pointer !important;
      text-transform: uppercase !important;
    }
    #qr-reader select {
      background: #0D0F14 !important; border: 1px solid #1A1E26 !important;
      color: #F0F4FF !important; padding: 5px !important;
      border-radius: 4px !important; font-family: 'JetBrains Mono', monospace !important;
      font-size: 11px !important; outline: none !important;
    }
    @keyframes qr-scan { 0%{top:4%} 50%{top:92%} 100%{top:4%} }
    .qr-scan-line { animation: qr-scan 2.5s ease-in-out infinite; }
  `;

  return (
    <div className="flex flex-col gap-5">
      <style>{QR_STYLE}</style>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-mono font-semibold shadow-2xl backdrop-blur-lg"
            style={toast.type === "success"
              ? { background: "rgba(204,255,0,0.06)", borderColor: "rgba(204,255,0,0.25)", color: "#CCFF00" }
              : { background: "rgba(255,0,60,0.06)", borderColor: "rgba(255,0,60,0.25)", color: "#FF003C" }
            }
          >
            {toast.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <Radio className="w-3.5 h-3.5" style={{ color: "#CCFF00" }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#CCFF00" }}>
              {selectedEvent ? "MISSION ACTIVE" : "SELECT MISSION"}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            ATTENDANCE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CCFF00] to-[#99BF00]">STREAM</span>
          </h1>
        </div>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-[#CCFF00]/15 bg-[#CCFF00]/[0.03] backdrop-blur-sm"
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#CCFF00", boxShadow: "0 0 10px #CCFF00" }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#CCFF00" }}>LIVE · SOCKET CONNECTED</span>
          </motion.div>
        )}
      </motion.div>

      {/* ── PWA Offline Status Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`ck-glass-card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-xs font-mono font-bold ${
          !isOnline ? "border-red-500/20" : ""
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isOnline ? <Wifi className="w-4 h-4 text-[#CCFF00]" /> : <WifiOff className="w-4 h-4 text-[#FF003C]" />}
          <div className={`w-2 h-2 rounded-full ${!isOnline || offlineCount > 0 ? "animate-pulse" : ""}`} style={{ 
            background: isOnline ? "#CCFF00" : "#FF003C", 
            boxShadow: `0 0 8px ${isOnline ? "#CCFF00" : "#FF003C"}` 
          }} />
          <span className={isOnline ? "text-slate-300" : "text-red-400"}>
            NETWORK: {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {offlineCount > 0 && (
            <span className="text-[10px] px-2.5 py-1 bg-yellow-500/[0.06] border border-yellow-500/20 text-yellow-400 rounded-full">
              {offlineCount} CACHED PENDING SYNC
            </span>
          )}
          <span className="text-[10px] text-slate-500">
            {isOnline ? "Real-time sync active" : "Entries cached locally"}
          </span>
        </div>
      </motion.div>

      {!selectedEvent ? (
        /* ── Event Selection Grid ── */
        <div className="flex flex-col gap-5">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#4B5563" }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="ck-input ck-input-with-icon"
            />
          </div>

          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl border border-white/[0.04] bg-white/[0.02] flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-zinc-600" />
              </div>
              <p className="text-sm font-mono text-zinc-500 uppercase tracking-widest">NO EVENTS FOUND</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((ev, i) => {
                const status = getEventStatus(ev);
                return (
                  <motion.button
                    key={ev.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    onClick={() => setSelectedEvent(ev.id)}
                    className="text-left p-5 rounded-xl ck-glass-card group cursor-pointer"
                  >
                    {/* Status badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        {status.dot && (
                          <motion.span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: status.color, boxShadow: `0 0 8px ${status.color}` }}
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: status.color }}>{status.label}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#4B5563]">{ev.type === "TEAM" ? "TEAM MODE" : "SOLO MODE"}</span>
                    </div>

                    <h3 className="font-bold text-white mb-2 line-clamp-2 leading-snug group-hover:text-[#CCFF00] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {ev.title}
                    </h3>
                    <p className="text-xs text-[#4B5563] line-clamp-2 mb-4 font-mono">{ev.description || "No description."}</p>

                    <div className="flex items-center justify-between border-t border-white/[0.04] pt-3">
                      <span className="text-[10px] font-mono text-[#4B5563]">{new Date(ev.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: "#CCFF00" }} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── Active Event Console ── */
        !isCoord ? (
          /* ── Participant Attendance Console ── */
          <div className="flex flex-col gap-4">
            {/* Back + Event title */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="ck-glass-card flex items-center justify-between flex-wrap gap-3 p-4"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedEvent(""); }}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-black/40 text-[#8892A4] hover:border-[rgba(204,255,0,0.3)] hover:text-[#CCFF00] transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#CCFF00" }}>MY REGISTERED MISSION</p>
                  <h2 className="font-bold text-white text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {events.find(e => e.id === selectedEvent)?.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => { setSelectedEvent(""); }}
                className="ck-btn-secondary text-[10px] py-1.5 px-3"
              >
                SWITCH
              </button>
            </motion.div>

            {loadingStatus ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="ck-spinner" />
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#8892A4]">Retrieving clearance status...</p>
              </div>
            ) : participantCheckedIn ? (
              /* Verified/Check-in state */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ck-glass-card p-8 text-center flex flex-col items-center justify-center max-w-xl mx-auto gap-4"
                style={{ borderColor: "rgba(204,255,0,0.2)" }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-[#CCFF00]/20 to-[#99BF00]/20 border border-[#CCFF00]/40 shadow-lg"
                  style={{ boxShadow: "0 0 20px rgba(204,255,0,0.15)" }}
                >
                  <CheckCircle className="w-8 h-8" style={{ color: "#CCFF00" }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white uppercase font-mono tracking-wider">Attendance Verified</h3>
                  <p className="text-xs text-[#8892A4] mt-2 leading-relaxed" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Your attendance telemetry has been successfully synchronized with the operations database. Thank you for participating!
                  </p>
                </div>
                <button
                  onClick={() => setSelectedEvent("")}
                  className="ck-btn-secondary py-2 px-6 text-xs font-mono tracking-wider uppercase mt-2"
                >
                  Return to List
                </button>
              </motion.div>
            ) : (
              /* Unverified / Submit attendance form */
              (() => {
                const activeEvent = events.find(e => e.id === selectedEvent);
                const hasEnded = activeEvent ? new Date() >= new Date(activeEvent.endDate) : false;
                
                if (!hasEnded) {
                  return (
                    /* Locked Attendance View */
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ck-glass-card p-8 text-center flex flex-col items-center justify-center max-w-xl mx-auto gap-4"
                      style={{ borderColor: "rgba(255,77,0,0.2)" }}
                    >
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-[#FF4D00]/20 to-[#CC3D00]/20 border border-[#FF4D00]/40 animate-pulse"
                        style={{ boxShadow: "0 0 20px rgba(255,77,0,0.15)" }}
                      >
                        <Clock className="w-8 h-8" style={{ color: "#FF4D00" }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white uppercase font-mono tracking-wider">Attendance Portal Locked</h3>
                        <p className="text-xs text-[#8892A4] mt-2 leading-relaxed" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          This attendance form will automatically unlock once the event has concluded. 
                        </p>
                        {activeEvent && (
                          <div className="mt-4 p-3 rounded-lg bg-black/40 border border-white/[0.04] text-[11px] font-mono text-left space-y-1 max-w-sm mx-auto">
                            <p className="text-white"><span className="text-[#FF4D00]">START:</span> {new Date(activeEvent.startDate).toLocaleString()}</p>
                            <p className="text-white"><span className="text-[#FF4D00]">END:</span> {new Date(activeEvent.endDate).toLocaleString()}</p>
                            {activeEvent.venue && <p className="text-white"><span className="text-[#FF4D00]">VENUE:</span> {activeEvent.venue}</p>}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedEvent("")}
                        className="ck-btn-secondary py-2 px-6 text-xs font-mono tracking-wider uppercase mt-2"
                      >
                        Return to List
                      </button>
                    </motion.div>
                  );
                }

                return (
                  /* Unlocked Feedback & Check-in Form */
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="ck-glass-card p-6 max-w-xl mx-auto w-full"
                  >
                    <div className="border-b border-white/[0.04] pb-4 mb-5">
                      <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">Submit Attendance Clearance</h3>
                      <p className="text-xs text-[#8892A4] mt-1">Please confirm your attendance and provide event feedback.</p>
                    </div>

                    <form onSubmit={handleSubmitAttendance} className="space-y-5">
                      {/* Event Details Summary */}
                      <div className="p-3.5 rounded-xl border border-[#CCFF00]/15 bg-[#CCFF00]/[0.02] text-xs font-mono space-y-1.5">
                        <p className="text-white"><span className="text-[rgba(204,255,0,0.7)]">EVENT:</span> {activeEvent?.title}</p>
                        <p className="text-white"><span className="text-[rgba(204,255,0,0.7)]">CONCLUDED:</span> {activeEvent && new Date(activeEvent.endDate).toLocaleString()}</p>
                      </div>

                      {/* Feedback Rating */}
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-widest text-[#8892A4] mb-2 block">Event Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="w-10 h-10 rounded-lg border border-white/[0.06] bg-black/30 flex items-center justify-center transition-all hover:scale-105 hover:border-[#CCFF00]/40"
                              style={{ color: rating >= star ? "#CCFF00" : "#4B5563" }}
                            >
                              <Zap className="w-5 h-5 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comments */}
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-widest text-[#8892A4] mb-2 block">Key Learnings & Feedback</label>
                        <textarea
                          rows={4}
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="What did you learn? Any comments or suggestions..."
                          className="ck-input w-full"
                          required
                        />
                      </div>

                      {/* Confirmation Checkbox */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01] cursor-pointer hover:bg-white/[0.02] transition-colors select-none">
                        <input
                          type="checkbox"
                          checked={agreeAttended}
                          onChange={(e) => setAgreeAttended(e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-white/[0.08] bg-black text-[#CCFF00] focus:ring-0 cursor-pointer mt-0.5"
                          style={{ accentColor: "#CCFF00" }}
                        />
                        <span className="text-xs text-slate-300 leading-relaxed font-sans">
                          I confirm that I attended this event and that my feedback is accurate.
                        </span>
                      </label>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={submittingAttendance || !agreeAttended}
                        className="w-full ck-btn-primary py-3 text-xs flex items-center justify-center gap-2 font-mono uppercase font-bold tracking-widest"
                      >
                        {submittingAttendance ? (
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                          <>
                            <Zap className="w-4 h-4" /> SUBMIT TELEMETRY CLEARANCE
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                );
              })()
            )}
          </div>
        ) : (
          /* ── Coordinator Active Event Console ── */
          <div className="flex flex-col gap-4">
            {/* Back + Event title */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="ck-glass-card flex items-center justify-between flex-wrap gap-3 p-4"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectedEvent(""); setStats(null); setRecords([]); }}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-black/40 text-[#8892A4] hover:border-[rgba(204,255,0,0.3)] hover:text-[#CCFF00] transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#CCFF00" }}>ACTIVE MISSION</p>
                  <h2 className="font-bold text-white text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {events.find(e => e.id === selectedEvent)?.title}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => { setSelectedEvent(""); setStats(null); setRecords([]); }}
                className="ck-btn-secondary text-[10px] py-1.5 px-3"
              >
                SWITCH
              </button>
            </motion.div>

            {/* Main layout: 2/3 left + 1/3 right */}
            <div className="flex flex-col lg:flex-row gap-4">

              {/* ── LEFT COLUMN: Stats + Logs ── */}
              <div className="flex flex-col gap-4 flex-1 min-w-0">
                {/* Completion rate bar */}
                {stats && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="ck-glass-card p-5 flex items-center gap-5"
                  >
                    {/* SVG ring */}
                    <div className="relative shrink-0" style={{ width: 80, height: 80 }}>
                      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
                        <motion.circle cx="40" cy="40" r="32" fill="none"
                          stroke="#CCFF00" strokeWidth="6" strokeLinecap="round"
                          strokeDasharray={201}
                          initial={{ strokeDashoffset: 201 }}
                          animate={{ strokeDashoffset: 201 - (completionRate / 100) * 201 }}
                          transition={{ duration: 1.4, ease: "easeOut" }}
                          style={{ filter: "drop-shadow(0 0 8px rgba(204,255,0,0.5))" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-black font-mono" style={{ color: "#CCFF00" }}>{completionRate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#4B5563] mb-1">ATTENDANCE RATE</p>
                      <p className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {stats.currentlyPresent + stats.totalCheckedOut} / {stats.totalRegistered} <span className="text-[#4B5563] font-normal">registered</span>
                      </p>
                      {(stats.lateArrivals > 0 || stats.earlyExits > 0) && (
                        <div className="flex gap-3 mt-2">
                          {stats.lateArrivals > 0 && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border" style={{ color: "#FF4D00", borderColor: "rgba(255,77,0,0.2)", background: "rgba(255,77,0,0.05)" }}>
                              LATE: {stats.lateArrivals}
                            </span>
                          )}
                          {stats.earlyExits > 0 && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border" style={{ color: "#FF003C", borderColor: "rgba(255,0,60,0.2)", background: "rgba(255,0,60,0.05)" }}>
                              EARLY EXIT: {stats.earlyExits}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Stat grid */}
                {stats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatTile label="PRESENT" value={stats.currentlyPresent} icon={<UserCheck className="w-4 h-4" />} accent="#CCFF00" />
                    <StatTile label="PENDING" value={stats.pendingArrival} icon={<Clock className="w-4 h-4" />} accent="#FF4D00" />
                    <StatTile label="CHECKED OUT" value={stats.totalCheckedOut} icon={<UserMinus className="w-4 h-4" />} accent="#8892A4" />
                    <StatTile label="TOTAL REGS" value={stats.totalRegistered} icon={<Users className="w-4 h-4" />} accent="#FF003C" />
                  </div>
                )}

                {/* ═══ Live Log Terminal ═══ */}
                <div className="flex flex-col ck-glass-card overflow-hidden" style={{ minHeight: 380 }}>
                  {/* Terminal chrome header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] bg-black/30">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF003C]/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D00]/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00]/80" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white font-semibold">LIVE LOG STREAM</span>
                    </div>
                    <span className="text-[9px] font-mono text-[#4B5563]">{filteredRecords.length} / {records.length} ENTRIES</span>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-white/[0.04] bg-black/20">
                    <div className="flex gap-0.5 p-0.5 rounded-lg bg-black/40 border border-white/[0.04]">
                      {(["ALL", "CHECK_IN", "CHECK_OUT", "WARNINGS"] as const).map(f => (
                        <button key={f} onClick={() => setFilterType(f)}
                          className="px-2.5 py-1.5 rounded-md text-[9px] font-mono uppercase tracking-wide transition-all"
                          style={filterType === f ? { background: "rgba(204,255,0,0.08)", color: "#CCFF00", border: "1px solid rgba(204,255,0,0.15)" } : { color: "#4B5563", border: "1px solid transparent" }}
                        >
                          {f === "ALL" ? "ALL" : f.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                    <div className="relative w-52">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#4B5563]" />
                      <input
                        value={logSearchQuery}
                        onChange={e => setLogSearchQuery(e.target.value)}
                        placeholder="Filter logs..."
                        className="w-full bg-black/40 border border-white/[0.04] rounded-lg text-[11px] font-mono text-white pl-7 pr-3 py-1.5 outline-none focus:border-[rgba(204,255,0,0.2)] placeholder-[#4B5563] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Log entries */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar" style={{ maxHeight: 320 }}>
                    {loading ? (
                      <div className="flex items-center justify-center h-full py-10">
                        <div className="ck-spinner" />
                      </div>
                    ) : filteredRecords.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-10 gap-2">
                        <Activity className="w-8 h-8 text-zinc-700" />
                        <p className="text-[10px] font-mono text-[#4B5563] uppercase tracking-widest">NO LOG ENTRIES</p>
                      </div>
                    ) : (
                      filteredRecords.map((r, idx) => (
                        <motion.div
                          key={r.id || idx}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
                        >
                          <span className="text-[9px] font-mono text-[#4B5563] shrink-0 w-16">{new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                          <span className="text-[10px] font-mono font-bold shrink-0 w-14 px-1.5 py-0.5 rounded text-center" style={{
                            color: r.type === "CHECK_IN" ? "#CCFF00" : "#FF4D00",
                            background: r.type === "CHECK_IN" ? "rgba(204,255,0,0.06)" : "rgba(255,77,0,0.06)",
                          }}>
                            {r.type === "CHECK_IN" ? "→ IN" : "← OUT"}
                          </span>
                          <span className="text-[11px] text-white font-semibold truncate">{r.user?.name || "Unknown"}</span>
                          <span className="text-[10px] text-[#4B5563] truncate hidden sm:block">{r.user?.email}</span>
                          {r.teamCode && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border shrink-0" style={{ color: "#FF4D00", borderColor: "rgba(255,77,0,0.2)", background: "rgba(255,77,0,0.04)" }}>T_{r.teamCode}</span>
                          )}
                          {r.isLate && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border shrink-0" style={{ color: "#FF4D00", borderColor: "rgba(255,77,0,0.2)", background: "rgba(255,77,0,0.04)" }}>LATE</span>}
                          {r.isEarly && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border shrink-0" style={{ color: "#FF003C", borderColor: "rgba(255,0,60,0.2)", background: "rgba(255,0,60,0.04)" }}>EARLY</span>}
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Export */}
                  <div className="flex justify-end px-3.5 py-3 border-t border-white/[0.04] bg-black/20">
                    <button onClick={handleExportCSV} disabled={!records.length} className="ck-btn-secondary text-[10px] py-1.5 px-3 flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> EXPORT CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN: Scan Controller ── */}
              <div className="w-full lg:w-72 shrink-0">
                <div className="sticky top-4 flex flex-col gap-4">
                  <div className="ck-glass-card overflow-hidden">
                    {/* Controller header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4" style={{ color: "#CCFF00" }} />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white font-bold">SCAN CORE</span>
                      </div>
                      <button
                        onClick={() => setShowScanner(!showScanner)}
                        className="flex items-center gap-1.5 text-[9px] font-mono uppercase px-2.5 py-1.5 rounded-lg border transition-all"
                        style={showScanner
                          ? { color: "#CCFF00", borderColor: "rgba(204,255,0,0.25)", background: "rgba(204,255,0,0.06)" }
                          : { color: "#4B5563", borderColor: "rgba(255,255,255,0.06)" }
                        }
                      >
                        <Camera className="w-3 h-3" />
                        {showScanner ? "ACTIVE" : "START"}
                      </button>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                      {/* IN / OUT toggle */}
                      <div className="flex gap-1 p-1 rounded-lg bg-black/40 border border-white/[0.04]">
                        {(["CHECK_IN", "CHECK_OUT"] as const).map(t => (
                          <button key={t} onClick={() => setCheckinType(t)}
                            className="flex-1 py-2 rounded-md text-[10px] font-mono uppercase font-bold transition-all"
                            style={checkinType === t
                              ? { background: t === "CHECK_IN" ? "rgba(204,255,0,0.08)" : "rgba(255,77,0,0.08)", color: t === "CHECK_IN" ? "#CCFF00" : "#FF4D00", border: `1px solid ${t === "CHECK_IN" ? "rgba(204,255,0,0.2)" : "rgba(255,77,0,0.2)"}` }
                              : { color: "#4B5563", border: "1px solid transparent" }
                            }
                          >
                            {t === "CHECK_IN" ? "→ IN" : "← OUT"}
                          </button>
                        ))}
                      </div>

                      {/* QR scanner area */}
                      {showScanner && (
                        <div className="relative rounded-xl border overflow-hidden bg-black" style={{ borderColor: "rgba(204,255,0,0.15)" }}>
                          {/* Corner HUD */}
                          {["tl","tr","bl","br"].map(c => (
                            <div key={c} className="absolute w-3.5 h-3.5"
                              style={{
                                top: c.startsWith("t") ? 4 : undefined, bottom: c.startsWith("b") ? 4 : undefined,
                                left: c.endsWith("l") ? 4 : undefined, right: c.endsWith("r") ? 4 : undefined,
                                borderTop: c.startsWith("t") ? "2px solid #CCFF00" : undefined,
                                borderBottom: c.startsWith("b") ? "2px solid #CCFF00" : undefined,
                                borderLeft: c.endsWith("l") ? "2px solid #CCFF00" : undefined,
                                borderRight: c.endsWith("r") ? "2px solid #CCFF00" : undefined,
                                zIndex: 10,
                              }}
                            />
                          ))}
                          {/* Scan laser */}
                          <div className="qr-scan-line absolute left-0 right-0 h-0.5 z-10" style={{ background: "linear-gradient(90deg, transparent, #CCFF00, transparent)", boxShadow: "0 0 12px rgba(204,255,0,0.8)", top: "4%" }} />
                          <div id="qr-reader" className="w-full" />
                        </div>
                      )}

                      {/* Manual input */}
                      <div>
                        <p className="text-[9px] font-mono text-[#4B5563] uppercase tracking-widest mb-2">MANUAL ENTRY</p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold" style={{ color: "#CCFF00" }}>&gt;</span>
                          <input
                            value={qrInput}
                            onChange={e => setQrInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && qrInput.trim()) handleCheckIn(); }}
                            placeholder="Team code or ID..."
                            className="w-full bg-black/40 border border-white/[0.04] rounded-lg text-[11px] font-mono text-white pl-8 pr-3 py-2.5 outline-none focus:border-[rgba(204,255,0,0.2)] placeholder-[#4B5563] transition-colors"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleCheckIn()}
                        disabled={!qrInput.trim()}
                        className="ck-btn-primary w-full py-2.5 text-xs"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {checkinType === "CHECK_IN" ? "RECORD CHECK-IN" : "RECORD CHECK-OUT"}
                      </button>
                    </div>
                  </div>

                  {/* ═══ Live counter card ═══ */}
                  {stats && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ck-glass-card ck-breathe p-5 text-center"
                      style={{ borderColor: "rgba(204,255,0,0.1)" }}
                    >
                      <p className="text-[9px] font-mono uppercase tracking-widest text-[#4B5563] mb-2">CURRENTLY INSIDE</p>
                      <p className="text-5xl font-black font-mono" style={{ color: "#CCFF00", textShadow: "0 0 30px rgba(204,255,0,0.3)" }}>
                        {String(stats.currentlyPresent).padStart(2, "0")}
                      </p>
                      <div className="mt-3 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#CCFF00] to-[#99BF00]"
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.totalRegistered > 0 ? (stats.currentlyPresent / stats.totalRegistered) * 100 : 0}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-[10px] font-mono text-[#4B5563] mt-2">OF {stats.totalRegistered} REGISTERED</p>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

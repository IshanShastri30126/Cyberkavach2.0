"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, SERVER_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Clock, 
  UserCheck, 
  UserMinus, 
  AlertTriangle, 
  QrCode, 
  Camera, 
  Download, 
  Search, 
  ArrowLeft,
  Activity,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { io, Socket } from "socket.io-client";

export default function AttendancePage() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [checkinType, setCheckinType] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");
  
  // Custom Filters & Views
  const [searchQuery, setSearchQuery] = useState("");
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "CHECK_IN" | "CHECK_OUT" | "WARNINGS">("ALL");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Socket state
  const socketRef = useRef<Socket | null>(null);

  const isCoord = user && ["FACULTY", "STUDENT_COORDINATOR", "TECH"].includes(user.role);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load events
  useEffect(() => {
    if (!token) return;
    const loadEvents = async () => {
      try {
        const endpoint = isCoord ? "/events/all" : "/events";
        const data = await api<{ events: any[] }>(endpoint, { token });
        setEvents(data.events);
      } catch (err) { 
        console.error(err); 
      }
    };
    loadEvents();
  }, [token, isCoord]);

  // Load attendance data
  const loadAttendance = async (eventId: string) => {
    setLoading(true);
    try {
      const data = await api<{ records: any[]; stats: any }>(`/attendance/event/${eventId}`, { token: token || undefined });
      setStats(data.stats); 
      setRecords(data.records);
    } catch (err) { 
      console.error(err); 
      showToast("FAILED TO LOAD TELEMETRY", "error");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (selectedEvent && token) {
      loadAttendance(selectedEvent);

      // Connect socket
      socketRef.current = io(SERVER_BASE_URL, { auth: { token } });
      socketRef.current.emit("join-event", selectedEvent);

      socketRef.current.on("attendance-update", () => {
        // Optimistic refresh on socket update
        loadAttendance(selectedEvent);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.emit("leave-event", selectedEvent);
          socketRef.current.disconnect();
        }
      };
    } else {
      setStats(null);
      setRecords([]);
    }
  }, [selectedEvent, token]);

  // QR Scanner Setup
  useEffect(() => {
    if (showScanner && selectedEvent) {
      scannerRef.current = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scannerRef.current.render(
        async (decodedText) => {
          if (scannerRef.current) scannerRef.current.pause();
          try {
            await handleCheckIn(decodedText);
          } catch (err) {
            // Already handled inside handleCheckIn
          } finally {
            setTimeout(() => { if (scannerRef.current) scannerRef.current.resume(); }, 2000);
          }
        },
        (error) => { /* ignore */ }
      );
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [showScanner, selectedEvent, checkinType, token]);

  const handleCheckIn = async (teamCodeOverride?: string) => {
    try {
      const code = teamCodeOverride || qrInput;
      const body: any = { eventId: selectedEvent, type: checkinType };
      if (code) body.teamCode = code;
      
      await api("/attendance", { method: "POST", token: token || undefined, body: JSON.stringify(body) });
      setQrInput("");
      showToast(`SUCCESSFULLY RECORDED ${checkinType === "CHECK_IN" ? "INBOUND" : "OUTBOUND"} CHECK`, "success");
      
      if (!teamCodeOverride) {
        loadAttendance(selectedEvent);
      }
    } catch (err) { 
      const errMsg = err instanceof Error ? err.message : "COMMAND EXECUTION FAILED";
      showToast(errMsg, "error");
      if (teamCodeOverride) throw err;
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const selectedEventTitle = events.find(ev => ev.id === selectedEvent)?.title || "Event";
    const headers = ["Name", "Email", "Role", "Action Type", "Timestamp", "Late Arrival", "Early Exit"];
    const rows = records.map(r => [
      r.user?.name || "N/A",
      r.user?.email || "N/A",
      r.user?.role || "N/A",
      r.type,
      new Date(r.timestamp).toLocaleString(),
      r.isLate ? "TRUE" : "FALSE",
      r.isEarly ? "TRUE" : "FALSE"
    ]);
    
    const csvString = [headers.join(","), ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_manifest_${selectedEventTitle.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("MANIFEST EXPORTED SUCCESSFULLY", "success");
  };

  const getEventStatus = (ev: any) => {
    const now = new Date();
    const start = new Date(ev.startDate);
    const end = new Date(ev.endDate || ev.startDate);
    if (now >= start && now <= end) return { label: "LIVE OPERATION", color: "text-emerald-400 bg-emerald-950/30 border-emerald-500/30" };
    if (now < start) return { label: "UPCOMING", color: "text-amber-400 bg-amber-950/30 border-amber-500/30" };
    return { label: "ARCHIVED", color: "text-zinc-500 bg-zinc-950/30 border-zinc-800" };
  };

  // Compute live stats progress ring metrics
  const completionRate = stats && stats.totalRegistered > 0
    ? Math.round(((stats.currentlyPresent + stats.totalCheckedOut) / stats.totalRegistered) * 100)
    : 0;

  const statCards = stats ? [
    { label: "PRESENT OPERATIVES", value: stats.currentlyPresent, icon: <UserCheck className="w-5 h-5" />, color: "border-emerald-500/30 bg-emerald-950/5 text-emerald-400" },
    { label: "PENDING ARRIVAL", value: stats.pendingArrival, icon: <Clock className="w-5 h-5" />, color: "border-amber-500/30 bg-amber-950/5 text-amber-400" },
    { label: "CHECKED OUT", value: stats.totalCheckedOut, icon: <UserMinus className="w-5 h-5" />, color: "border-zinc-800 bg-zinc-950/5 text-slate-400" },
    { label: "TOTAL REGISTRATIONS", value: stats.totalRegistered, icon: <Users className="w-5 h-5" />, color: "border-red-900/30 bg-red-950/5 text-red-400" },
  ] : [];

  // Filter and search records inside logs
  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.user?.name?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      r.user?.email?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      r.teamCode?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      r.userId?.toLowerCase().includes(logSearchQuery.toLowerCase());
      
    if (filterType === "ALL") return matchesSearch;
    if (filterType === "CHECK_IN") return matchesSearch && r.type === "CHECK_IN";
    if (filterType === "CHECK_OUT") return matchesSearch && r.type === "CHECK_OUT";
    if (filterType === "WARNINGS") return matchesSearch && (r.isLate || r.isEarly);
    return matchesSearch;
  });

  const filteredEvents = events.filter(ev => 
    ev.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <style>{`
        #reader {
          border: none !important;
        }
        #reader__dashboard_section_csr button {
          background: linear-gradient(135deg, var(--ck-primary-dark), var(--ck-primary)) !important;
          border: 1px solid var(--ck-primary-light) !important;
          color: white !important;
          padding: 6px 12px !important;
          border-radius: 4px !important;
          font-size: 11px !important;
          font-family: 'Share Tech Mono', monospace !important;
          cursor: pointer !important;
          text-transform: uppercase !important;
          box-shadow: 0 0 5px rgba(220,38,38,0.2) !important;
        }
        #reader__dashboard_section_csr button:hover {
          box-shadow: 0 0 10px rgba(255, 0, 60, 0.5) !important;
        }
        #reader select {
          background: rgba(0, 0, 0, 0.8) !important;
          border: 1px solid var(--ck-border) !important;
          color: white !important;
          padding: 6px !important;
          border-radius: 4px !important;
          font-family: 'Share Tech Mono', monospace !important;
          font-size: 11px !important;
          outline: none !important;
        }
        #reader select:focus {
          border-color: var(--ck-accent) !important;
        }
        @keyframes laser-sweep {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-laser {
          animation: laser-sweep 3s linear infinite;
        }
      `}</style>

      {/* Toast Notification HUD */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border flex items-center gap-3 backdrop-blur-md shadow-2xl ${
              toast.type === "success" 
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-emerald-950/40" 
                : "bg-red-950/80 border-red-500/50 text-red-300 shadow-red-950/40"
            }`}
          >
            {toast.type === "success" ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
            <div className="font-mono text-xs uppercase tracking-wider">{toast.message}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header telemetry bar */}
      <div className="ck-card p-4 bg-zinc-950/40 border-zinc-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-[10px] font-mono text-zinc-500">// SYS STATUS: ACTIVE</span>
          <span className="text-zinc-700">|</span>
          <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            CONN: SECURE SOCKET LIVE
          </span>
        </div>
        {user && (
          <div className="text-[10px] font-mono text-zinc-400">
            OPERATOR: <span className="text-red-400 font-bold">{user.name.toUpperCase()}</span> | LEVEL: <span className="text-slate-300 font-semibold">{user.role}</span>
          </div>
        )}
      </div>

      {/* --- EMPTY STATE / CHOOSE MISSION VIEW --- */}
      {!selectedEvent ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold font-mono tracking-tighter uppercase text-white drop-shadow-[0_0_10px_rgba(255,0,0,0.3)]">
                ATTENDANCE STREAM
              </h1>
              <p className="text-xs font-mono text-zinc-500">// CHOOSE MISSION OBJECTIVE // AWAITING PARAMETERS</p>
            </div>
            
            <div className="w-full sm:w-72">
              <div className="ck-input-icon-wrapper">
                <Search className="w-4 h-4 text-zinc-500" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="SEARCH OPERATIONS..."
                  className="ck-input ck-input-with-icon text-xs py-2"
                />
              </div>
            </div>
          </div>
          
          {filteredEvents.length === 0 ? (
            <div className="ck-card p-12 text-center bg-black/40 border-red-950/30">
              <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-widest mb-1">NO ACTIVE MISSIONS FOUND</h3>
              <p className="text-xs text-slate-500">Ensure events have been created or try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((ev, i) => {
                const status = getEventStatus(ev);
                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedEvent(ev.id)}
                    className="ck-card p-5 bg-black/40 border-zinc-800 hover:border-red-500/40 cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border font-mono ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {ev.type === "TEAM" ? "TEAM MODE" : "SINGLE MODE"}
                        </span>
                      </div>
                      <h3 className="text-base font-bold font-mono text-white group-hover:text-red-500 uppercase tracking-tight line-clamp-2 transition-colors mb-2">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mb-4 line-clamp-2">
                        {ev.description || "No description provided for this tactical operation."}
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-zinc-900/60 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-500">
                        DATE: {new Date(ev.startDate).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-mono text-red-500 font-bold group-hover:underline flex items-center gap-1">
                        LAUNCH CONSOLE &rarr;
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* --- SELECTED EVENT LIVE CONSOLE VIEW --- */
        <div className="space-y-6">
          {/* Mission parameters banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 ck-card bg-red-950/5 border-red-900/20">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedEvent("")} 
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                title="Return to selection"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="text-[9px] uppercase font-mono text-red-500 font-semibold tracking-wider">// ACTIVE MISSION PARAMETERS</div>
                <h2 className="text-lg font-bold text-white font-mono uppercase tracking-tight">
                  {events.find(ev => ev.id === selectedEvent)?.title || "UNKNOWN MISSION"}
                </h2>
              </div>
            </div>
            <button 
              onClick={() => setSelectedEvent("")} 
              className="ck-btn-secondary text-xs flex items-center gap-2 border-zinc-800 py-2 hover:border-red-500/50"
            >
              SWITCH MISSION
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Telemetry and Logs Panel (Left) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Telemetry Stats */}
              {stats && (
                <div className="space-y-4">
                  {/* Progress ring banner */}
                  <div className="flex items-center gap-4 p-4 ck-card bg-red-950/5 border-red-900/10">
                    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          className="stroke-zinc-900"
                          strokeWidth="4"
                          fill="transparent"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          className="stroke-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-all duration-500"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={175.9}
                          strokeDashoffset={175.9 - (completionRate / 100) * 175.9}
                        />
                      </svg>
                      <div className="absolute font-mono text-xs font-bold text-white">
                        {completionRate}%
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">// MANIFEST COMPLETION RATE</h3>
                      <p className="text-sm font-bold text-white font-mono mt-0.5">
                        {stats.currentlyPresent + stats.totalCheckedOut} OF {stats.totalRegistered} REGISTERED OPERATIVES SECURED
                      </p>
                    </div>
                  </div>

                  {/* Standard Stat Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map((s, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: i * 0.05 }} 
                        className={`ck-card p-4 border flex flex-col justify-between ${s.color}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] uppercase tracking-wider font-bold font-mono">{s.label}</span>
                          {s.icon}
                        </div>
                        <p className="text-2xl font-bold font-mono mt-1 text-white">
                          {String(s.value).padStart(2, '0')}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Late/Early Warning Panel */}
              {stats && (stats.lateArrivals > 0 || stats.earlyExits > 0) && (
                <div className="flex flex-wrap gap-4 p-4 ck-card bg-amber-950/10 border-amber-900/30">
                  <div className="flex items-center gap-2 text-amber-500 text-xs font-mono font-semibold uppercase tracking-wider w-full mb-1">
                    <AlertTriangle className="w-4 h-4" /> // MISSION ANOMALIES DETECTED
                  </div>
                  {stats.lateArrivals > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono bg-amber-950/30 border border-amber-900/40 px-2 py-1 rounded">
                      <span>LATE ARRIVALS:</span>
                      <span className="font-bold text-white">{stats.lateArrivals}</span>
                    </div>
                  )}
                  {stats.earlyExits > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-orange-400 font-mono bg-orange-950/30 border border-orange-900/40 px-2 py-1 rounded">
                      <span>EARLY EXITS:</span>
                      <span className="font-bold text-white">{stats.earlyExits}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Real-time Operation Logs Terminal */}
              <div className="ck-card bg-black/60 border-zinc-800 relative overflow-hidden flex flex-col h-[400px]">
                {/* Terminal header */}
                <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300 font-semibold">LIVE OPERATIONAL LOG STREAM</span>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500">
                    MANIFEST: ACTIVE ({filteredRecords.length} / {records.length})
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="p-3 border-b border-zinc-900 bg-black/40 flex flex-col sm:flex-row gap-2 justify-between items-center">
                  <div className="w-full sm:w-auto flex gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-850">
                    {(["ALL", "CHECK_IN", "CHECK_OUT", "WARNINGS"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setFilterType(tab)}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase transition ${
                          filterType === tab ? "bg-red-950/60 text-red-400 font-bold border border-red-900/40" : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {tab === "ALL" ? "ALL LOGS" : tab.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                  <div className="w-full sm:w-64">
                    <input
                      value={logSearchQuery}
                      onChange={e => setLogSearchQuery(e.target.value)}
                      placeholder="FILTER MANIFEST LOGS..."
                      className="ck-input text-[10px] py-1.5 bg-zinc-950 border-zinc-800"
                    />
                  </div>
                </div>

                {/* Log terminal contents */}
                <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-2 select-text scrollbar-thin">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                    </div>
                  ) : filteredRecords.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-650">
                      // NO ENTRIES FOUND IN MANIFEST FEED
                    </div>
                  ) : (
                    filteredRecords.map((r, idx) => (
                      <div key={r.id || idx} className="flex flex-wrap items-center gap-2 py-1 border-b border-zinc-900/30 hover:bg-red-950/5 rounded px-2 transition-colors">
                        <span className="text-zinc-500">[{new Date(r.timestamp).toLocaleTimeString()}]</span>
                        <span className={r.type === "CHECK_IN" ? "text-emerald-500 font-semibold" : "text-amber-500 font-semibold"}>
                          {r.type === "CHECK_IN" ? "[✓ INBOUND]" : "[✗ OUTBOUND]"}
                        </span>
                        <span className="text-slate-200 font-bold">{r.user?.name || "Anonymous"}</span>
                        <span className="text-zinc-550 text-[10px] font-normal">({r.user?.email})</span>
                        {r.teamCode && <span className="text-red-400/80 bg-red-950/20 px-1.5 py-0.5 rounded text-[9px] border border-red-950/40 font-mono">T_{r.teamCode}</span>}
                        {r.isLate && <span className="text-[9px] bg-red-950/80 text-red-400 px-1.5 py-0.5 rounded border border-red-900/40 font-semibold animate-pulse">LATE</span>}
                        {r.isEarly && <span className="text-[9px] bg-amber-950/80 text-amber-400 px-1.5 py-0.5 rounded border border-amber-900/40 font-semibold">EARLY</span>}
                      </div>
                    ))
                  )}
                </div>
                
                {/* Terminal Footer Actions */}
                <div className="p-3 border-t border-zinc-900 bg-zinc-950/40 flex justify-end">
                  <button 
                    onClick={handleExportCSV} 
                    disabled={records.length === 0}
                    className="ck-btn-primary text-[10px] py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> EXPORT MANIFEST
                  </button>
                </div>
              </div>
            </div>

            {/* SCAN_CORE Controller Panel (Right) */}
            <div>
              <div className="ck-card p-5 sticky top-24 border-red-900/40 relative overflow-hidden bg-black/40">
                {/* Visual scanline element */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/40 to-transparent opacity-60" />
                
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold flex items-center gap-2 uppercase font-mono tracking-wider text-sm text-white">
                    <QrCode className="w-4 h-4 text-red-500 animate-pulse" /> SCAN CORE UNIT
                  </h3>
                  <button 
                    onClick={() => setShowScanner(!showScanner)} 
                    className={`ck-btn-secondary text-[9px] px-2.5 py-1.5 gap-1.5 transition-all ${
                      showScanner 
                        ? "border-red-500/50 bg-red-950/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                        : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <Camera className="w-3 h-3" /> {showScanner ? "OFFLINE" : "ONLINE"}
                  </button>
                </div>

                {/* Inbound / Outbound selector toggles */}
                <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-900 mb-4">
                  <button 
                    onClick={() => setCheckinType("CHECK_IN")} 
                    className={`flex-1 py-2 rounded-lg text-[10px] font-mono transition uppercase font-bold ${
                      checkinType === "CHECK_IN" 
                        ? "bg-red-950/80 text-red-400 border border-red-900/40 shadow-[0_0_8px_rgba(239,68,68,0.15)]" 
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    INBOUND
                  </button>
                  <button 
                    onClick={() => setCheckinType("CHECK_OUT")} 
                    className={`flex-1 py-2 rounded-lg text-[10px] font-mono transition uppercase font-bold ${
                      checkinType === "CHECK_OUT" 
                        ? "bg-zinc-900 text-slate-300 border border-zinc-800" 
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    OUTBOUND
                  </button>
                </div>

                {/* Animated scanner viewer */}
                {showScanner && (
                  <div className="mb-4 relative overflow-hidden rounded-xl border border-red-500/20 bg-black p-1.5">
                    {/* HUD corners */}
                    <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-red-500 z-10" />
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-red-500 z-10" />
                    <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-red-500 z-10" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-red-500 z-10" />
                    
                    {/* Laser scanning beam animation */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-laser pointer-events-none z-10" />
                    
                    <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
                  </div>
                )}

                <p className="text-[10px] text-center font-mono text-zinc-550 mb-3">// OR MANUAL HEX INPUT</p>
                
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-zinc-500 font-bold select-none">
                      CMD &gt;
                    </span>
                    <input 
                      className="ck-input font-mono text-xs pl-12 py-2.5 bg-zinc-950 border-zinc-900" 
                      placeholder="ENTER TEAM CODE OR ID..." 
                      value={qrInput} 
                      onChange={(e) => setQrInput(e.target.value)} 
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && qrInput.trim()) {
                          handleCheckIn();
                        }
                      }}
                    />
                  </div>
                  <button 
                    onClick={() => handleCheckIn()} 
                    disabled={!qrInput.trim()}
                    className="ck-btn-primary w-full text-xs font-mono py-2.5"
                  >
                    {checkinType === "CHECK_IN" ? "FORCE INBOUND RECORD" : "FORCE OUTBOUND RECORD"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

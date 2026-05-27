"use client";
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, SERVER_BASE_URL } from "@/lib/api";
import { motion } from "framer-motion";
import { Users, Clock, UserCheck, UserMinus, AlertTriangle, QrCode, Camera } from "lucide-react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
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
  
  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Socket state
  const socketRef = useRef<Socket | null>(null);

  const isCoord = user && ["FACULTY", "STUDENT_COORDINATOR", "TECH"].includes(user.role);

  // Load events
  useEffect(() => {
    if (!token) return;
    const loadEvents = async () => {
      try {
        const endpoint = isCoord ? "/events/all" : "/events";
        const data = await api<{ events: any[] }>(endpoint, { token });
        setEvents(data.events);
      } catch (err) { console.error(err); }
    };
    loadEvents();
  }, [token, isCoord]);

  // Load attendance data
  const loadAttendance = async (eventId: string) => {
    setLoading(true);
    try {
      const data = await api<{ records: any[]; stats: any }>(`/attendance/event/${eventId}`, { token: token || undefined });
      setStats(data.stats); setRecords(data.records);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (selectedEvent && token) {
      loadAttendance(selectedEvent);

      // Connect socket
      socketRef.current = io(SERVER_BASE_URL, { auth: { token } });
      socketRef.current.emit("join-event", selectedEvent);

      socketRef.current.on("attendance-update", () => {
        // Optimistic refresh on update
        loadAttendance(selectedEvent);
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.emit("leave-event", selectedEvent);
          socketRef.current.disconnect();
        }
      };
    }
  }, [selectedEvent, token]);

  // QR Scanner Setup
  useEffect(() => {
    if (showScanner) {
      scannerRef.current = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scannerRef.current.render(
        async (decodedText) => {
          // Pause scanning on successful read
          if (scannerRef.current) scannerRef.current.pause();
          try {
            await handleCheckIn(decodedText);
            alert(`Scanned: ${decodedText}`);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Failed");
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
      if (!teamCodeOverride) loadAttendance(selectedEvent); // If manual input, trigger load, if via scanner, socket will refresh it
    } catch (err) { 
      if (!teamCodeOverride) alert(err instanceof Error ? err.message : "Failed");
      else throw err;
    }
  };

  const statCards = stats ? [
    { label: "PRESENT_OPERATIVES", value: stats.currentlyPresent, icon: <UserCheck className="w-6 h-6" />, color: "from-red-600 to-red-400" },
    { label: "PENDING_ARRIVAL", value: stats.pendingArrival, icon: <Clock className="w-6 h-6" />, color: "from-red-900 to-red-700" },
    { label: "CHECKED_OUT", value: stats.totalCheckedOut, icon: <UserMinus className="w-6 h-6" />, color: "from-zinc-800 to-zinc-600" },
    { label: "TOTAL_REGISTRATIONS", value: stats.totalRegistered, icon: <Users className="w-6 h-6" />, color: "from-red-950 to-red-900" },
  ] : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-mono tracking-tighter uppercase" style={{ color: "var(--ck-text)" }}>ATTENDANCE_STREAM</h1>
        <p className="mt-1" style={{ color: "var(--ck-text-secondary)" }}>LIVE_CHECK_IN // REALTIME_TELEMETRY</p>
      </div>

      {/* Event Selector */}
      <div className="mb-6">
        <label className="ck-label">Select Mission</label>
        <select className="ck-input max-w-md" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
          <option value="">SELECT_EVENT_ID...</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title.toUpperCase()} — {new Date(ev.startDate).toLocaleDateString()}</option>)}
        </select>
      </div>

      {selectedEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            {/* Live Stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {statCards.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="ck-card p-4 group">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-2 shadow-[0_0_10px_rgba(220,38,38,0.3)] group-hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-shadow`}>{s.icon}</div>
                    <p className="text-2xl font-bold font-mono" style={{ color: "var(--ck-text)" }}>{String(s.value).padStart(2, '0')}</p>
                    <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--ck-text-muted)" }}>{s.label}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {stats && (stats.lateArrivals > 0 || stats.earlyExits > 0) && (
              <div className="flex gap-4 mb-6">
                {stats.lateArrivals > 0 && <div className="ck-card p-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-sm" style={{ color: "var(--ck-text)" }}>{stats.lateArrivals} late arrivals</span></div>}
                {stats.earlyExits > 0 && <div className="ck-card p-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /><span className="text-sm" style={{ color: "var(--ck-text)" }}>{stats.earlyExits} early exits</span></div>}
              </div>
            )}
          </div>

          <div>
            {/* Quick Check-in & Scanner */}
            <div className="ck-card p-5 sticky top-24 border-red-900/40 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2 uppercase font-mono tracking-tighter" style={{ color: "var(--ck-text)" }}><QrCode className="w-5 h-5 text-red-500" /> SCAN_CORE</h3>
                <button onClick={() => setShowScanner(!showScanner)} className={`ck-btn-secondary text-[10px] py-1.5 ${showScanner ? "ring-2 ring-red-500 bg-red-900/30" : ""}`}>
                  <Camera className="w-3 h-3" /> {showScanner ? "OFFLINE" : "ONLINE"}
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <button onClick={() => setCheckinType("CHECK_IN")} className={`flex-1 py-2 rounded-lg text-xs font-mono transition uppercase ${checkinType === "CHECK_IN" ? "bg-red-900/80 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)] border border-red-500/50" : "bg-black/40 text-slate-400 border border-red-900/20"}`}>INBOUND</button>
                <button onClick={() => setCheckinType("CHECK_OUT")} className={`flex-1 py-2 rounded-lg text-xs font-mono transition uppercase ${checkinType === "CHECK_OUT" ? "bg-zinc-800 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-zinc-700" : "bg-black/40 text-slate-400 border border-red-900/20"}`}>OUTBOUND</button>
              </div>

              {showScanner && (
                <div className="mb-4 overflow-hidden rounded-xl border-2 border-[var(--ck-border)]" style={{ background: "black" }}>
                  <div id="reader" className="w-full"></div>
                </div>
              )}

              <p className="text-xs text-center mb-2" style={{ color: "var(--ck-text-muted)" }}>OR enter manually</p>
              
              <div className="flex flex-col gap-2">
                <input className="ck-input font-mono text-xs" placeholder="ENTER_TEAM_CODE_HEX..." value={qrInput} onChange={(e) => setQrInput(e.target.value)} />
                <button onClick={() => handleCheckIn()} className="ck-btn-primary w-full text-xs font-mono uppercase">{checkinType === "CHECK_IN" ? "FORCE_INBOUND" : "FORCE_OUTBOUND"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <>
          {/* Records Table */}
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>
          ) : records.length > 0 && (
            <div className="ck-card overflow-hidden overflow-x-auto">
              <table className="ck-table">
                <thead><tr><th>Name</th><th>Action</th><th>Time</th><th>Flags</th></tr></thead>
                <tbody>
                  {records.slice(0, 50).map((r) => (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td className="text-sm font-medium text-white">{r.user?.name}</td>
                      <td><span className={`ck-badge ${r.type === "CHECK_IN" ? "ck-badge-success" : "ck-badge-warning"}`}>{r.type}</span></td>
                      <td className="text-[10px] font-mono" style={{ color: "var(--ck-text-muted)" }}>{new Date(r.timestamp).toLocaleString().toUpperCase()}</td>
                      <td>{r.isLate && <span className="ck-badge ck-badge-danger mr-1">LATE</span>}{r.isEarly && <span className="ck-badge ck-badge-warning">EARLY</span>}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

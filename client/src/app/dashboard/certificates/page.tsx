"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, apiUpload, SERVER_BASE_URL, API_BASE } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileCheck, Upload, Plus, Search, Download, ShieldCheck, X, FileSpreadsheet,
  Users, AlertCircle, CheckCircle, Archive, Trash2, Eye, Palette,
  Terminal, Cpu, Layers, Activity, Calendar, ArrowRight, RefreshCw, FileText
} from "lucide-react";

interface Template { id: string; name: string; fileUrl: string; fileType: string; createdBy?: { name: string }; createdAt: string; }
interface Certificate { id: string; uniqueCode: string; recipientName: string; recipientEmail?: string; status: string; generatedAt?: string; createdAt?: string; fileUrl?: string; }
interface ImportedRecipient { row?: number; name: string; email?: string; valid: boolean; errors: string[]; }

export default function CertificatesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Sort States for Certificates
  const [certSearchQuery, setCertSearchQuery] = useState("");
  const [certSortBy, setCertSortBy] = useState<"date" | "name">("date");

  // Modal states
  const [showGenerate, setShowGenerate] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Form states
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [recipientText, setRecipientText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [templateName, setTemplateName] = useState("");
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importedRecipients, setImportedRecipients] = useState<ImportedRecipient[]>([]);
  const [importSummary, setImportSummary] = useState<{ total: number; valid: number; invalid: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Added for UX upgrade
  const [systemTime, setSystemTime] = useState("");
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [activeImportTab, setActiveImportTab] = useState<"text" | "file" | "event">("text");

  // System time updater
  useEffect(() => {
    setSystemTime(new Date().toISOString().replace("T", " ").substring(0, 19).toUpperCase());
    const t = setInterval(() => {
      const now = new Date();
      setSystemTime(now.toISOString().replace("T", " ").substring(0, 19).toUpperCase());
    }, 1000);
    return () => clearInterval(t);
  }, []);

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
    if (!token) return;
    const load = async () => {
      try {
        const [t, e] = await Promise.all([
          api<{ templates: Template[] }>("/certificates/templates", { token }),
          api<{ events: any[] }>("/events/all", { token }),
        ]);
        setTemplates(t.templates); setEvents(e.events);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const loadCerts = useCallback(async (eventId: string) => {
    try {
      const data = await api<{ certificates: Certificate[] }>(`/certificates/event/${eventId}`, { token: token || undefined });
      setCerts(data.certificates);
    } catch (err) { console.error(err); }
  }, [token]);

  useEffect(() => { if (selectedEvent) loadCerts(selectedEvent); }, [selectedEvent, loadCerts]);

  // Template upload
  const handleUploadTemplate = async () => {
    if (!templateFile) return;
    try {
      const formData = new FormData();
      formData.append("template", templateFile);
      formData.append("name", templateName || templateFile.name);
      await apiUpload("/certificates/templates", formData, token || undefined);
      setShowUpload(false); setTemplateFile(null); setTemplateName("");
      const t = await api<{ templates: Template[] }>("/certificates/templates", { token: token || undefined });
      setTemplates(t.templates);
      showToast("Template uploaded successfully!", "success");
    } catch (err) { showToast(err instanceof Error ? err.message : "Upload failed", "error"); }
  };

  // CSV/Excel import
  const handleFileImport = async (file: File) => {
    setImporting(true); setImportFile(file);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await apiUpload<{ recipients: ImportedRecipient[]; summary: { total: number; valid: number; invalid: number } }>(
        "/certificates/import", formData, token || undefined
      );
      setImportedRecipients(data.recipients);
      setImportSummary(data.summary);
      showToast("File parsed successfully!", "success");
    } catch (err) { showToast(err instanceof Error ? err.message : "Import failed", "error"); }
    finally { setImporting(false); }
  };

  // Import from event registrations
  const handleImportFromRegistrations = async () => {
    if (!selectedEvent) { showToast("Select an event first", "error"); return; }
    setImporting(true);
    try {
      const data = await api<{ recipients: ImportedRecipient[]; summary: { total: number; valid: number; invalid: number } }>(
        "/certificates/import-registrations", { method: "POST", token: token || undefined, body: JSON.stringify({ eventId: selectedEvent }) }
      );
      setImportedRecipients(data.recipients);
      setImportSummary(data.summary);
      // Auto-populate text area too
      setRecipientText(data.recipients.map((r) => `${r.name}${r.email ? `, ${r.email}` : ""}`).join("\n"));
      setShowImport(false);
      showToast("Registrations imported successfully!", "success");
    } catch (err) { showToast(err instanceof Error ? err.message : "Import failed", "error"); }
    finally { setImporting(false); }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileImport(file);
  };

  // Bulk generate
  const handleBulkGenerate = async () => {
    if (!selectedEvent || !recipientText.trim()) return;
    setGenerating(true); 
    setGenerationProgress(0);
    
    const lines = recipientText.trim().split("\n").filter(Boolean);
    const recipients = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return { name: parts[0], email: parts[1] || undefined };
    });

    setGenerationLogs([
      `[SYS_INIT] CONNECTING TO SECURE VAULT ENGINE...`,
      `[SYS_VAL] VERIFYING RECIPIENTS INTEGRITY (COUNT: ${recipients.length})...`,
    ]);

    const logSteps = [
      "[SYS_AUTH] PARSING AND PACKAGING SIGNATURE METADATA...",
      "[SEC_CRYPT] GENERATING DIGITAL CERTIFICATE KEYPAIR SEGMENTS...",
      "[SYS_RENDER] COMPILING DESIGN SCHEMATICS...",
      "[SYS_SYNC] PRE-COMPUTING SYSTEM IDENTIFIERS...",
      "[SEC_SIGN] PREPARING SECURITY KEY SIGNATURES..."
    ];

    let logIdx = 0;
    // Simulate progress and logs for UX
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        const next = Math.min(prev + Math.random() * 12, 88);
        if (logIdx < logSteps.length && Math.random() > 0.4) {
          const stepLog = logSteps[logIdx];
          setGenerationLogs((prevLogs) => [...prevLogs, stepLog]);
          logIdx++;
        } else if (Math.random() > 0.7) {
          // Add dynamic recipient logging
          const randomRec = recipients[Math.floor(Math.random() * recipients.length)];
          if (randomRec) {
            const recLog = `[GEN_PROC] PROCESSING CREDENTIAL FOR: ${randomRec.name.toUpperCase()}`;
            setGenerationLogs((prevLogs) => [
              ...prevLogs,
              recLog
            ]);
          }
        }
        return next;
      });
    }, 280);

    try {
      const data = await api<{ count: number }>("/certificates/bulk", {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ eventId: selectedEvent, templateId: selectedTemplate || undefined, recipients }),
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGenerationLogs((prevLogs) => [
        ...prevLogs,
        `[GEN_COMP] SUCCESSFULLY RENDERED ${data.count} CERTIFICATE(S).`,
        "[SYS_SYNC] WRITING ARCHIVES TO PRODUCTION STORAGE...",
        "[SYS_OK] SECURE GENERATION SEQUENCE COMPLETED."
      ]);

      setTimeout(() => {
        showToast(`Successfully generated ${data.count} certificates!`, "success");
        setShowGenerate(false); 
        setRecipientText(""); 
        setGenerationProgress(0);
        setImportedRecipients([]); 
        setImportSummary(null);
        setGenerationLogs([]);
        loadCerts(selectedEvent);
      }, 1200);
    } catch (err) { 
      clearInterval(progressInterval);
      setGenerationProgress(0);
      setGenerationLogs((prevLogs) => [
        ...prevLogs,
        `[FATAL_ERR] PROTOCOL ABORTED: ${err instanceof Error ? err.message.toUpperCase() : "UNKNOWN_ERROR"}`
      ]);
      showToast(err instanceof Error ? err.message : "Generation failed", "error"); 
    }
    finally { 
      setGenerating(false); 
    }
  };

  // ZIP download
  const handleDownloadZip = () => {
    if (!selectedEvent) return;
    window.open(`${API_BASE}/certificates/download-zip/${selectedEvent}`, "_blank");
  };
  
  const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await api(`/certificates/templates/${templateId}`, { method: "DELETE", token: token || undefined });
      showToast("Template deleted successfully!", "success");
      const t = await api<{ templates: Template[] }>("/certificates/templates", { token: token || undefined });
      setTemplates(t.templates);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  };

  const handleDeleteCert = async (certId: string) => {
    if (!confirm("Are you sure you want to delete this certificate? This will remove it permanently.")) return;
    try {
      await api(`/certificates/${certId}`, { method: "DELETE", token: token || undefined });
      showToast("Certificate deleted successfully!", "success");
      if (selectedEvent) loadCerts(selectedEvent);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#CCFF00", boxShadow: "0 0 8px #CCFF00" }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "#CCFF00" }}>CREDENTIAL ENGINE · ONLINE</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            CERTIFICATE <span style={{ color: "#CCFF00" }}>GEN</span>
          </h1>
          <p className="text-[11px] font-mono mt-1" style={{ color: "#4B5563" }}>
            BULK ISSUANCE · TEMPLATE VAULT · VERIFICATION CHAIN
          </p>
        </div>

        {/* Header stats */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end gap-0.5 px-4 py-2.5 rounded-xl border bg-[#0D0F14]" style={{ borderColor: "#1A1E26" }}>
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#4B5563" }}>SYS TIME</span>
            <span className="text-xs font-mono font-bold" style={{ color: "#CCFF00" }}>{systemTime || "SYNCING..."}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5 px-4 py-2.5 rounded-xl border bg-[#0D0F14]" style={{ borderColor: "#1A1E26" }}>
            <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#4B5563" }}>TEMPLATES</span>
            <span className="text-xs font-mono font-bold text-white">{templates.length} UNITS</span>
          </div>
        </div>
      </div>

      {/* ── Action row ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/certificates/builder"
          className="ck-btn-secondary flex items-center gap-2 text-xs py-2 px-4"
        >
          <Palette className="w-4 h-4" /> DESIGN TEMPLATE
        </Link>
        <button onClick={() => setShowUpload(true)}
          className="ck-btn-secondary flex items-center gap-2 text-xs py-2 px-4"
        >
          <Upload className="w-4 h-4" /> UPLOAD TEMPLATE
        </button>
        <button onClick={() => setShowGenerate(true)}
          className="ck-btn-primary flex items-center gap-2 text-xs py-2 px-4"
        >
          <Plus className="w-4 h-4" /> GENERATE CERTS
        </button>
      </div>

      {/* ── Templates Vault ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4" style={{ color: "#CCFF00" }} />
          <h2 className="text-sm font-bold uppercase tracking-widest text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            TEMPLATE VAULT <span className="text-[#4B5563] font-normal">({templates.length})</span>
          </h2>
        </div>

        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-4 rounded-xl border border-dashed"
            style={{ borderColor: "rgba(204,255,0,0.15)", background: "rgba(204,255,0,0.02)" }}
          >
            <div className="w-14 h-14 rounded-2xl border flex items-center justify-center" style={{ borderColor: "rgba(204,255,0,0.2)", background: "rgba(204,255,0,0.04)" }}>
              <Upload className="w-6 h-6" style={{ color: "#CCFF00" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">No Templates Found</p>
              <p className="text-xs text-[#4B5563] font-mono mt-1">Upload or design a certificate template to begin</p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/certificates/builder" className="ck-btn-secondary text-xs py-1.5 px-3">OPEN DESIGNER</Link>
              <button onClick={() => setShowUpload(true)} className="ck-btn-primary text-xs py-1.5 px-3">UPLOAD FILE</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {templates.map((t, i) => (
              <motion.div key={t.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => router.push(`/dashboard/certificates/builder?templateId=${t.id}`)}
                className="group relative rounded-xl border bg-[#0D0F14] overflow-hidden cursor-pointer transition-all hover:border-[rgba(204,255,0,0.3)]"
                style={{ borderColor: "#1A1E26" }}
              >
                <button
                  onClick={e => handleDeleteTemplate(t.id, e)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-lg border bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-[rgba(255,0,60,0.5)]"
                  style={{ borderColor: "#1A1E26", color: "#FF003C" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="h-24 flex items-center justify-center bg-black border-b overflow-hidden" style={{ borderColor: "#1A1E26" }}>
                  {t.fileType && t.fileType.toLowerCase() !== "pdf" ? (
                    <img src={`${SERVER_BASE_URL}${t.fileUrl}`} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <FileCheck className="w-7 h-7 text-[#4B5563] group-hover:text-[#CCFF00] transition-colors" />
                      <span className="text-[9px] font-mono text-[#4B5563]">PDF</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider" style={{ color: "#CCFF00" }}>
                    <Palette className="w-3.5 h-3.5" /> EDIT
                  </div>
                </div>

                <div className="p-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-white truncate">{t.name}</p>
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border shrink-0 uppercase" style={{ color: "#FF4D00", borderColor: "rgba(255,77,0,0.25)", background: "rgba(255,77,0,0.06)" }}>
                    {t.fileType}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Certificates Table ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color: "#CCFF00" }} />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              ISSUED CERTIFICATES
            </h2>
          </div>
          {certs.length > 0 && (
            <button onClick={handleDownloadZip} className="ck-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5" /> DOWNLOAD ZIP
            </button>
          )}
        </div>

        {/* Event + search filter row */}
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1 flex-1 min-w-[200px] max-w-xs">
            <label className="ck-label">Filter by Event</label>
            <select className="ck-input ck-select text-xs" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
              <option value="">All events...</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </div>
          {selectedEvent && certs.length > 0 && (
            <>
              <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                <label className="ck-label">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4B5563]" />
                  <input value={certSearchQuery} onChange={e => setCertSearchQuery(e.target.value)}
                    placeholder="Name, email or code..."
                    className="ck-input text-xs pl-8"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="ck-label">Sort</label>
                <select className="ck-input ck-select text-xs" value={certSortBy} onChange={e => setCertSortBy(e.target.value as any)}>
                  <option value="date">NEWEST FIRST</option>
                  <option value="name">ALPHABETICAL</option>
                </select>
              </div>
            </>
          )}
        </div>

        {!selectedEvent ? (
          /* Workflow guide */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: "01", icon: <Calendar className="w-5 h-5" />, title: "LINK EVENT", desc: "Select target event to view or generate certificates", color: "#CCFF00" },
              { step: "02", icon: <Palette className="w-5 h-5" />, title: "DESIGN TEMPLATE", desc: "Build credential layout in the designer workspace", color: "#FF4D00", action: () => router.push("/dashboard/certificates/builder") },
              { step: "03", icon: <Plus className="w-5 h-5" />, title: "BULK GENERATE", desc: "Issue certificates to participants via CSV or registrations", color: "#FF003C", action: () => setShowGenerate(true) },
            ].map(s => (
              <button key={s.step} type="button" onClick={s.action}
                className="text-left p-4 rounded-xl border bg-[#0D0F14] hover:bg-[#121519] transition-all group"
                style={{ borderColor: "#1A1E26" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center border" style={{ color: s.color, borderColor: `${s.color}25`, background: `${s.color}08` }}>{s.icon}</div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border" style={{ color: s.color, borderColor: `${s.color}25` }}>STEP {s.step}</span>
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-1 group-hover:text-[#CCFF00] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</h3>
                <p className="text-[10px] font-mono text-[#4B5563] leading-relaxed">{s.desc}</p>
              </button>
            ))}
          </div>
        ) : certs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-xl border bg-[#0D0F14]" style={{ borderColor: "#1A1E26" }}>
            <div className="w-12 h-12 rounded-2xl border flex items-center justify-center" style={{ borderColor: "#1A1E26" }}>
              <FileText className="w-6 h-6 text-[#4B5563]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">No Certificates Yet</p>
              <p className="text-xs text-[#4B5563] font-mono mt-1">No certificates generated for this event.</p>
            </div>
            <button type="button" onClick={() => setShowGenerate(true)} className="ck-btn-primary text-xs py-2 px-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> GENERATE NOW
            </button>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#1A1E26" }}>
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.3)" }}>
                    {["RECIPIENT", "EMAIL", "CERT ID", "STATUS", "DATE", "ACTIONS"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-b"
                        style={{ color: "rgba(204,255,0,0.6)", borderColor: "#1A1E26" }}
                      >{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {certs
                    .filter(c => !certSearchQuery || c.recipientName.toLowerCase().includes(certSearchQuery.toLowerCase()) || c.recipientEmail?.toLowerCase().includes(certSearchQuery.toLowerCase()) || c.uniqueCode.toLowerCase().includes(certSearchQuery.toLowerCase()))
                    .sort((a, b) => certSortBy === "name" ? a.recipientName.localeCompare(b.recipientName) : new Date(b.generatedAt || b.createdAt || 0).getTime() - new Date(a.generatedAt || a.createdAt || 0).getTime())
                    .map(c => (
                      <tr key={c.id} className="border-b transition-colors hover:bg-[rgba(204,255,0,0.02)]" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        <td className="px-4 py-3 text-sm font-bold text-white">{c.recipientName}</td>
                        <td className="px-4 py-3 text-xs text-[#4B5563]">{c.recipientEmail || "—"}</td>
                        <td className="px-4 py-3">
                          <code className="text-[10px] px-2 py-0.5 rounded border" style={{ color: "#FF4D00", borderColor: "rgba(255,77,0,0.2)", background: "rgba(255,77,0,0.05)" }}>
                            {c.uniqueCode}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          <span className="ck-badge ck-badge-success text-[9px]">{c.status}</span>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-[#4B5563]">
                          {c.generatedAt ? new Date(c.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {c.fileUrl && (
                              <>
                                <a href={`${SERVER_BASE_URL}${c.fileUrl}`} target="_blank" rel="noopener noreferrer"
                                  className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:underline transition-colors"
                                  style={{ color: "#CCFF00" }}
                                >
                                  <Eye className="w-3.5 h-3.5" /> VIEW
                                </a>
                                <a href={`${SERVER_BASE_URL}${c.fileUrl}`} download target="_blank" rel="noopener noreferrer"
                                  className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:underline transition-colors text-[#FF4D00]"
                                >
                                  <Download className="w-3.5 h-3.5" /> DL
                                </a>
                              </>
                            )}
                            <a href={`/verify/${c.uniqueCode}`} target="_blank"
                              className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:underline transition-colors text-[#8892A4] hover:text-white"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> VERIFY
                            </a>
                            <button type="button" onClick={() => handleDeleteCert(c.id)}
                              className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:underline transition-colors"
                              style={{ color: "#FF003C" }}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> DEL
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Upload Template Modal ── */}
      <AnimatePresence>
        {showUpload && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border bg-[#0D0F14] overflow-hidden"
              style={{ borderColor: "rgba(204,255,0,0.2)" }}
            >
              {/* Modal header bar */}
              <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #CCFF00, transparent)" }} />
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#1A1E26" }}>
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" style={{ color: "#CCFF00" }} />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>UPLOAD TEMPLATE</h2>
                </div>
                <button onClick={() => setShowUpload(false)} className="w-7 h-7 rounded-lg border border-[#1A1E26] flex items-center justify-center text-[#4B5563] hover:text-white hover:border-[rgba(255,0,60,0.3)] transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div className="ck-field-group">
                  <label className="ck-label">Template Name</label>
                  <input className="ck-input ck-field-input text-xs" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. CYBERSEC_2026" />
                </div>
                <div className="ck-field-group">
                  <label className="ck-label">Upload File (PNG, JPG, PDF)</label>
                  <div
                    className="relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all hover:border-[rgba(204,255,0,0.3)]"
                    style={{ borderColor: "#1A1E26", background: "rgba(0,0,0,0.3)" }}
                  >
                    <input type="file" accept=".png,.pdf,.jpg,.jpeg" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setTemplateFile(e.target.files?.[0] || null)} />
                    <Upload className="w-8 h-8 mx-auto mb-2 text-[#4B5563]" />
                    <p className="text-xs font-mono text-[#8892A4]">{templateFile ? templateFile.name : "Click or drag to upload"}</p>
                    <p className="text-[9px] font-mono text-[#4B5563] mt-1">PNG · JPG · PDF — MAX 5MB</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowUpload(false)} className="ck-btn-secondary flex-1 text-xs py-2">CANCEL</button>
                  <button onClick={handleUploadTemplate} disabled={!templateFile} className="ck-btn-primary flex-1 text-xs py-2">UPLOAD</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Generate Certs Modal ── */}
      <AnimatePresence>
        {showGenerate && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-[#0D0F14]"
              style={{ borderColor: "rgba(204,255,0,0.2)" }}
            >
              {/* Header bar */}
              <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #CCFF00, transparent)" }} />
              <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-[#0D0F14] z-10" style={{ borderColor: "#1A1E26" }}>
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" style={{ color: "#CCFF00" }} />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {generating ? "GENERATING..." : "BULK GENERATE CERTIFICATES"}
                  </h2>
                </div>
                <button onClick={() => { setShowGenerate(false); setImportedRecipients([]); setImportSummary(null); setGenerationLogs([]); }}
                  className="w-7 h-7 rounded-lg border border-[#1A1E26] flex items-center justify-center text-[#4B5563] hover:text-white hover:border-[rgba(255,0,60,0.3)] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">
                {generating ? (
                  /* Generation progress console */
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="animate-pulse" style={{ color: "#CCFF00" }}>GENERATING CERTIFICATES...</span>
                        <span className="font-bold text-white">{Math.round(generationProgress)}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden bg-[#080A0F] border border-[#1A1E26]">
                        <motion.div animate={{ width: `${generationProgress}%` }} transition={{ duration: 0.3 }}
                          className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, #CCFF00, #FF4D00)", boxShadow: "0 0 10px rgba(204,255,0,0.4)" }}
                        />
                      </div>
                    </div>

                    {/* Log terminal */}
                    <div className="rounded-xl border bg-[#080A0F] overflow-hidden" style={{ borderColor: "#1A1E26" }}>
                      <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "#1A1E26" }}>
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#CCFF00" }} />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#4B5563]">SYSTEM LOG</span>
                      </div>
                      <div className="p-4 space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                        {generationLogs.map((log, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px] font-mono">
                            <span className="text-[#4B5563] shrink-0">[{new Date().toLocaleTimeString()}]</span>
                            <span style={{ color: log?.includes("ERR") ? "#FF003C" : log?.includes("OK") || log?.includes("COMP") ? "#CCFF00" : "#8892A4" }}>{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-[9px] font-mono text-center text-[#4B5563] animate-pulse">DO NOT CLOSE THIS WINDOW</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {/* Step 1: Event + Template */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border" style={{ color: "#CCFF00", borderColor: "rgba(204,255,0,0.2)" }}>01</span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Configuration</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="ck-field-group">
                          <label className="ck-label">Target Event *</label>
                          <select className="ck-input ck-select ck-field-input text-xs" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
                            <option value="">Select event...</option>
                            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                          </select>
                        </div>
                        <div className="ck-field-group">
                          <label className="ck-label">Template</label>
                          <select className="ck-input ck-select ck-field-input text-xs" value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
                            <option value="">Default template</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t" style={{ borderColor: "#1A1E26" }} />

                    {/* Step 2: Recipients */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border" style={{ color: "#FF4D00", borderColor: "rgba(255,77,0,0.2)" }}>02</span>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Recipients</h3>
                        </div>
                        {/* Tab selector */}
                        <div className="flex gap-0.5 p-0.5 rounded-lg bg-[#080A0F] border border-[#1A1E26]">
                          {[
                            { id: "text" as const, label: "TEXT LIST" },
                            { id: "file" as const, label: "FILE" },
                            { id: "event" as const, label: "REGISTRATIONS" },
                          ].map(tab => (
                            <button key={tab.id} type="button"
                              onClick={() => { setActiveImportTab(tab.id); setImportedRecipients([]); setImportSummary(null); }}
                              disabled={tab.id === "event" && !selectedEvent}
                              className="px-2.5 py-1 rounded-md text-[9px] font-mono uppercase tracking-wide transition-all disabled:opacity-30"
                              style={activeImportTab === tab.id
                                ? { background: "rgba(204,255,0,0.1)", color: "#CCFF00", border: "1px solid rgba(204,255,0,0.2)" }
                                : { color: "#4B5563" }
                              }
                            >{tab.label}</button>
                          ))}
                        </div>
                      </div>

                      {/* Text tab */}
                      {activeImportTab === "text" && (
                        <div className="flex flex-col gap-2">
                          <textarea
                            className="ck-input ck-field-input text-xs"
                            rows={6}
                            value={recipientText}
                            onChange={e => setRecipientText(e.target.value)}
                            placeholder={"John Doe, john@example.com\nJane Smith, jane@example.com\nBob Wilson"}
                          />
                          <p className="text-[9px] font-mono text-[#4B5563]">
                            One per line — <code className="text-[#8892A4]">Name, Email</code> · {recipientText.trim().split("\n").filter(Boolean).length} record(s)
                          </p>
                        </div>
                      )}

                      {/* File tab */}
                      {activeImportTab === "file" && (
                        <div className="flex flex-col gap-3">
                          <div
                            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                            onClick={() => document.getElementById("csv-upload-batch")?.click()}
                            className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed cursor-pointer transition-all"
                            style={{ borderColor: dragOver ? "#CCFF00" : "#1A1E26", background: dragOver ? "rgba(204,255,0,0.03)" : "rgba(0,0,0,0.2)" }}
                          >
                            <FileSpreadsheet className="w-8 h-8 mb-2 text-[#4B5563]" />
                            <p className="text-xs font-mono text-[#8892A4]">{importing ? "Processing..." : "Drop CSV or Excel file"}</p>
                            <p className="text-[9px] font-mono text-[#4B5563] mt-1">CSV · XLSX · XLS</p>
                            <input id="csv-upload-batch" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => e.target.files?.[0] && handleFileImport(e.target.files[0])} />
                          </div>
                          {importSummary && (
                            <div className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "#1A1E26", background: "rgba(0,0,0,0.3)" }}>
                              <div className="flex items-center gap-4 text-[10px] font-mono">
                                <span className="flex items-center gap-1" style={{ color: "#CCFF00" }}><CheckCircle className="w-3.5 h-3.5" /> {importSummary.valid} VALID</span>
                                {importSummary.invalid > 0 && <span className="flex items-center gap-1" style={{ color: "#FF003C" }}><AlertCircle className="w-3.5 h-3.5" /> {importSummary.invalid} INVALID</span>}
                                <span className="text-[#4B5563]">TOTAL: {importSummary.total}</span>
                              </div>
                              {importSummary.valid > 0 && (
                                <button type="button" onClick={() => { setRecipientText(importedRecipients.filter(r => r.valid).map(r => `${r.name}${r.email ? `, ${r.email}` : ""}`).join("\n")); showToast(`${importSummary.valid} records queued`, "success"); }}
                                  className="ck-btn-primary text-[9px] py-1 px-2.5"
                                >USE VALID</button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Event registrations tab */}
                      {activeImportTab === "event" && (
                        <div className="flex flex-col items-center gap-4 py-8 rounded-xl border bg-[#080A0F] text-center" style={{ borderColor: "#1A1E26" }}>
                          <div>
                            <p className="text-sm font-bold text-white">Import from Event Registrations</p>
                            <p className="text-xs font-mono text-[#4B5563] mt-1 max-w-sm">Automatically pull all registered participants from the selected event</p>
                          </div>
                          <button type="button" onClick={handleImportFromRegistrations} disabled={!selectedEvent || importing}
                            className="ck-btn-secondary text-xs py-2 px-5 flex items-center gap-2"
                          >
                            <RefreshCw className={`w-4 h-4 ${importing ? "animate-spin" : ""}`} />
                            {importing ? "FETCHING..." : "IMPORT REGISTRATIONS"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action row */}
                    <div className="flex gap-3 pt-1 border-t" style={{ borderColor: "#1A1E26" }}>
                      <button type="button" onClick={() => { setShowGenerate(false); setImportedRecipients([]); setImportSummary(null); setGenerationLogs([]); }}
                        className="ck-btn-secondary flex-1 text-xs py-2.5"
                      >CANCEL</button>
                      <button type="button" onClick={handleBulkGenerate}
                        disabled={generating || !selectedEvent || !recipientText.trim()}
                        className="ck-btn-primary flex-1 text-xs py-2.5"
                      >GENERATE CERTIFICATES</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl"
            style={toast.type === "success"
              ? { background: "rgba(204,255,0,0.08)", borderColor: "rgba(204,255,0,0.3)", color: "#CCFF00" }
              : toast.type === "error"
              ? { background: "rgba(255,0,60,0.08)", borderColor: "rgba(255,0,60,0.3)", color: "#FF003C" }
              : { background: "rgba(255,77,0,0.08)", borderColor: "rgba(255,77,0,0.3)", color: "#FF4D00" }
            }
          >
            {toast.type === "success" && <CheckCircle className="w-4 h-4 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="text-sm font-mono font-semibold">{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} className="ml-1 opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


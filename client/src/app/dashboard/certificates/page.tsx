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
          setGenerationLogs((prevLogs) => [...prevLogs, logSteps[logIdx]]);
          logIdx++;
        } else if (Math.random() > 0.7) {
          // Add dynamic recipient logging
          const randomRec = recipients[Math.floor(Math.random() * recipients.length)];
          if (randomRec) {
            setGenerationLogs((prevLogs) => [
              ...prevLogs,
              `[GEN_PROC] PROCESSING CREDENTIAL FOR: ${randomRec.name.toUpperCase()}`
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
    <div className="space-y-6">
      {/* High-Tech Dashboard Header */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/10 bg-gradient-to-r from-red-950/20 via-black to-zinc-950/40 p-6 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-40 animate-pulse" />
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-red-500/5 blur-3xl" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="w-2 h-2 rounded-full bg-red-500 absolute" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-500 font-bold bg-red-950/40 px-2 py-0.5 rounded border border-red-900/30">
                VAULT SECURE SYNCED
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tighter uppercase text-white group flex items-center gap-1">
              <span className="glitch-text cursor-default" data-text="CREDENTIAL_GEN">CREDENTIAL_GEN</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-mono" style={{ color: "var(--ck-text-secondary)" }}>
              SECURE_TEMPLATE_VAULT // BULK_ISSUANCE_UNIT // CLASSIFIED_CORE
            </p>
          </div>

          {/* Diagnostic Widget */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-2.5 rounded-xl border border-zinc-800 bg-black/60 font-mono text-[10px]">
            <div className="flex flex-col">
              <span className="text-zinc-500 uppercase tracking-widest">SYSTEM_TIME</span>
              <span className="text-red-400 font-bold">{systemTime || "LOADING SYSTEM TIME..."}</span>
            </div>
            <div className="w-[1px] h-8 bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-zinc-500 uppercase tracking-widest">TEMPLATES_LOADED</span>
              <span className="text-white font-bold">{templates.length} UNITS</span>
            </div>
            <div className="w-[1px] h-8 bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-zinc-500 uppercase tracking-widest">ACTIVE_VAULT</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Activity className="w-3 h-3 animate-pulse" /> RUNNING
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link href="/dashboard/certificates/builder" className="ck-btn-secondary flex items-center gap-2 text-xs py-2.5 px-4 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0">
              <Palette className="w-4 h-4 text-red-500" /> DESIGN_TEMPLATE
            </Link>
            <button onClick={() => setShowUpload(true)} className="ck-btn-secondary flex items-center gap-2 text-xs py-2.5 px-4 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0">
              <Upload className="w-4 h-4 text-red-500" /> LOAD_TEMPLATE
            </button>
            <button onClick={() => setShowGenerate(true)} className="ck-btn-primary flex items-center gap-2 text-xs py-2.5 px-4 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0">
              <Plus className="w-4 h-4" /> EXEC_GENERATE
            </button>
          </div>
        </div>
      </div>

      {/* Templates Vault Gallery */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-red-500" />
            <h3 className="font-mono text-sm uppercase tracking-widest text-white font-bold">TEMPLATES_VAULT ({templates.length})</h3>
          </div>
        </div>
        
        {templates.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-red-955 bg-black/40 p-10 text-center transition-all hover:bg-black/60 group">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500/40" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-500/40" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-500/40" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-500/40" />
            
            <div className="relative z-10 max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-900/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Upload className="w-6 h-6 text-red-400 animate-pulse" />
              </div>
              <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white mb-1">No Design Templates Found</h4>
              <p className="text-xs text-zinc-400 mb-6 font-mono leading-relaxed">
                Design custom credentials in the dashboard workspace, or upload a template file to start batch processing.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <Link href="/dashboard/certificates/builder" className="ck-btn-secondary text-[10px] px-3.5 py-2 font-mono flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> OPEN_DESIGNER
                </Link>
                <button onClick={() => setShowUpload(true)} className="ck-btn-primary text-[10px] px-3.5 py-2 font-mono flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> LOAD_IMAGE_OR_PDF
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {templates.map((t, i) => (
              <motion.div 
                key={t.id} 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(`/dashboard/certificates/builder?templateId=${t.id}`)}
                className="ck-card p-3.5 group hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)] transition-all cursor-pointer relative overflow-hidden bg-gradient-to-b from-zinc-950 to-black"
              >
                {/* Cyber Corner Design Decors */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500/20 group-hover:border-red-500/60" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500/20 group-hover:border-red-500/60" />
                
                <button 
                  onClick={(e) => handleDeleteTemplate(t.id, e)} 
                  className="absolute top-3 right-3 p-2 rounded-lg bg-black/90 text-red-500 hover:text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 border border-zinc-800"
                  title="Delete Template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="h-28 rounded-lg bg-black flex items-center justify-center mb-3.5 overflow-hidden border border-zinc-900 group-hover:border-red-500/30 transition-all relative">
                  {t.fileType === "png" || t.fileType === "jpg" ? (
                    <img src={`${SERVER_BASE_URL}${t.fileUrl}`} alt={t.name} className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <FileCheck className="w-8 h-8 text-red-900 group-hover:text-red-500 transition-colors" />
                      <span className="text-[9px] font-mono text-zinc-500 tracking-wider">PDF FORMAT</span>
                    </div>
                  )}
                  {/* Hover visual label overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 font-mono text-[10px] tracking-wider text-red-400 font-bold gap-1 uppercase border border-red-500/30 rounded-lg">
                    <Palette className="w-3.5 h-3.5" /> EDIT_SCHEMATIC
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-mono font-bold text-white truncate max-w-[150px]">{t.name}</p>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-red-900/40 bg-red-950/30 text-red-400 uppercase font-bold shrink-0">{t.fileType}</span>
                  </div>
                  <p className="text-[9px] font-mono flex items-center gap-1" style={{ color: "var(--ck-text-muted)" }}>
                    <Users className="w-3 h-3 text-red-900" /> CREATED BY {t.createdBy?.name?.toUpperCase() || "SYSTEM"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Load Template Modal */}
      <AnimatePresence>
        {showUpload && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="ck-card p-6 w-full max-w-[95vw] sm:max-w-md relative overflow-hidden border-zinc-800 bg-zinc-950/90 backdrop-blur-xl">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80" />
              
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-red-500" />
                  <h2 className="text-lg font-bold font-mono tracking-tight text-white uppercase">LOAD_TEMPLATE_MODULE</h2>
                </div>
                <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="ck-label font-mono">Template Descriptor Name</label>
                  <input className="ck-input text-xs font-mono" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. CYBER_WORKSHOP_2026" />
                </div>
                
                <div>
                  <label className="ck-label font-mono">Source File Upload</label>
                  <div className="relative border border-dashed border-zinc-800 hover:border-red-500/40 rounded-lg p-5 text-center bg-black/40 cursor-pointer transition-colors group">
                    <input 
                      type="file" 
                      accept=".png,.pdf,.jpg,.jpeg" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => setTemplateFile(e.target.files?.[0] || null)} 
                    />
                    <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-500 group-hover:text-red-500 transition-colors" />
                    <p className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition-colors truncate">
                      {templateFile ? templateFile.name.toUpperCase() : "DRAG FILE OR CLICK TO BROWSE"}
                    </p>
                    <p className="text-[8px] font-mono text-zinc-600 mt-1">SUPPORTS: PNG, JPG, PDF (MAX 5MB)</p>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button onClick={() => setShowUpload(false)} className="ck-btn-secondary flex-1 text-xs">CANCEL</button>
                  <button onClick={handleUploadTemplate} disabled={!templateFile} className="ck-btn-primary flex-1 text-xs">PROVISION_UPLOAD</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generate / Execution Modal */}
      <AnimatePresence>
        {showGenerate && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="ck-card p-6 w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto relative overflow-hidden border-zinc-800 bg-zinc-950/95 backdrop-blur-xl">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80" />
              
              <div className="flex justify-between items-center mb-5 border-b border-zinc-900 pb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-red-500 animate-pulse" />
                  <h2 className="text-lg font-bold font-mono tracking-tight text-white uppercase">BATCH_EXEC_UNIT (CREDENTIALS)</h2>
                </div>
                <button onClick={() => { setShowGenerate(false); setImportedRecipients([]); setImportSummary(null); setGenerationLogs([]); }}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {generating ? (
                /* Hacker Generator Diagnostic Console */
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono mb-1.5 uppercase">
                      <span className="text-red-500 font-bold animate-pulse">GENERATION_ENGINE_RUNNING...</span>
                      <span className="font-bold text-white">{Math.round(generationProgress)}%</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden bg-black/80 border border-zinc-800/80">
                      <motion.div
                        animate={{ width: `${generationProgress}%` }}
                        className="h-full bg-gradient-to-r from-red-800 via-red-500 to-amber-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-black/90 p-4 font-mono text-[10px] text-zinc-400 space-y-1 max-h-60 overflow-y-auto scrollbar-thin shadow-inner h-56 flex flex-col justify-end">
                    <div className="flex-1 overflow-y-auto space-y-1.5 pt-2">
                      {generationLogs.map((log, index) => (
                        <div key={index} className="flex items-start gap-2 animate-fade-in">
                          <span className="text-zinc-600">[{new Date().toLocaleTimeString()}]</span>
                          <span className={`${log.includes('ERR') ? 'text-red-500' : log.includes('OK') || log.includes('COMP') ? 'text-emerald-400 font-bold' : 'text-zinc-300'}`}>
                            {log}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-[9px] font-mono text-zinc-500 text-center tracking-wider animate-pulse">
                    DO NOT REFRESH OR CLOSE THIS SESSION MODULE
                  </p>
                </div>
              ) : (
                /* Standard Settings Configuration Form */
                <div className="space-y-5">
                  
                  {/* Step 1: Destination event context config */}
                  <div className="space-y-3">
                    <h3 className="font-mono text-xs text-red-400 font-bold uppercase tracking-wider">01. Destination Configuration</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="ck-label font-mono">Target Event Registry *</label>
                        <select className="ck-input text-xs font-mono" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                          <option value="">Select target event...</option>
                          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="ck-label font-mono">Vault Layout Template *</label>
                        <select className="ck-input text-xs font-mono" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                          <option value="">Default template</option>
                          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Data source selector and importer tabs */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-mono text-xs text-red-400 font-bold uppercase tracking-wider">02. Recipient Data Registry</h3>
                      
                      {/* Interactive Tab Selector Buttons */}
                      <div className="flex rounded-lg border border-zinc-800 bg-black/60 p-0.5 font-mono text-[9px]">
                        <button 
                          type="button"
                          onClick={() => { setActiveImportTab("text"); setImportedRecipients([]); setImportSummary(null); }} 
                          className={`px-3 py-1 rounded-md transition-colors uppercase ${activeImportTab === "text" ? "bg-red-950/60 text-red-400 font-bold" : "text-zinc-500 hover:text-white"}`}
                        >
                          TEXT_LIST
                        </button>
                        <button 
                          type="button"
                          onClick={() => { setActiveImportTab("file"); setImportedRecipients([]); setImportSummary(null); }} 
                          className={`px-3 py-1 rounded-md transition-colors uppercase ${activeImportTab === "file" ? "bg-red-950/60 text-red-400 font-bold" : "text-zinc-500 hover:text-white"}`}
                        >
                          FILE_SHEET
                        </button>
                        <button 
                          type="button"
                          onClick={() => { setActiveImportTab("event"); setImportedRecipients([]); setImportSummary(null); }}
                          disabled={!selectedEvent}
                          className={`px-3 py-1 rounded-md transition-colors uppercase disabled:opacity-30 disabled:cursor-not-allowed ${activeImportTab === "event" ? "bg-red-950/60 text-red-400 font-bold" : "text-zinc-500 hover:text-white"}`}
                        >
                          REGISTRATIONS
                        </button>
                      </div>
                    </div>

                    {/* Content tab panel: Textarea paste list */}
                    {activeImportTab === "text" && (
                      <div className="space-y-2.5">
                        <textarea 
                          className="ck-input font-mono text-xs" 
                          rows={6} 
                          value={recipientText}
                          onChange={(e) => setRecipientText(e.target.value)}
                          placeholder={"John Doe, john@example.com\nJane Smith, jane@example.com\nBob Wilson"} 
                        />
                        <p className="text-[10px] font-mono text-zinc-500">
                          Format: One record per line, e.g. <code className="text-zinc-300">Name, Email</code>. ({recipientText.trim().split("\n").filter(Boolean).length} record(s) queued)
                        </p>
                      </div>
                    )}

                    {/* Content tab panel: CSV / Excel Upload Dropzone */}
                    {activeImportTab === "file" && (
                      <div className="space-y-3">
                        <div
                          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${dragOver ? "border-red-500 bg-red-900/10" : "border-zinc-800 bg-black/40 hover:bg-black/60"}`}
                          onClick={() => document.getElementById("csv-upload-batch")?.click()}>
                          <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-zinc-500 group-hover:text-red-500 transition-colors" />
                          <p className="text-xs font-mono font-bold text-white mb-1">
                            {importing ? "COMPILING SHEET CONTEXT..." : "DROP EXCEL OR CSV SOURCE FILE"}
                          </p>
                          <p className="text-[9px] font-mono text-zinc-500">
                            CSV, XLSX OR XLS CHIP FILES ONLY
                          </p>
                          <input id="csv-upload-batch" type="file" accept=".csv,.xlsx,.xls" className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0])} />
                        </div>

                        {importSummary && (
                          <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-900 bg-black/40 font-mono text-[10px]">
                            <div className="flex items-center gap-4">
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> {importSummary.valid} VALID
                              </span>
                              {importSummary.invalid > 0 && (
                                <span className="text-red-500 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> {importSummary.invalid} INVALID
                                </span>
                              )}
                              <span className="text-zinc-500">TOTAL: {importSummary.total} RECORDS</span>
                            </div>
                            {importSummary.valid > 0 && (
                              <button 
                                type="button"
                                onClick={() => {
                                  setRecipientText(importedRecipients.filter((r) => r.valid).map((r) => `${r.name}${r.email ? `, ${r.email}` : ""}`).join("\n"));
                                  showToast(`Successfully queued ${importSummary.valid} records!`, "success");
                                }}
                                className="ck-btn-primary py-1 px-2.5 text-[9px]"
                              >
                                CONFIRM_AND_SYNC
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content tab panel: Fetch Event Registrations */}
                    {activeImportTab === "event" && (
                      <div className="p-5 border border-zinc-900 rounded-xl bg-black/40 text-center space-y-4">
                        <div className="max-w-xs mx-auto space-y-1">
                          <p className="text-xs font-mono text-zinc-300 font-bold uppercase">Poll Event Database Records</p>
                          <p className="text-[10px] font-mono text-zinc-500 leading-normal">
                            Pull student or delegate registry data directly from approvals cache for automatic synchrony.
                          </p>
                        </div>
                        <button 
                          type="button"
                          onClick={handleImportFromRegistrations} 
                          disabled={!selectedEvent || importing} 
                          className="ck-btn-secondary text-xs py-2 px-4 font-mono w-full max-w-xs mx-auto flex items-center justify-center gap-2"
                        >
                          <RefreshCw className={`w-4 h-4 text-red-500 ${importing ? "animate-spin" : ""}`} /> 
                          {importing ? "FETCHING_DATABASE_ENTRIES..." : "FETCH_EVENT_REGS"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Operational Footer Actions */}
                  <div className="flex gap-3 pt-3 border-t border-zinc-900">
                    <button 
                      type="button"
                      onClick={() => { setShowGenerate(false); setImportedRecipients([]); setImportSummary(null); setGenerationLogs([]); }}
                      className="ck-btn-secondary flex-1 text-xs"
                    >
                      CANCEL
                    </button>
                    <button 
                      type="button"
                      onClick={handleBulkGenerate}
                      disabled={generating || !selectedEvent || !recipientText.trim()}
                      className="ck-btn-primary flex-1 text-xs"
                    >
                      EXECUTE_ISSUANCE_MATRIX
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Certificate Management Terminal */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-500" />
            <h3 className="font-mono text-sm uppercase tracking-widest text-white font-bold">ISSUANCE_RECORDS</h3>
          </div>
          {certs.length > 0 && (
            <button onClick={handleDownloadZip} className="ck-btn-secondary text-xs py-2 px-3 font-mono">
              <Archive className="w-4 h-4" /> DL_ZIP_VAULT
            </button>
          )}
        </div>

        {/* Filter Widget Control Panel */}
        <div className="relative overflow-hidden p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/20 backdrop-blur-md">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-72">
              <label className="ck-label font-mono text-[9px]">Linked Event Context</label>
              <select className="ck-input w-full text-xs font-mono" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                <option value="">Select event directory...</option>
                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>
            
            {selectedEvent && certs.length > 0 ? (
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto md:flex-1 justify-end items-end">
                <div className="relative w-full md:max-w-md">
                  <label className="ck-label font-mono text-[9px]">Diagnostic Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      className="ck-input pl-9 w-full bg-black/60 border-zinc-800 text-xs py-2 font-mono" 
                      placeholder="Enter name, email, or cert ID..." 
                      value={certSearchQuery}
                      onChange={(e) => setCertSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-full md:w-44">
                  <label className="ck-label font-mono text-[9px]">Sort Order</label>
                  <select 
                    className="ck-input bg-black/60 border-zinc-800 text-xs py-2 w-full font-mono"
                    value={certSortBy}
                    onChange={(e) => setCertSortBy(e.target.value as any)}
                  >
                    <option value="date">NEWEST RECORD</option>
                    <option value="name">ALPHABETICAL (A-Z)</option>
                  </select>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Dynamic Empty States & Workflow Wizard */}
        {!selectedEvent ? (
          /* Issuance Workflow Guide */
          <div className="p-6 rounded-2xl border border-red-500/5 bg-gradient-to-b from-zinc-950 to-black text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-955/5 blur-3xl rounded-full" />
            
            <div className="max-w-xl mx-auto space-y-2">
              <h4 className="text-md font-mono font-bold uppercase tracking-wider text-white">SYSTEM READY FOR DEPLOYMENT</h4>
              <p className="text-xs text-zinc-400 font-mono">
                Initialize the credential issuance sequence by selecting a target event database container.
              </p>
            </div>

            {/* Step flow grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 text-left">
              {/* Step 1 */}
              <div 
                onClick={() => {
                  const select = document.querySelector('select');
                  if (select) {
                    select.focus();
                    (select as any).style.borderColor = 'var(--ck-accent)';
                  }
                }}
                className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 hover:border-red-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-950/30 border border-red-900/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <Calendar className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-[10px] font-mono text-red-500 font-bold bg-red-950/20 px-2 py-0.5 rounded border border-red-900/20">STEP 01</span>
                </div>
                <h5 className="text-xs font-mono font-bold text-white uppercase mb-1.5 group-hover:text-red-400 transition-colors">LINK_EVENT_CONTEXT</h5>
                <p className="text-[10px] text-zinc-500 leading-normal font-mono">
                  Select a directory container representing your event registrations base.
                </p>
              </div>

              {/* Step 2 */}
              <div 
                onClick={() => router.push('/dashboard/certificates/builder')}
                className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 hover:border-red-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-950/30 border border-red-900/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <Palette className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">STEP 02</span>
                </div>
                <h5 className="text-xs font-mono font-bold text-white uppercase mb-1.5 group-hover:text-red-400 transition-colors">PROVISION_TEMPLATES</h5>
                <p className="text-[10px] text-zinc-500 leading-normal font-mono">
                  Configure schematic templates inside the editor workspace.
                </p>
              </div>

              {/* Step 3 */}
              <button 
                type="button"
                onClick={() => setShowGenerate(true)}
                className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 hover:border-red-500/40 transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-950/30 border border-red-900/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <Plus className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">STEP 03</span>
                </div>
                <h5 className="text-xs font-mono font-bold text-white uppercase mb-1.5 group-hover:text-red-400 transition-colors">BATCH_EXECUTION</h5>
                <p className="text-[10px] text-zinc-500 leading-normal font-mono">
                  Trigger compiler engine via CSV data parsing or direct registration polling.
                </p>
              </button>
            </div>
          </div>
        ) : selectedEvent && certs.length === 0 ? (
          /* Empty Record Holder for Selected Event */
          <div className="p-8 text-center rounded-2xl border border-zinc-900 bg-black/40">
            <FileText className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
            <h4 className="text-sm font-mono font-bold uppercase tracking-wider text-white mb-1">No Generated Certificates Available</h4>
            <p className="text-xs text-zinc-400 mb-6 font-mono max-w-sm mx-auto">
              No digital certificates have been generated for this event segment yet. Launch the compiler engine to distribute credentials.
            </p>
            <button 
              type="button"
              onClick={() => setShowGenerate(true)} 
              className="ck-btn-primary text-xs py-2 px-4 rounded-xl font-mono flex items-center gap-1.5 mx-auto"
            >
              <Plus className="w-4 h-4" /> BATCH_EXECUTE_UNIT
            </button>
          </div>
        ) : null}
      </div>

      {selectedEvent && certs.length > 0 && (
        <div className="ck-card border-zinc-800/80 bg-zinc-950/20 backdrop-blur-md overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-900/30 to-transparent" />
          
          <div className="overflow-x-auto w-full">
            <table className="ck-table ck-table-responsive whitespace-nowrap font-mono text-xs">
            <thead>
              <tr>
                <th className="font-mono tracking-widest text-[10px]">RECIPIENT_NAME</th>
                <th className="font-mono tracking-widest text-[10px]">EMAIL_ADDRESS</th>
                <th className="font-mono tracking-widest text-[10px]">UNIQUE_HASH</th>
                <th className="font-mono tracking-widest text-[10px]">VAULT_STATUS</th>
                <th className="font-mono tracking-widest text-[10px]">ISSUANCE_DATE</th>
                <th className="font-mono tracking-widest text-[10px] text-right">OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {certs
                .filter(c => 
                  c.recipientName.toLowerCase().includes(certSearchQuery.toLowerCase()) || 
                  (c.recipientEmail && c.recipientEmail.toLowerCase().includes(certSearchQuery.toLowerCase())) ||
                  c.uniqueCode.toLowerCase().includes(certSearchQuery.toLowerCase())
                )
                .sort((a, b) => {
                  if (certSortBy === "name") return a.recipientName.localeCompare(b.recipientName);
                  if (certSortBy === "date") {
                    return new Date(b.generatedAt || b.createdAt || 0).getTime() - new Date(a.generatedAt || a.createdAt || 0).getTime();
                  }
                  return 0;
                })
                .map((c) => (
                <tr key={c.id} className="group hover:bg-red-500/[0.03] transition-colors border-b border-zinc-900/60">
                  <td className="text-sm font-bold text-white py-4.5" data-label="Recipient">{c.recipientName}</td>
                  <td className="text-[10px] text-zinc-400" data-label="Email">{c.recipientEmail?.toLowerCase() || "—"}</td>
                  <td data-label="Certificate ID">
                    <code className="text-[10px] px-2 py-0.5 rounded border border-red-900/20 bg-red-950/10 text-red-400/90 font-mono tracking-tight select-all">
                      {c.uniqueCode}
                    </code>
                  </td>
                  <td data-label="Status">
                    <span className={`ck-badge ${c.status === "GENERATED" ? "ck-badge-success" : "ck-badge-warning"} text-[9px] px-2 py-0.5 rounded-md`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="text-[10px] text-zinc-400" data-label="Generated">
                    {c.generatedAt ? new Date(c.generatedAt).toLocaleString().toUpperCase() : "—"}
                  </td>
                  <td data-label="Actions" className="text-right">
                    <div className="flex items-center justify-end gap-3.5">
                      {c.fileUrl && (
                        <>
                          <a href={`${SERVER_BASE_URL}${c.fileUrl}`} target="_blank" rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 hover:underline text-[10px] flex items-center gap-1 font-bold uppercase tracking-wider">
                            <Eye className="w-3.5 h-3.5 text-indigo-400" /> VIEW
                          </a>
                          <a href={`${SERVER_BASE_URL}${c.fileUrl}`} download target="_blank" rel="noopener noreferrer"
                            className="text-red-400 hover:text-red-300 hover:underline text-[10px] flex items-center gap-1 font-bold uppercase tracking-wider">
                            <Download className="w-3.5 h-3.5 text-red-400" /> DL_PDF
                          </a>
                        </>
                      )}
                      <a href={`/verify/${c.uniqueCode}`} target="_blank"
                          className="text-zinc-400 hover:text-white hover:underline text-[10px] flex items-center gap-1 font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" /> VERIFY
                      </a>
                      <button 
                        type="button"
                        onClick={() => handleDeleteCert(c.id)}
                        className="text-red-600 hover:text-red-400 hover:underline text-[10px] flex items-center gap-1 font-bold uppercase tracking-wider transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
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
            <button type="button" onClick={() => setToast(null)} className="ml-2 hover:opacity-80 p-0.5 rounded bg-black/30">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

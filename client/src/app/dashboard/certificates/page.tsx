"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, apiUpload, SERVER_BASE_URL, API_BASE } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FileCheck, Upload, Plus, Search, Download, ShieldCheck, X, FileSpreadsheet,
  Users, AlertCircle, CheckCircle, Archive, Trash2, Eye, Palette
} from "lucide-react";

interface Template { id: string; name: string; fileUrl: string; fileType: string; createdBy?: { name: string }; createdAt: string; }
interface Certificate { id: string; uniqueCode: string; recipientName: string; recipientEmail?: string; status: string; generatedAt?: string; createdAt?: string; fileUrl?: string; }
interface ImportedRecipient { row?: number; name: string; email?: string; valid: boolean; errors: string[]; }

export default function CertificatesPage() {
  const { token } = useAuth();
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
    } catch (err) { alert(err instanceof Error ? err.message : "Upload failed"); }
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
    } catch (err) { alert(err instanceof Error ? err.message : "Import failed"); }
    finally { setImporting(false); }
  };

  // Import from event registrations
  const handleImportFromRegistrations = async () => {
    if (!selectedEvent) { alert("Select an event first"); return; }
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
    } catch (err) { alert(err instanceof Error ? err.message : "Import failed"); }
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
    setGenerating(true); setGenerationProgress(0);
    try {
      const lines = recipientText.trim().split("\n").filter(Boolean);
      const recipients = lines.map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return { name: parts[0], email: parts[1] || undefined };
      });

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => Math.min(prev + Math.random() * 15, 90));
      }, 300);

      const data = await api<{ count: number }>("/certificates/bulk", {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ eventId: selectedEvent, templateId: selectedTemplate || undefined, recipients }),
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      setTimeout(() => {
        alert(`Successfully generated ${data.count} certificates!`);
        setShowGenerate(false); setRecipientText(""); setGenerationProgress(0);
        setImportedRecipients([]); setImportSummary(null);
        loadCerts(selectedEvent);
      }, 500);
    } catch (err) { alert(err instanceof Error ? err.message : "Generation failed"); }
    finally { setGenerating(false); }
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
      alert("Template deleted successfully!");
      const t = await api<{ templates: Template[] }>("/certificates/templates", { token: token || undefined });
      setTemplates(t.templates);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleDeleteCert = async (certId: string) => {
    if (!confirm("Are you sure you want to delete this certificate? This will remove it permanently.")) return;
    try {
      await api(`/certificates/${certId}`, { method: "DELETE", token: token || undefined });
      alert("Certificate deleted successfully!");
      if (selectedEvent) loadCerts(selectedEvent);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tighter uppercase" style={{ color: "var(--ck-text)" }}>CREDENTIAL_GEN</h1>
          <p className="mt-1" style={{ color: "var(--ck-text-secondary)" }}>SECURE_TEMPLATE_VAULT // BULK_ISSUANCE_UNIT</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/certificates/builder" className="ck-btn-secondary flex items-center gap-1.5">
            <Palette className="w-4 h-4" /> DESIGN_TEMPLATE
          </Link>
          <button onClick={() => setShowUpload(true)} className="ck-btn-secondary flex items-center gap-1.5"><Upload className="w-4 h-4" /> LOAD_TEMPLATE</button>
          <button onClick={() => setShowGenerate(true)} className="ck-btn-primary flex items-center gap-1.5"><Plus className="w-4 h-4" /> EXEC_GENERATE</button>
        </div>
      </div>

      {/* Templates Gallery */}
      <h3 className="font-semibold mb-3" style={{ color: "var(--ck-text)" }}>Templates ({templates.length})</h3>
      {templates.length === 0 ? (
        <div className="ck-card p-8 text-center mb-8">
          <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--ck-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--ck-text-secondary)" }}>No templates yet. Upload one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {templates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="ck-card p-4 group hover:ring-2 hover:ring-red-500/30 transition-all cursor-pointer relative">
              <button 
                onClick={(e) => handleDeleteTemplate(t.id, e)} 
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/85 text-red-500 hover:text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-zinc-800"
                title="Delete Template"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="h-24 rounded-lg bg-black flex items-center justify-center mb-3 overflow-hidden border border-red-900/20 group-hover:border-red-500/40 transition-colors">
                {t.fileType === "png" || t.fileType === "jpg" ? (
                  <img src={`${SERVER_BASE_URL}${t.fileUrl}`} alt={t.name} className="w-full h-full object-cover rounded-lg opacity-60 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <FileCheck className="w-8 h-8 text-red-900 group-hover:text-red-500 transition-colors" />
                )}
              </div>
              <p className="text-sm font-medium truncate" style={{ color: "var(--ck-text)" }}>{t.name}</p>
              <p className="text-xs" style={{ color: "var(--ck-text-muted)" }}>{t.fileType.toUpperCase()} · by {t.createdBy?.name}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Template Modal */}
      <AnimatePresence>
        {showUpload && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="ck-card p-6 w-full max-w-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-mono tracking-tighter uppercase" style={{ color: "var(--ck-text)" }}>LOAD_TEMPLATE</h2>
                <button onClick={() => setShowUpload(false)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="ck-label">Template Name</label><input className="ck-input" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Workshop Certificate" /></div>
                <div><label className="ck-label">File (PNG, JPG, or PDF)</label><input type="file" accept=".png,.pdf,.jpg,.jpeg" className="ck-input" onChange={(e) => setTemplateFile(e.target.files?.[0] || null)} /></div>
                <div className="flex gap-2">
                  <button onClick={() => setShowUpload(false)} className="ck-btn-secondary flex-1">Cancel</button>
                  <button onClick={handleUploadTemplate} disabled={!templateFile} className="ck-btn-primary flex-1">Upload</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generate Modal */}
      <AnimatePresence>
        {showGenerate && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="ck-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-mono tracking-tighter uppercase" style={{ color: "var(--ck-text)" }}>BATCH_EXEC_UNIT</h2>
                <button onClick={() => { setShowGenerate(false); setImportedRecipients([]); setImportSummary(null); }}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                {/* Event selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="ck-label">Event *</label>
                    <select className="ck-input" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                      <option value="">Select event...</option>
                      {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                  </div>
                  <div><label className="ck-label">Template (optional)</label>
                    <select className="ck-input" value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                      <option value="">Default template</option>
                      {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Import options */}
                <div className="flex gap-2">
                  <button onClick={() => setShowImport(true)} className="ck-btn-secondary text-[10px] flex-1 font-mono">
                    <FileSpreadsheet className="w-4 h-4" /> UPL_DATA_SHEET
                  </button>
                  <button onClick={handleImportFromRegistrations} disabled={!selectedEvent || importing} className="ck-btn-secondary text-[10px] flex-1 font-mono">
                    <Users className="w-4 h-4" /> {importing ? "POLLING..." : "FETCH_REGS"}
                  </button>
                </div>

                {/* Import summary */}
                {importSummary && (
                  <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "var(--ck-bg)" }}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-medium" style={{ color: "var(--ck-text)" }}>{importSummary.valid} valid</span>
                    </div>
                    {importSummary.invalid > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-medium text-red-400">{importSummary.invalid} errors</span>
                      </div>
                    )}
                    <span className="text-xs" style={{ color: "var(--ck-text-muted)" }}>{importSummary.total} total</span>
                  </div>
                )}

                {/* Recipients textarea */}
                <div>
                  <label className="ck-label">Recipients (one per line: Name, Email)</label>
                  <textarea className="ck-input font-mono text-xs" rows={8} value={recipientText}
                    onChange={(e) => setRecipientText(e.target.value)}
                    placeholder={"John Doe, john@example.com\nJane Smith, jane@example.com\nBob Wilson"} />
                  <p className="text-xs mt-1" style={{ color: "var(--ck-text-muted)" }}>
                    {recipientText.trim().split("\n").filter(Boolean).length} recipients
                  </p>
                </div>

                {/* Generation progress */}
                {generating && (
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1.5 uppercase">
                      <span style={{ color: "var(--ck-text-muted)" }}>GEN_IN_PROGRESS...</span>
                      <span className="font-medium" style={{ color: "var(--ck-text)" }}>{Math.round(generationProgress)}%</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden bg-black/50 border border-red-900/30">
                      <motion.div
                        animate={{ width: `${generationProgress}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-red-900 to-red-500 shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { setShowGenerate(false); setImportedRecipients([]); setImportSummary(null); }}
                    className="ck-btn-secondary flex-1">Cancel</button>
                  <button onClick={handleBulkGenerate}
                    disabled={generating || !selectedEvent || !recipientText.trim()}
                    className="ck-btn-primary flex-1">
                    {generating ? "Generating..." : "Generate All"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV/Excel Import Modal */}
      <AnimatePresence>
        {showImport && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="ck-card p-6 w-full max-w-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-mono tracking-tighter uppercase" style={{ color: "var(--ck-text)" }}>IMPORT_DATA</h2>
                <button onClick={() => setShowImport(false)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"><X className="w-5 h-5" /></button>
              </div>
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragOver ? "border-red-500 bg-red-900/10" : "bg-black/20"}`}
                style={{ borderColor: dragOver ? undefined : "var(--ck-border)" }}
                onClick={() => document.getElementById("csv-upload")?.click()}>
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3" style={{ color: dragOver ? "#dc2626" : "var(--ck-text-muted)" }} />
                <p className="text-sm font-medium mb-1 font-mono" style={{ color: "var(--ck-text)" }}>
                  {importing ? "PROCESSING_BUFFER..." : "DROP_DATA_FILE_HERE"}
                </p>
                <p className="text-[10px] font-mono" style={{ color: "var(--ck-text-muted)" }}>
                  SUPPORTS: CSV, XLSX, XLS
                </p>
                <input id="csv-upload" type="file" accept=".csv,.xlsx,.xls" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileImport(e.target.files[0])} />
              </div>

              {/* Preview imported data */}
              {importedRecipients.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium" style={{ color: "var(--ck-text)" }}>Preview ({importSummary?.total} rows)</p>
                    <button onClick={() => {
                      setRecipientText(importedRecipients.filter((r) => r.valid).map((r) => `${r.name}${r.email ? `, ${r.email}` : ""}`).join("\n"));
                      setShowImport(false);
                    }} className="ck-btn-primary text-xs">
                      Use {importSummary?.valid} Valid Rows
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--ck-border)]">
                    <table className="w-full text-xs">
                      <thead><tr style={{ background: "var(--ck-bg-secondary)" }}>
                        <th className="text-left p-2">#</th><th className="text-left p-2">Name</th><th className="text-left p-2">Email</th><th className="text-left p-2">Status</th>
                      </tr></thead>
                      <tbody>
                        {importedRecipients.slice(0, 50).map((r, i) => (
                          <tr key={i} className={r.valid ? "" : "bg-red-500/5"}>
                            <td className="p-2" style={{ color: "var(--ck-text-muted)" }}>{r.row || i + 1}</td>
                            <td className="p-2" style={{ color: "var(--ck-text)" }}>{r.name || "—"}</td>
                            <td className="p-2" style={{ color: "var(--ck-text-muted)" }}>{r.email || "—"}</td>
                            <td className="p-2">
                              {r.valid ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : (
                                <span className="text-red-400 text-[10px]">{r.errors.join(", ")}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Certificate List */}
      <div className="flex items-center justify-between mb-3 mt-8">
        <h3 className="font-semibold" style={{ color: "var(--ck-text)" }}>Generated Certificates</h3>
        {certs.length > 0 && (
          <button onClick={handleDownloadZip} className="ck-btn-secondary text-xs">
            <Archive className="w-4 h-4" /> Download ZIP
          </button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4 bg-black/20 p-3 rounded-xl border border-[var(--ck-border)] items-center">
        <div className="w-full sm:w-auto">
          <select className="ck-input w-full" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
            <option value="">Select event to load certificates...</option>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
          </select>
        </div>
        
        {certs.length > 0 && (
          <>
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                className="ck-input pl-9 w-full bg-zinc-900 border-zinc-800 text-sm py-2" 
                placeholder="Search by name, email, or ID..." 
                value={certSearchQuery}
                onChange={(e) => setCertSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="ck-input bg-zinc-900 border-zinc-800 text-sm py-2 w-full sm:w-auto"
              value={certSortBy}
              onChange={(e) => setCertSortBy(e.target.value as any)}
            >
              <option value="date">Newest First</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </>
        )}
      </div>

      {certs.length > 0 && (
        <div className="ck-card overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="ck-table whitespace-nowrap">
            <thead><tr><th>Recipient</th><th>Email</th><th>Certificate ID</th><th>Status</th><th>Generated</th><th>Actions</th></tr></thead>
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
                <tr key={c.id} className="group hover:bg-red-500/[0.02]">
                  <td className="text-sm font-medium text-white">{c.recipientName}</td>
                  <td className="text-[10px] font-mono" style={{ color: "var(--ck-text-muted)" }}>{c.recipientEmail?.toUpperCase() || "—"}</td>
                  <td className="font-mono"><code className="text-[10px] px-2 py-0.5 rounded border border-red-900/30 bg-red-950/20 text-red-400">{c.uniqueCode}</code></td>
                  <td><span className={`ck-badge ${c.status === "GENERATED" ? "ck-badge-success" : "ck-badge-warning"} text-[10px]`}>{c.status}</span></td>
                  <td className="text-[10px] font-mono" style={{ color: "var(--ck-text-muted)" }}>{c.generatedAt ? new Date(c.generatedAt).toLocaleString().toUpperCase() : "—"}</td>
                  <td>
                    <div className="flex gap-2.5">
                      {c.fileUrl && (
                        <>
                          <a href={`${SERVER_BASE_URL}${c.fileUrl}`} target="_blank" rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 text-[10px] flex items-center gap-1 font-mono font-bold uppercase tracking-tighter">
                            <Eye className="w-3.5 h-3.5" /> View
                          </a>
                          <a href={`${SERVER_BASE_URL}${c.fileUrl}`} download target="_blank" rel="noopener noreferrer"
                            className="text-red-400 hover:text-red-300 text-[10px] flex items-center gap-1 font-mono font-bold uppercase tracking-tighter">
                            <Download className="w-3.5 h-3.5" /> DL_PDF
                          </a>
                        </>
                      )}
                      <a href={`/verify/${c.uniqueCode}`} target="_blank"
                          className="text-red-900 hover:text-red-500 text-[10px] flex items-center gap-1 font-mono font-bold uppercase tracking-tighter">
                        <ShieldCheck className="w-3.5 h-3.5" /> VERIFY_CORE
                      </a>
                      <button onClick={() => handleDeleteCert(c.id)}
                          className="text-rose-500 hover:text-rose-400 text-[10px] flex items-center gap-1 font-mono font-bold uppercase tracking-tighter transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
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
    </div>
  );
}

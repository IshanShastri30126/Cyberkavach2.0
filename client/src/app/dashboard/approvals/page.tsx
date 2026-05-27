"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, apiUpload, SERVER_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, CheckCircle, XCircle, Clock, Plus, X, ChevronDown, ChevronUp, Eye, MessageSquare, Paperclip, FileText, Upload } from "lucide-react";

interface ApprovalStep { id: string; level: number; role: string; status: string; comment?: string; approver?: { name: string; role: string }; decidedAt?: string; createdAt: string; }
interface Approval { 
  id: string; title: string; description?: string; type: string; status: string; currentLevel: number; createdAt: string; 
  requester: { id: string; name: string; email: string; role: string }; 
  steps: ApprovalStep[]; 
  metadata?: any;
}

const STATUS_BADGE: Record<string, string> = { PENDING: "ck-badge-warning", UNDER_REVIEW: "ck-badge-info", APPROVED: "ck-badge-success", REJECTED: "ck-badge-danger" };

const APPROVAL_TYPES = [
  { value: "EVENT_PERMISSION", label: "Event Permission" },
  { value: "RESOURCE_VENUE", label: "Resource / Venue Access" },
  { value: "BUDGET", label: "Budget Approval" },
  { value: "SOCIAL_MEDIA_POST", label: "Social Media Post" },
  { value: "CONTENT_PUBLISH", label: "Content Publishing" },
  { value: "CERTIFICATE_AUTH", label: "Certificate Authorization" },
  { value: "EXTERNAL_COLLAB", label: "External Collaboration" },
];

export default function ApprovalsPage() {
  const { user, token } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", type: "EVENT_PERMISSION" });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [decisionComment, setDecisionComment] = useState("");

  const canApprove = user && ["FACULTY", "STUDENT_COORDINATOR"].includes(user.role);

  const load = async () => {
    try {
      const params = filter !== "ALL" ? `?status=${filter}` : "";
      const data = await api<{ requests: Approval[] }>(`/approvals${params}`, { token: token || undefined });
      setApprovals(data.requests);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); }, [token, filter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    try {
      const { request } = await api<{ request: Approval }>("/approvals", { method: "POST", token: token || undefined, body: JSON.stringify(form) });
      
      if (attachment && request.id) {
        const formData = new FormData();
        formData.append("attachment", attachment);
        await apiUpload(`/approvals/${request.id}/attachment`, formData, token || undefined);
      }

      setShowCreate(false); setForm({ title: "", description: "", type: "EVENT_PERMISSION" }); setAttachment(null); load();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed"); } finally { setCreating(false); }
  };

  const handleDecide = async (id: string, status: "APPROVED" | "REJECTED" | "UNDER_REVIEW") => {
    try {
      await api(`/approvals/${id}/decide`, { method: "POST", token: token || undefined, body: JSON.stringify({ status, comment: decisionComment || undefined }) });
      setDecisionComment(""); load();
    } catch (err) { alert(err instanceof Error ? err.message : "Action failed"); }
  };

  const filters = ["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--ck-text)" }}>Approvals</h1>
          <p className="mt-1" style={{ color: "var(--ck-text-secondary)" }}>Multi-level approval chain management</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="ck-btn-primary"><Plus className="w-4 h-4" /> New Request</button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto whitespace-nowrap" style={{ background: "var(--ck-bg-secondary)" }}>
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${filter === f ? "bg-indigo-500 text-white shadow-md" : ""}`}
            style={filter !== f ? { color: "var(--ck-text-muted)" } : {}}>
            {f === "UNDER_REVIEW" ? "REVIEWING" : f}
          </button>
        ))}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="ck-modal-overlay">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="ck-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: "var(--ck-text)" }}>New Approval Request</h2>
                <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-[var(--ck-border)]"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div><label className="ck-label">Title</label><input className="ck-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Brief title for your request" /></div>
                <div><label className="ck-label">Description</label><textarea className="ck-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description..." /></div>
                <div>
                  <label className="ck-label">Request Type</label>
                  <select className="ck-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {APPROVAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="ck-label">Supporting Document (optional)</label>
                  <div className="border-2 border-dashed rounded-xl p-4 text-center transition hover:border-indigo-400" style={{ borderColor: "var(--ck-border)" }}>
                    <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--ck-text-muted)" }} />
                    <input type="file" className="hidden" id="file-upload" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                    <label htmlFor="file-upload" className="text-sm cursor-pointer text-indigo-400 hover:text-indigo-300">
                      {attachment ? attachment.name : "Click to attach a file (PDF, Image, etc)"}
                    </label>
                  </div>
                </div>
                <button type="submit" disabled={creating} className="ck-btn-primary w-full mt-2">{creating ? "Submitting..." : "Submit Request"}</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--ck-text-muted)" }} />
          <p className="text-lg" style={{ color: "var(--ck-text-secondary)" }}>No approval requests</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {approvals.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="ck-card overflow-hidden">
              <div className="p-5 cursor-pointer" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold" style={{ color: "var(--ck-text)" }}>{a.title}</h3>
                    <p className="text-sm mt-0.5" style={{ color: "var(--ck-text-muted)" }}>
                      by {a.requester.name} · {a.type.replace(/_/g, " ")} · {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.metadata?.attachments?.length > 0 && <Paperclip className="w-4 h-4 text-indigo-400" />}
                    <span className={`ck-badge ${STATUS_BADGE[a.status]}`}>{a.status}</span>
                    {expanded === a.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expanded === a.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-[var(--ck-border)] p-5 pt-4">
                    {a.description && <p className="text-sm mb-4" style={{ color: "var(--ck-text-secondary)" }}>{a.description}</p>}

                    {/* Attachments */}
                    {a.metadata?.attachments?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--ck-text-muted)" }}>Attachments</p>
                        <div className="flex flex-wrap gap-2">
                          {a.metadata.attachments.map((file: any, idx: number) => (
                            <a key={idx} href={`${SERVER_BASE_URL}${file.url}`} target="_blank" rel="noopener noreferrer" 
                               className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--ck-border)] hover:bg-[var(--ck-bg-secondary)] transition text-sm text-indigo-400">
                              <FileText className="w-4 h-4" /> {file.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Approval Timeline */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ck-text-muted)" }}>Approval Timeline</p>
                      {a.steps.map((step) => (
                        <div key={step.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--ck-bg-secondary)" }}>
                          {step.status === "APPROVED" ? <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" /> :
                           step.status === "REJECTED" ? <XCircle className="w-5 h-5 text-red-500 mt-0.5" /> :
                           step.status === "UNDER_REVIEW" ? <Eye className="w-5 h-5 text-cyan-500 mt-0.5" /> :
                           <Clock className="w-5 h-5 text-amber-500 mt-0.5" />}
                          <div className="flex-1">
                            <p className="text-sm font-medium" style={{ color: "var(--ck-text)" }}>Level {step.level} — {step.role.replace(/_/g, " ")}</p>
                            {step.approver && <p className="text-xs" style={{ color: "var(--ck-text-muted)" }}>by {step.approver.name} · {step.decidedAt ? new Date(step.decidedAt).toLocaleString() : ""}</p>}
                            {step.comment && <p className="text-xs mt-1 italic flex items-center gap-1" style={{ color: "var(--ck-text-secondary)" }}><MessageSquare className="w-3 h-3" /> {step.comment}</p>}
                          </div>
                          <span className={`ck-badge ${STATUS_BADGE[step.status]}`}>{step.status}</span>
                        </div>
                      ))}
                    </div>

                    {/* Decision Actions */}
                    {canApprove && (a.status === "PENDING" || a.status === "UNDER_REVIEW") && (
                      <div className="mt-4 space-y-3 p-4 rounded-xl border border-[var(--ck-border)]" style={{ background: "var(--ck-bg)" }}>
                        <div>
                          <label className="ck-label">Remarks (optional)</label>
                          <input className="ck-input" placeholder="Add your comments..." value={decisionComment} onChange={(e) => setDecisionComment(e.target.value)} />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handleDecide(a.id, "APPROVED")} className="ck-btn-primary flex-1 text-sm py-2.5"><CheckCircle className="w-4 h-4" /> Approve</button>
                          <button onClick={() => handleDecide(a.id, "UNDER_REVIEW")} className="ck-btn-secondary flex-1 text-sm py-2.5"><Eye className="w-4 h-4" /> Reviewing</button>
                          <button onClick={() => handleDecide(a.id, "REJECTED")} className="ck-btn-danger flex-1 text-sm py-2.5"><XCircle className="w-4 h-4" /> Reject</button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

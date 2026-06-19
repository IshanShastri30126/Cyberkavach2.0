"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, apiUpload, SERVER_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, CheckCircle, XCircle, Clock, Plus, X, ChevronDown, ChevronUp, Eye, MessageSquare, Paperclip, FileText, Upload, Check, Send, Zap, Shield, AlertTriangle, ArrowRight, Filter } from "lucide-react";

interface ApprovalStep { id: string; level: number; role: string; status: string; comment?: string; approver?: { name: string; role: string }; decidedAt?: string; createdAt: string; }
interface Approval {
  id: string; title: string; description?: string; type: string; status: string; currentLevel: number; createdAt: string;
  requester: { id: string; name: string; email: string; role: string };
  steps: ApprovalStep[];
  metadata?: any;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  PENDING:      { color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)",  label: "PENDING"      },
  UNDER_REVIEW: { color: "#06b6d4", bg: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.2)",   label: "REVIEWING"    },
  APPROVED:     { color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  label: "APPROVED"     },
  REJECTED:     { color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   label: "REJECTED"     },
};

const APPROVAL_TYPES = [
  { value: "EVENT_PERMISSION",  label: "Event Permission",      icon: "🎪" },
  { value: "RESOURCE_VENUE",    label: "Resource / Venue",      icon: "🏛️" },
  { value: "BUDGET",            label: "Budget Approval",       icon: "💰" },
  { value: "SOCIAL_MEDIA_POST", label: "Social Media Post",     icon: "📣" },
  { value: "CONTENT_PUBLISH",   label: "Content Publishing",    icon: "📝" },
  { value: "CERTIFICATE_AUTH",  label: "Certificate Auth",      icon: "🎓" },
  { value: "EXTERNAL_COLLAB",   label: "External Collaboration",icon: "🤝" },
];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border font-mono"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

export default function ApprovalsPage() {
  const { user, token } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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
        const fd = new FormData(); fd.append("file", attachment);
        await apiUpload(`/approvals/${request.id}/attachment`, fd, token || undefined);
      }
      setShowCreate(false);
      setForm({ title: "", description: "", type: "EVENT_PERMISSION" });
      setAttachment(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
      load();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handleDecision = async (id: string, decision: "APPROVE" | "REJECT") => {
    try {
      const status = decision === "APPROVE" ? "APPROVED" : "REJECTED";
      await api(`/approvals/${id}/decide`, {
        method: "POST", token: token || undefined,
        body: JSON.stringify({ status, comment: decisionComment }),
      });
      setDecisionComment(""); load();
    } catch (err) { console.error(err); }
  };

  const statusFilters = ["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"];
  const pendingCount = approvals.filter(a => a.status === "PENDING" || a.status === "UNDER_REVIEW").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">APPROVAL PIPELINE</span>
          </div>
          <h1 className="text-4xl font-black font-mono tracking-tighter text-white">
            APPROVALS <span className="text-amber-400">HUB</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            {pendingCount > 0 ? <span className="text-amber-400">{pendingCount} REQUESTS AWAITING DECISION</span> : "ALL REQUESTS RESOLVED"}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600/80 to-amber-500/80 border border-amber-500/40 text-white text-xs font-black uppercase tracking-widest hover:from-amber-500 hover:to-amber-400 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.4)]"
        >
          <Plus className="w-4 h-4" /> NEW REQUEST
        </button>
      </motion.div>

      {/* Status Filter Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-1.5 p-1.5 rounded-2xl bg-white/3 border border-white/5 w-fit flex-wrap"
      >
        {statusFilters.map(f => {
          const cfg = STATUS_CONFIG[f];
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all font-mono ${filter === f
                ? cfg ? `border shadow-[0_0_10px_${cfg.color}30]` : "bg-white/10 border border-white/15 text-white"
                : "text-zinc-500 hover:text-zinc-300"
              }`}
              style={filter === f && cfg ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}}
            >
              {f.replace("_", " ")}
            </button>
          );
        })}
      </motion.div>

      {/* Success toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 p-4 rounded-2xl border border-green-500/25 bg-green-950/20 text-green-300"
          >
            <div className="w-8 h-8 rounded-xl bg-green-500/15 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-bold">REQUEST SUBMITTED</p>
              <p className="text-xs text-green-400/70">Your approval request has been routed through the pipeline.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-xs font-mono text-zinc-600 animate-pulse uppercase tracking-widest">LOADING PIPELINE...</p>
        </div>
      ) : approvals.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-2xl border border-amber-500/15 bg-amber-950/10 flex items-center justify-center">
            <ClipboardList className="w-9 h-9 text-amber-500/40" />
          </div>
          <p className="text-sm font-black uppercase tracking-widest text-zinc-500">NO REQUESTS IN PIPELINE</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {approvals.map((ap, i) => {
            const cfg = STATUS_CONFIG[ap.status] || STATUS_CONFIG.PENDING;
            const typeInfo = APPROVAL_TYPES.find(t => t.value === ap.type);
            const isExpanded = expanded === ap.id;
            const canDecide = canApprove && (ap.status === "PENDING" || ap.status === "UNDER_REVIEW");

            return (
              <motion.div key={ap.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border overflow-hidden transition-all"
                style={{ borderColor: isExpanded ? cfg.border : "rgba(255,255,255,0.06)", background: isExpanded ? cfg.bg : "rgba(255,255,255,0.02)" }}
              >
                {/* Card Header */}
                <button onClick={() => setExpanded(isExpanded ? null : ap.id)}
                  className="w-full p-6 flex items-center gap-6 text-left hover:bg-white/3 transition-colors"
                >
                  {/* Icon */}
                  <div className="text-2xl shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 bg-white/3">
                    {typeInfo?.icon || "📋"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-bold text-zinc-100">{ap.title}</p>
                      <StatusBadge status={ap.status} />
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-sm text-zinc-500 font-mono uppercase">{typeInfo?.label || ap.type}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-sm text-zinc-500 font-mono">{ap.requester.name}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-sm text-zinc-600 font-mono">{new Date(ap.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded Detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 space-y-5 border-t border-white/5 pt-6">
                        {ap.description && (
                          <p className="text-base text-zinc-400 leading-relaxed bg-white/3 rounded-xl p-4 border border-white/5">{ap.description}</p>
                        )}

                        {/* Steps Timeline */}
                        <div>
                          <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-3">APPROVAL CHAIN</p>
                          <div className="space-y-2">
                            {ap.steps.map((step, si) => {
                              const stepCfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.PENDING;
                              return (
                                <div key={step.id} className="flex items-start gap-3">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center border" style={{ background: stepCfg.bg, borderColor: stepCfg.border }}>
                                      {step.status === "APPROVED" ? <CheckCircle className="w-5 h-5" style={{ color: stepCfg.color }} /> :
                                        step.status === "REJECTED" ? <XCircle className="w-5 h-5" style={{ color: stepCfg.color }} /> :
                                          <Clock className="w-5 h-5" style={{ color: stepCfg.color }} />}
                                    </div>
                                    {si < ap.steps.length - 1 && <div className="w-px h-6 bg-white/10" />}
                                  </div>
                                  <div className="flex-1 pb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-zinc-300">{step.role.replace(/_/g, " ")}</span>
                                      <span className="text-xs font-mono uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: stepCfg.color, background: stepCfg.bg }}>{step.status}</span>
                                    </div>
                                    {step.approver && <p className="text-xs text-zinc-500 font-mono">{step.approver.name}</p>}
                                    {step.comment && <p className="text-sm text-zinc-400 mt-1.5 italic">&ldquo;{step.comment}&rdquo;</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Decision Section */}
                        {canDecide && (
                          <div className="border-t border-white/5 pt-4 space-y-3">
                            <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">ADJUDICATE REQUEST</p>
                            <textarea
                              value={decisionComment}
                              onChange={e => setDecisionComment(e.target.value)}
                              placeholder="Add decision comment (optional)..."
                              className="w-full px-4 py-3 rounded-xl text-base text-zinc-200 border border-white/10 bg-white/3 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/40 focus:bg-black/50 resize-none transition-all"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleDecision(ap.id, "APPROVE")}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-green-500/25 bg-green-950/15 text-green-400 text-sm font-black uppercase tracking-wider hover:bg-green-500/15 hover:border-green-500/40 transition-all"
                              >
                                <CheckCircle className="w-5 h-5" /> APPROVE
                              </button>
                              <button onClick={() => handleDecision(ap.id, "REJECT")}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/25 bg-red-950/15 text-red-400 text-sm font-black uppercase tracking-wider hover:bg-red-500/15 hover:border-red-500/40 transition-all"
                              >
                                <XCircle className="w-5 h-5" /> REJECT
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-0 z-[51] flex items-center justify-center p-4"
            >
              <div className="w-full max-w-lg rounded-3xl border border-amber-500/20 bg-[#0a0706] shadow-[0_0_80px_rgba(245,158,11,0.15)] overflow-hidden">
                {/* Modal Header */}
                <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">ROUTE NEW REQUEST</span>
                    </div>
                    <h3 className="text-lg font-black font-mono tracking-tight text-white">NEW APPROVAL REQUEST</h3>
                  </div>
                  <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="p-6 space-y-4">
                  {/* Type selector */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">REQUEST TYPE</label>
                    <div className="grid grid-cols-2 gap-2">
                      {APPROVAL_TYPES.map(t => (
                        <button key={t.value} type="button"
                          onClick={() => setForm(f => ({ ...f, type: t.value }))}
                          className={`flex items-center gap-2 p-3 rounded-xl text-left text-xs transition-all border ${form.type === t.value
                            ? "border-amber-500/40 bg-amber-950/25 text-amber-200"
                            : "border-white/5 bg-white/3 text-zinc-500 hover:border-white/10 hover:text-zinc-300"}`}
                        >
                          <span className="text-base">{t.icon}</span>
                          <span className="font-semibold leading-tight">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">REQUEST TITLE *</label>
                    <input
                      required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Brief, descriptive title..."
                      className="w-full px-4 py-3 rounded-xl text-sm text-zinc-100 border border-white/10 bg-white/3 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 focus:bg-black/60 transition-all"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">DESCRIPTION</label>
                    <textarea
                      value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Provide context, justification, and any supporting details..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-sm text-zinc-100 border border-white/10 bg-white/3 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40 focus:bg-black/60 resize-none transition-all"
                    />
                  </div>

                  {/* Attachment */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">ATTACHMENT (OPTIONAL)</label>
                    <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${attachment ? "border-amber-500/30 bg-amber-950/15" : "border-white/10 bg-white/3 hover:border-white/15"}`}>
                      <Paperclip className={`w-4 h-4 ${attachment ? "text-amber-400" : "text-zinc-500"}`} />
                      <span className="text-xs text-zinc-400 flex-1 truncate">{attachment ? attachment.name : "Attach supporting document..."}</span>
                      <input type="file" className="hidden" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                    </label>
                  </div>

                  {/* Submit */}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)}
                      className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-500 text-sm font-bold hover:border-white/20 hover:text-zinc-300 transition-all"
                    >
                      CANCEL
                    </button>
                    <button type="submit" disabled={creating}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-black uppercase tracking-wider hover:from-amber-500 hover:to-amber-400 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creating ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><Send className="w-4 h-4" /> SUBMIT</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

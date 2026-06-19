"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Edit3, Clipboard, Check,
  Sparkles, Radio, Loader, RefreshCw, AlertCircle, Save, CheckCircle
} from "lucide-react";

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

interface Draft {
  id: string;
  title: string;
  content: string;
  platform: "twitter" | "linkedin" | "instagram";
  status: "DRAFT" | "APPROVED" | "POSTED";
  sourceType: string;
  sourceId: string;
  createdAt: string;
}

export default function SocialDraftsPage() {
  const { token, user } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states for manual generation
  const [genTitle, setGenTitle] = useState("");
  const [genDesc, setGenDesc] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter", "linkedin", "instagram"]);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const data = await api<{ drafts: Draft[] }>("/social-drafts", { token: token || undefined });
      setDrafts(data.drafts);
    } catch (err) {
      console.error(err);
      showToast("FAILED TO LOAD DRAFTS", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadDrafts();
  }, [token]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTitle.trim()) return;
    try {
      setGenerating(true);
      const body = {
        title: genTitle,
        description: genDesc,
        sourceType: "MANUAL",
        sourceId: "manual_gen",
        platforms: selectedPlatforms
      };
      await api("/social-drafts/generate", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify(body)
      });
      showToast("AI DRAFTS GENERATED", "success");
      setGenTitle("");
      setGenDesc("");
      loadDrafts();
    } catch (err) {
      showToast("GENERATION FAILED", "error");
    } finally {
      setGenerating(false);
    }
  };

  const togglePlatformSelection = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleStartEdit = (draft: Draft) => {
    setEditingId(draft.id);
    setEditContent(draft.content);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await api(`/social-drafts/${id}`, {
        method: "PATCH",
        token: token || undefined,
        body: JSON.stringify({ content: editContent })
      });
      setEditingId(null);
      showToast("DRAFT UPDATED", "success");
      loadDrafts();
    } catch {
      showToast("SAVE FAILED", "error");
    }
  };

  const handleCopyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    showToast("COPIED TO CLIPBOARD", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePublish = async (id: string) => {
    try {
      const res = await api<any>(`/social-drafts/${id}/publish`, {
        method: "POST",
        token: token || undefined
      });
      showToast("POST DISPATCHED", "success");
      loadDrafts();
    } catch {
      showToast("PUBLISH SIMULATION FAILED", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-mono font-semibold shadow-2xl"
            style={toast.type === "success"
              ? { background: "rgba(204,255,0,0.08)", borderColor: "rgba(204,255,0,0.3)", color: "var(--ck-lime)" }
              : { background: "rgba(255,0,60,0.08)", borderColor: "rgba(255,0,60,0.3)", color: "var(--ck-red)" }
            }
          >
            {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-3.5 h-3.5 text-[var(--ck-lime)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ck-lime)]">COMMUNICATION PIPELINE</span>
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tighter text-white">
            SOCIAL MEDIA <span className="text-[var(--ck-lime)]">DRAFTS</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">AI-ASSISTED OUTREACH CAMPAIGNS</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Top Panel: Generator Form */}
        <div className="w-full">
          <div className="ck-card p-6 border-l-2 border-l-[var(--ck-lime)]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-[var(--ck-lime)]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">AI DRAFT ASSISTANT</span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="ck-field-group">
                <label className="ck-field-label">Campaign / Event Title</label>
                <input
                  type="text"
                  required
                  value={genTitle}
                  onChange={e => setGenTitle(e.target.value)}
                  placeholder="e.g. Capture the Flag 2026"
                  className="ck-input"
                />
              </div>

              <div className="ck-field-group">
                <label className="ck-field-label">Brief Description</label>
                <textarea
                  rows={8}
                  value={genDesc}
                  onChange={e => setGenDesc(e.target.value)}
                  placeholder="Describe the goals, key details, or tags to prioritize in the social post copy..."
                  className="ck-input resize-none text-sm"
                />
              </div>

              <div className="ck-field-group">
                <label className="ck-field-label">Target Channels</label>
                <div className="flex gap-4 mt-1 max-w-xl">
                  {[
                    { id: "twitter", label: "Twitter (X)", icon: <TwitterIcon className="w-4 h-4" /> },
                    { id: "linkedin", label: "LinkedIn", icon: <LinkedinIcon className="w-4 h-4" /> },
                    { id: "instagram", label: "Instagram", icon: <InstagramIcon className="w-4 h-4" /> }
                  ].map(platform => {
                    const active = selectedPlatforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => togglePlatformSelection(platform.id)}
                        className="flex-1 py-2.5 rounded-lg border flex items-center justify-center gap-2 transition-all cursor-pointer font-mono text-xs font-semibold"
                        style={{
                          background: active ? "rgba(204,255,0,0.08)" : "transparent",
                          borderColor: active ? "var(--ck-lime)" : "#1A1E26",
                          color: active ? "var(--ck-lime)" : "#4B5563"
                        }}
                      >
                        {platform.icon}
                        <span>{platform.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={generating || !genTitle.trim()}
                className="ck-btn-primary px-6 py-2.5 flex items-center justify-center gap-2 max-w-xs cursor-pointer font-mono font-semibold"
              >
                {generating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> GENERATING...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> GENERATE DRAFTS
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Panel: Mapped Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">OUTBOX COMPILER Queue</h2>
            <button
              onClick={loadDrafts}
              className="p-2 rounded-lg border border-[#1A1E26] text-[#8892A4] hover:text-[var(--ck-lime)] hover:border-[var(--ck-lime)] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader className="w-8 h-8 text-[var(--ck-lime)] animate-spin" />
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Loading draft queue...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="ck-card p-12 text-center flex flex-col items-center justify-center gap-4">
              <AlertCircle className="w-10 h-10 text-zinc-650" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">No drafts logged</h3>
                <p className="text-xs text-zinc-500 mt-1">Generate social drafts using the AI assistant panel.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drafts.map(draft => {
                const isEditing = editingId === draft.id;
                const isCopied = copiedId === draft.id;
                return (
                  <motion.div
                    key={draft.id}
                    layout
                    className="ck-card flex flex-col justify-between border-t-2"
                    style={{
                      borderTopColor:
                        draft.platform === "twitter"
                          ? "#1DA1F2"
                          : draft.platform === "linkedin"
                          ? "#0A66C2"
                          : "#E1306C"
                    }}
                  >
                    {/* Card Header */}
                    <div className="p-4 border-b border-[#1A1E26] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {draft.platform === "twitter" && <TwitterIcon className="w-4 h-4 text-[#1DA1F2]" />}
                        {draft.platform === "linkedin" && <LinkedinIcon className="w-4 h-4 text-[#0A66C2]" />}
                        {draft.platform === "instagram" && <InstagramIcon className="w-4 h-4 text-[#E1306C]" />}
                        <span className="text-xs font-mono font-bold uppercase text-white truncate max-w-[150px]">{draft.title.split(": ")[1]}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          draft.status === "POSTED"
                            ? "bg-green-500/10 text-green-400 border border-green-500/25"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                        }`}>
                          {draft.status}
                        </span>
                      </div>
                    </div>

                    {/* Card Content / Text Area */}
                    <div className="p-4 flex-1">
                      {isEditing ? (
                        <textarea
                          rows={6}
                          value={editContent}
                          onChange={e => setEditContent(e.target.value)}
                          className="ck-input w-full font-sans text-xs resize-none"
                        />
                      ) : (
                        <div className="max-h-40 overflow-y-auto custom-scrollbar pr-1">
                          <p className="text-xs text-[#cbd5e1] leading-relaxed whitespace-pre-wrap font-sans">
                            {draft.content}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-3 bg-[#080A0F]/60 border-t border-[#1A1E26] flex justify-between items-center gap-2">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleCopyToClipboard(draft.content, draft.id)}
                          className="p-1.5 rounded-lg border border-[#1A1E26] text-[#8892A4] hover:text-[var(--ck-lime)] hover:border-[var(--ck-lime)] transition-all cursor-pointer"
                          title="Copy text"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                        </button>

                        {isEditing ? (
                          <button
                            onClick={() => handleSaveEdit(draft.id)}
                            className="p-1.5 rounded-lg border border-green-500/20 bg-green-500/5 text-green-400 hover:bg-green-500/10 transition-all cursor-pointer"
                            title="Save Changes"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(draft)}
                            className="p-1.5 rounded-lg border border-[#1A1E26] text-[#8892A4] hover:text-[var(--ck-lime)] hover:border-[var(--ck-lime)] transition-all cursor-pointer"
                            title="Edit Draft"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {draft.status !== "POSTED" && (
                        <button
                          onClick={() => handlePublish(draft.id)}
                          className="ck-btn-primary py-1 px-3 text-[10px] font-bold font-mono tracking-wider flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3 h-3" /> PUBLISH
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

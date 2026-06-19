"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Calendar, Sparkles, Send, Eye, Code, CheckCircle,
  AlertCircle, Loader, Radio, ShieldCheck, ArrowRight
} from "lucide-react";

export default function NewslettersPage() {
  const { token } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  // Generated results
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [recipientsCount, setRecipientsCount] = useState(0);

  const [previewMode, setPreviewMode] = useState<"visual" | "code">("visual");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    try {
      setGenerating(true);
      const data = await api<any>("/newsletters/generate", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({ startDate, endDate })
      });
      setSubject(data.subject);
      setHtml(data.html);
      setMarkdown(data.markdown);
      setRecipientsCount(data.recipientsCount);
      showToast("NEWSLETTER DRAFT COMPILED", "success");
    } catch (err) {
      showToast("GENERATION FAILED", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!subject || !html) return;
    try {
      setSending(true);
      setSendProgress(20);

      // Simulate step-by-step progress for HUD visual feedback
      const timer1 = setTimeout(() => setSendProgress(50), 800);
      const timer2 = setTimeout(() => setSendProgress(80), 1600);

      const res = await api<any>("/newsletters/send", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({ subject, html })
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      setSendProgress(100);
      showToast(`SENT TO ${res.sentCount} OPERATIVES`, "success");

      // Reset
      setTimeout(() => {
        setSending(false);
        setSendProgress(0);
        setSubject("");
        setHtml("");
        setMarkdown("");
        setRecipientsCount(0);
      }, 1500);

    } catch (err) {
      showToast("SEND BROADCAST FAILED", "error");
      setSending(false);
      setSendProgress(0);
    }
  };

  // Safe srcDoc generator for iframe visual preview
  const iframeSrcDoc = `
    <html>
      <head>
        <style>
          body { margin: 0; padding: 20px; font-family: sans-serif; background-color: #0b0f19; color: #cbd5e1; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-thumb { background: rgba(204,255,0,0.3); border-radius: 2px; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

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
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ck-lime)]">NEWS DISSEMINATION GRID</span>
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tighter text-white">
            NEWSLETTER <span className="text-[var(--ck-lime)]">AUTO-GENERATION</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">COMPOUND APPROVED ARCHIVES INTO DIGITAL BRIEFS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Left Side: Filter Range Selector */}
        <div className="flex flex-col gap-4">
          <div className="ck-card p-5 border-l-2 border-l-[var(--ck-lime)]">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-[var(--ck-lime)]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">TIMELINE COMPILER</span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="ck-field-group">
                <label className="ck-field-label">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="ck-input"
                />
              </div>

              <div className="ck-field-group">
                <label className="ck-field-label">End Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="ck-input"
                />
              </div>

              <button
                type="submit"
                disabled={generating || !startDate || !endDate}
                className="ck-btn-primary w-full py-2.5 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> COMPILING...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> GENERATE DRAFT
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Recipients / Sending status panel */}
          {html && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="ck-card p-5 border-t border-[#1A1E26] bg-[#080A0F]/65 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">BROADCAST PARAMETERS</span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono text-[#8892A4]">TARGET NAMESPACE</p>
                <p className="text-sm font-bold text-white uppercase">{recipientsCount} Approved Operatives</p>
              </div>

              <div className="border-t border-[#1A1E26] pt-3">
                {sending ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-mono text-[var(--ck-lime)]">
                      <span>SENDING BATCHES...</span>
                      <span>{sendProgress}%</span>
                    </div>
                    <div className="w-full bg-[#1A1E26] h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-[var(--ck-lime)] h-full"
                        style={{ width: `${sendProgress}%` }}
                        transition={{ ease: "easeInOut", duration: 0.3 }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleSendBroadcast}
                    className="ck-btn-primary w-full py-2.5 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4" /> SEND NEWSLETTER <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Side: Visual/Code Iframe Preview */}
        <div className="flex flex-col gap-4">
          {html ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ck-card flex-1 flex flex-col overflow-hidden min-h-[500px]"
            >
              {/* Toolbar */}
              <div className="px-5 py-3 border-b border-[#1A1E26] bg-[#080A0F]/60 flex items-center justify-between flex-wrap gap-2">
                <div className="flex-1 min-w-0 pr-4">
                  <span className="text-[9px] font-mono text-[var(--ck-lime)] uppercase tracking-wider block mb-0.5">SUBJECT LOG</span>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="bg-transparent text-white font-bold text-sm w-full outline-none focus:border-b focus:border-b-[var(--ck-lime)]"
                  />
                </div>

                <div className="flex gap-1 p-0.5 rounded-lg bg-[#0D0F14] border border-[#1A1E26]">
                  <button
                    onClick={() => setPreviewMode("visual")}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wide transition-all flex items-center gap-1.5 cursor-pointer`}
                    style={previewMode === "visual" ? { background: "rgba(204,255,0,0.1)", color: "var(--ck-lime)", border: "1px solid rgba(204,255,0,0.2)" } : { color: "#4B5563" }}
                  >
                    <Eye className="w-3.5 h-3.5" /> VISUAL
                  </button>
                  <button
                    onClick={() => setPreviewMode("code")}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wide transition-all flex items-center gap-1.5 cursor-pointer`}
                    style={previewMode === "code" ? { background: "rgba(204,255,0,0.1)", color: "var(--ck-lime)", border: "1px solid rgba(204,255,0,0.2)" } : { color: "#4B5563" }}
                  >
                    <Code className="w-3.5 h-3.5" /> MARKDOWN
                  </button>
                </div>
              </div>

              {/* Preview Body */}
              <div className="flex-1 bg-black p-4 relative min-h-[400px]">
                {previewMode === "visual" ? (
                  <iframe
                    srcDoc={iframeSrcDoc}
                    title="Newsletter Preview"
                    sandbox="allow-same-origin"
                    className="w-full h-full border-none rounded-lg bg-[#080A0F]"
                  />
                ) : (
                  <textarea
                    value={markdown}
                    onChange={e => setMarkdown(e.target.value)}
                    className="w-full h-full bg-[#080A0F] border border-[#1A1E26] rounded-lg p-4 font-mono text-xs text-[#cbd5e1] outline-none focus:border-[var(--ck-lime)] resize-none"
                  />
                )}
              </div>
            </motion.div>
          ) : (
            <div className="ck-card border-dashed p-20 text-center flex flex-col items-center justify-center gap-4 min-h-[500px]">
              <Mail className="w-12 h-12 text-zinc-755 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Draft Active</h3>
                <p className="text-xs text-zinc-500 mt-1">Specify operational timeline ranges in the compiler panel.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

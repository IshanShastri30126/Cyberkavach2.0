"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Notebook, Edit3, Trash2, Plus, Sparkles, Loader2, Save, X,
  CheckCircle, AlertCircle, Calendar, RefreshCw, ChevronRight, FileText
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NotebookPage() {
  const { token, user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create States
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await api<{ notes: Note[] }>("/notebooks", { token: token || undefined });
      setNotes(data.notes || []);
    } catch (err) {
      console.error(err);
      showToast("FAILED TO SYNC NOTEBOOK VAULT", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadNotes();
  }, [token]);

  // Client-side access verification
  if (user && !["FACULTY", "STUDENT_COORDINATOR", "TECH", "SOCIAL_MEDIA"].includes(user.role)) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center text-center p-8 bg-[#05070A]">
        <div className="max-w-md p-6 rounded-2xl border border-[rgba(255,0,60,0.2)] bg-[#0D0F14] shadow-2xl">
          <AlertCircle className="w-16 h-16 text-[var(--ck-red)] mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-white mb-2 font-mono tracking-wider">ACCESS RESTRICTED</h2>
          <p className="text-zinc-500 text-xs font-mono">You do not have credentials or clearance to access the Notebook Vault.</p>
        </div>
      </div>
    );
  }

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !contentInput.trim() || saving) return;
    setSaving(true);
    try {
      const data = await api<{ note: Note }>("/notebooks", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({
          title: titleInput.trim(),
          content: contentInput.trim()
        })
      });
      setNotes(prev => [data.note, ...prev]);
      showToast("NEW NOTE WRITTEN TO STORAGE", "success");
      setIsCreating(false);
      setTitleInput("");
      setContentInput("");
      setActiveNote(data.note);
    } catch {
      showToast("FAILED TO WRITE NOTE", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote || !titleInput.trim() || !contentInput.trim() || saving) return;
    setSaving(true);
    try {
      const data = await api<{ note: Note }>(`/notebooks/${activeNote.id}`, {
        method: "PATCH",
        token: token || undefined,
        body: JSON.stringify({
          title: titleInput.trim(),
          content: contentInput.trim()
        })
      });
      setNotes(prev => prev.map(n => n.id === data.note.id ? data.note : n));
      showToast("NOTE SYSTEM UPDATED", "success");
      setActiveNote(data.note);
    } catch {
      showToast("FAILED TO UPDATE NOTE", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to purge this note from operational logs?")) return;
    try {
      await api(`/notebooks/${id}`, {
        method: "DELETE",
        token: token || undefined
      });
      setNotes(prev => prev.filter(n => n.id !== id));
      showToast("NOTE PURGED SUCCESSFULLY", "success");
      if (activeNote?.id === id) {
        setActiveNote(null);
        setTitleInput("");
        setContentInput("");
      }
    } catch {
      showToast("FAILED TO PURGE NOTE", "error");
    }
  };

  const handleRequestApproval = async (note: Note) => {
    try {
      setSaving(true);
      await api("/approvals", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({
          title: `Publish Notebook Note: "${note.title}"`,
          description: `Requesting approval to publish operational notebook entry: "${note.title}".`,
          type: "CONTENT_PUBLISH",
          metadata: {
            notebookId: note.id
          }
        })
      });
      showToast("PUBLICATION APPROVAL REQUEST SUBMITTED", "success");
    } catch (err) {
      showToast("FAILED TO SUBMIT REQUEST", "error");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (note: Note) => {
    setIsCreating(false);
    setActiveNote(note);
    setTitleInput(note.title);
    setContentInput(note.content);
  };

  const handleStartCreate = () => {
    setActiveNote(null);
    setIsCreating(true);
    setTitleInput("");
    setContentInput("");
  };

  const handleAIEnhance = async () => {
    if (!contentInput.trim() || aiEnhancing) return;
    setAiEnhancing(true);
    try {
      const response = await api<{ reply: string }>("/ai/chat", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({
          message: `Please enhance, clean up grammar, summarize structure, and format this note to look highly professional. Note Content:\n\n${contentInput}`
        })
      });
      setContentInput(response.reply);
      showToast("AI RECONSTRUCTION COMPLETED", "success");
    } catch (err) {
      console.error(err);
      showToast("AI SERVICE LINK FAILURE", "error");
    } finally {
      setAiEnhancing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] relative gap-4">
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

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#1A1E26] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Notebook className="w-3.5 h-3.5 text-[var(--ck-lime)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ck-lime)]">KNOWLEDGE VAULT</span>
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tighter text-white">
            OPERATIONAL <span className="text-[var(--ck-lime)]">NOTEBOOK</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">CLUB ARCHIVES & STRATEGIC NOTEBOOKS</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadNotes}
            className="p-2.5 rounded-lg border border-[#1A1E26] text-[#8892A4] hover:text-[var(--ck-lime)] hover:border-[var(--ck-lime)] transition-all cursor-pointer bg-transparent"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleStartCreate}
            className="ck-btn-primary py-2 px-4 text-xs flex items-center gap-1.5 cursor-pointer font-bold font-mono uppercase tracking-wide"
          >
            <Plus className="w-4 h-4" /> CREATE NOTE
          </button>
        </div>
      </div>

      {/* Main Content Layout: Notes sidebar + Editor */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar Notes list */}
        <div className="w-80 shrink-0 border border-[#1A1E26] bg-[#080A0F]/60 rounded-xl overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--ck-lime)]" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Accessing records...</span>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <FileText className="w-8 h-8 text-zinc-750 mb-2" />
              <span className="text-xs font-mono text-zinc-500 uppercase">Archive is empty</span>
            </div>
          ) : (
            notes.map((note) => {
              const active = activeNote?.id === note.id;
              return (
                <button
                  key={note.id}
                  onClick={() => handleStartEdit(note)}
                  className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 relative overflow-hidden group ${
                    active 
                      ? "bg-[#0D0F14] border-[var(--ck-lime)]/40 text-white" 
                      : "bg-[#0D0F14]/40 border-[#1A1E26] text-slate-400 hover:border-zinc-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-slate-200 truncate group-hover:text-[var(--ck-lime)] transition-colors">{note.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-zinc-500 hover:text-[var(--ck-red)] rounded transition-all shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{note.content}</p>
                  
                  <div className="flex items-center justify-between gap-1.5 text-[9px] font-mono mt-1">
                    <div className="flex items-center gap-1.5 text-zinc-600">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(note.updatedAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div>
                      {note.isPublished ? (
                        <span className="ck-badge ck-badge-success text-[8px] scale-90 origin-right">PUBLISHED</span>
                      ) : (
                        <span className="ck-badge ck-badge-warning text-[8px] scale-90 origin-right">DRAFT</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Editor Area */}
        <div className="flex-1 border border-[#1A1E26] bg-[#080A0F]/60 rounded-xl overflow-y-auto p-5 custom-scrollbar">
          {isCreating || activeNote ? (
            <form onSubmit={isCreating ? handleCreateNote : handleUpdateNote} className="h-full flex flex-col gap-4">
              {/* Title input */}
              <div className="flex items-center gap-3 border-b border-[#1A1E26] pb-3">
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Untitled Operational Record"
                  className="bg-transparent border-0 font-sans text-xl font-bold text-white focus:outline-none flex-1 placeholder-zinc-700"
                  required
                />
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAIEnhance}
                    disabled={aiEnhancing || !contentInput.trim()}
                    className="px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-950/20 text-purple-400 hover:bg-purple-950/40 hover:text-white transition-all text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    {aiEnhancing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> ENHANCING...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" /> AI ENHANCE
                      </>
                    )}
                  </button>

                  {activeNote && !activeNote.isPublished && user && ["TECH", "SOCIAL_MEDIA"].includes(user.role) && (
                    <button
                      type="button"
                      onClick={() => handleRequestApproval(activeNote)}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg border border-[var(--ck-orange)]/30 bg-orange-950/20 text-[var(--ck-orange)] hover:bg-orange-950/40 hover:text-white transition-all text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> REQUEST APPROVAL
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="ck-btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 cursor-pointer font-mono font-bold"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    SAVE
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setActiveNote(null);
                      setTitleInput("");
                      setContentInput("");
                    }}
                    className="p-1.5 rounded-lg border border-[#1A1E26] hover:bg-[#1A1E26] text-slate-400 hover:text-white cursor-pointer bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content text area */}
              <textarea
                value={contentInput}
                onChange={(e) => setContentInput(e.target.value)}
                placeholder="Initialize note packet description, meeting minutes, technical instructions, or layout designs..."
                className="flex-1 bg-transparent border-0 font-sans text-sm text-slate-300 leading-relaxed focus:outline-none resize-none placeholder-zinc-700 custom-scrollbar"
                required
              />
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3">
              <div className="w-16 h-16 rounded-2xl border border-[#1A1E26] flex items-center justify-center bg-[#0D0F14]/40">
                <Notebook className="w-6 h-6 text-zinc-500" />
              </div>
              <div>
                <h3 className="font-bold text-white uppercase tracking-wider text-sm">NO OPERATIONAL RECORD ACTIVE</h3>
                <p className="text-xs text-zinc-500 mt-1">Select a record from the archives sidebar, or initialize a new notebook page.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

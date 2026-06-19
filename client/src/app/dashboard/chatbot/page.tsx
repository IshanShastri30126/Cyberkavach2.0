"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, User, Loader2, Sparkles, Notebook, SendHorizonal,
  CheckCircle, AlertCircle, RefreshCw, X, Radio, MessageSquare, ArrowRight, Share2
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

function formatInlineStyles(text: string): React.ReactNode[] {
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-extrabold text-white">{part.slice(2, -2)}</strong>;
    } else if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="bg-[#161B22] px-1.5 py-0.5 rounded font-mono text-xs text-[var(--ck-lime)] border border-zinc-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 font-sans text-sm text-slate-200">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const lines = part.split("\n");
          const firstLine = lines[0];
          const lang = firstLine.slice(3).trim();
          const code = lines.slice(1, -1).join("\n");
          return (
            <pre key={index} className="bg-[#0A0D14] border border-[#1A1E26] rounded-xl p-3 my-2 overflow-x-auto font-mono text-xs text-slate-350 relative group">
              {lang && (
                <div className="absolute top-2 right-2 text-[10px] uppercase font-mono text-zinc-500 font-semibold select-none">
                  {lang}
                </div>
              )}
              <code>{code}</code>
            </pre>
          );
        } else {
          const lines = part.split("\n");
          let listItems: React.ReactNode[] = [];
          let listType: "ul" | "ol" | null = null;
          const renderedBlocks: React.ReactNode[] = [];

          const flushList = (key: string) => {
            if (listItems.length > 0) {
              if (listType === "ul") {
                renderedBlocks.push(
                  <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1 text-slate-350">
                    {listItems}
                  </ul>
                );
              } else if (listType === "ol") {
                renderedBlocks.push(
                  <ol key={`ol-${key}`} className="list-decimal pl-5 my-2 space-y-1 text-slate-350">
                    {listItems}
                  </ol>
                );
              }
              listItems = [];
              listType = null;
            }
          };

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            const ulMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
            if (ulMatch) {
              if (listType !== "ul") {
                flushList(`ul-${i}`);
                listType = "ul";
              }
              listItems.push(<li key={i}>{formatInlineStyles(ulMatch[2])}</li>);
              continue;
            }

            const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
            if (olMatch) {
              if (listType !== "ol") {
                flushList(`ol-${i}`);
                listType = "ol";
              }
              listItems.push(<li key={i}>{formatInlineStyles(olMatch[2])}</li>);
              continue;
            }

            if (line.trim() === "") {
              flushList(`empty-${i}`);
              renderedBlocks.push(<div key={`space-${i}`} className="h-2" />);
              continue;
            }

            flushList(`line-${i}`);

            if (line.startsWith("### ")) {
              renderedBlocks.push(
                <h3 key={i} className="text-sm font-bold text-white mt-3 mb-1 font-mono tracking-tight flex items-center gap-1.5 border-b border-zinc-900 pb-1">
                  <span className="text-[var(--ck-lime)] font-black text-xs select-none">▶</span>
                  {formatInlineStyles(line.slice(4))}
                </h3>
              );
            } else if (line.startsWith("## ")) {
              renderedBlocks.push(
                <h2 key={i} className="text-base font-extrabold text-white mt-4 mb-2 font-mono tracking-tight flex items-center gap-1.5">
                  <span className="text-[var(--ck-lime)] font-black select-none">▶▶</span>
                  {formatInlineStyles(line.slice(3))}
                </h2>
              );
            } else if (line.startsWith("# ")) {
              renderedBlocks.push(
                <h1 key={i} className="text-lg font-black text-white mt-5 mb-2 font-mono tracking-tighter uppercase flex items-center gap-1.5 border-b border-[#1A1E26] pb-1.5">
                  {formatInlineStyles(line.slice(2))}
                </h1>
              );
            } else {
              renderedBlocks.push(
                <p key={i} className="leading-relaxed text-slate-300">
                  {formatInlineStyles(line)}
                </p>
              );
            }
          }

          flushList(`end-${index}`);
          return <React.Fragment key={index}>{renderedBlocks}</React.Fragment>;
        }
      })}
    </div>
  );
};

export default function ChatbotPage() {
  const { token, user } = useAuth();

  if (user && !["FACULTY", "STUDENT_COORDINATOR", "TECH", "SOCIAL_MEDIA"].includes(user.role)) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center text-center p-8 bg-[#05070A]">
        <div className="max-w-md p-6 rounded-2xl border border-[rgba(255,0,60,0.2)] bg-[#0D0F14] shadow-2xl">
          <AlertCircle className="w-16 h-16 text-[var(--ck-red)] mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-white mb-2 font-mono tracking-wider">ACCESS RESTRICTED</h2>
          <p className="text-zinc-500 text-xs font-mono">You do not have credentials or clearance to link with the CyberKavach AI Command Center.</p>
        </div>
      </div>
    );
  }
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "model",
      text: "Greetings, operative. CyberKavach AI command center is online. I can help you summarize event notebooks, suggest coordinates for certificate templates, draft social media campaigns, or brainstorm technical details. What is your objective?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modal / Action states
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [actionType, setActionType] = useState<"notebook" | "social" | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [socialPlatform, setSocialPlatform] = useState<"twitter" | "linkedin" | "instagram">("twitter");
  const [socialTitle, setSocialTitle] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Build history payload
      const history = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const data = await api<{ reply: string }>("/ai/chat", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({
          message: userMsg.text,
          history
        })
      });

      const modelMsg: Message = {
        id: `model-${Date.now()}`,
        role: "model",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      showToast("FAILED TO ESTABLISH LINK WITH GEMINI CORPS", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToNotebook = async () => {
    if (!actionMessage || !noteTitle.trim()) return;
    setActionLoading(true);
    try {
      await api("/notebooks", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({
          title: noteTitle.trim(),
          content: actionMessage.text
        })
      });
      showToast("SAVED TO NOTEBOOK INSTANCE", "success");
      setActionMessage(null);
      setActionType(null);
      setNoteTitle("");
    } catch {
      showToast("FAILED TO WRITE TO NOTEBOOK", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSocialDraft = async () => {
    if (!actionMessage || !socialTitle.trim()) return;
    setActionLoading(true);
    try {
      await api("/social-drafts", {
        method: "POST",
        token: token || undefined,
        body: JSON.stringify({
          title: `AI Draft: ${socialTitle.trim()}`,
          content: actionMessage.text,
          platform: socialPlatform
        })
      });
      showToast("SOCIAL OUTBOX DRAFT CREATED", "success");
      setActionMessage(null);
      setActionType(null);
      setSocialTitle("");
    } catch {
      showToast("FAILED TO WRITE SOCIAL DRAFT", "error");
    } finally {
      setActionLoading(false);
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
            <Radio className="w-3.5 h-3.5 text-[var(--ck-lime)] animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ck-lime)]">AI TELEMETRY LINK</span>
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tighter text-white">
            OPERATIONAL <span className="text-[var(--ck-lime)]">CHATBOT</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">GEMINI CORE CO-COORDINATOR INTELLIGENCE</p>
        </div>
        <div className="flex items-center gap-2 border border-[#1A1E26] bg-[#080A0F] px-3 py-1.5 rounded-lg text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-[var(--ck-lime)] animate-ping" />
          <span className="text-slate-400">GEMINI-2.5-FLASH</span>
        </div>
      </div>

      {/* Chat Display Area */}
      <div className="flex-1 overflow-y-auto bg-[#080A0F]/60 border border-[#1A1E26] rounded-xl p-4 flex flex-col gap-4 custom-scrollbar">
        {messages.map((m) => {
          const isBot = m.role === "model";
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-[85%] ${isBot ? "self-start" : "self-end flex-row-reverse"}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                isBot ? "bg-purple-950/20 border-purple-500/30 text-purple-400" : "bg-[var(--ck-lime)]/10 border-[var(--ck-lime)]/30 text-[var(--ck-lime)]"
              }`}>
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col gap-1.5 w-full">
                <div className={`rounded-xl p-3.5 text-sm ${
                  isBot 
                    ? "bg-[#0D0F14] border border-[#1A1E26] text-slate-200" 
                    : "bg-[#161B22] border border-zinc-800 text-white"
                }`}>
                  <MarkdownRenderer content={m.text} />
                </div>
                
                {/* Meta & Action buttons */}
                <div className={`flex items-center gap-3 text-[10px] font-mono text-zinc-500 ${isBot ? "justify-start" : "justify-end"}`}>
                  <span>{m.timestamp}</span>
                  {isBot && m.id !== "welcome" && (
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => {
                          setActionMessage(m);
                          setActionType("notebook");
                          setNoteTitle(m.text.slice(0, 30));
                        }}
                        className="flex items-center gap-1 hover:text-[var(--ck-lime)] transition-colors cursor-pointer"
                        title="Save response to Notebook"
                      >
                        <Notebook className="w-3 h-3" /> Save to Notebook
                      </button>
                      
                      {user && ["FACULTY", "STUDENT_COORDINATOR", "TECH", "SOCIAL_MEDIA"].includes(user.role) && (
                        <button
                          onClick={() => {
                            setActionMessage(m);
                            setActionType("social");
                            setSocialTitle(m.text.slice(0, 30));
                          }}
                          className="flex items-center gap-1 hover:text-[var(--ck-lime)] transition-colors cursor-pointer"
                          title="Generate Social Draft from response"
                        >
                          <Share2 className="w-3 h-3" /> Create Social Draft
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-[85%] self-start">
            <div className="w-8 h-8 rounded-lg bg-purple-950/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-[#0D0F14] border border-[#1A1E26] rounded-xl p-3.5 text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
              <span className="font-mono text-xs text-purple-400">ANALYZING INPUT PACKETS...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder={loading ? "Command center busy..." : "Enter mission objective or request coordinates..."}
          className="flex-1 bg-[#080A0F] border border-[#1A1E26] focus:border-[var(--ck-lime)] focus:outline-none rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="ck-btn-primary px-5 py-3 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </form>

      {/* Action Modals */}
      <AnimatePresence>
        {actionMessage && actionType && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0D0F14] border border-[#1A1E26] rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="border-b border-[#1A1E26] p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--ck-lime)] font-mono font-bold text-xs uppercase">
                  <Sparkles className="w-4 h-4" />
                  {actionType === "notebook" ? "SAVE TO NOTEBOOK" : "CREATE SOCIAL DRAFT"}
                </div>
                <button
                  onClick={() => { setActionMessage(null); setActionType(null); }}
                  className="p-1 hover:bg-[#161B22] rounded transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {actionType === "notebook" ? (
                  <div className="space-y-3">
                    <div className="ck-field-group">
                      <label className="ck-field-label">Note Title</label>
                      <input
                        type="text"
                        value={noteTitle}
                        onChange={(e) => setNoteTitle(e.target.value)}
                        placeholder="e.g. Meet Outline or Certificate Strategy"
                        className="ck-input"
                        required
                      />
                    </div>
                    <button
                      onClick={handleSaveToNotebook}
                      disabled={actionLoading || !noteTitle.trim()}
                      className="ck-btn-primary w-full py-2 flex items-center justify-center gap-2 text-xs"
                    >
                      {actionLoading ? "SAVING..." : "WRITE TO NOTEBOOK"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="ck-field-group">
                      <label className="ck-field-label">Campaign Title</label>
                      <input
                        type="text"
                        value={socialTitle}
                        onChange={(e) => setSocialTitle(e.target.value)}
                        placeholder="e.g. CTF Promo Copy"
                        className="ck-input"
                        required
                      />
                    </div>
                    <div className="ck-field-group">
                      <label className="ck-field-label">Target Channel</label>
                      <select
                        value={socialPlatform}
                        onChange={(e) => setSocialPlatform(e.target.value as any)}
                        className="ck-input w-full bg-black/60"
                      >
                        <option value="twitter">Twitter (X)</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="instagram">Instagram</option>
                      </select>
                    </div>
                    <button
                      onClick={handleCreateSocialDraft}
                      disabled={actionLoading || !socialTitle.trim()}
                      className="ck-btn-primary w-full py-2 flex items-center justify-center gap-2 text-xs"
                    >
                      {actionLoading ? "CREATING DRAFT..." : "INITIALIZE DRAFT"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

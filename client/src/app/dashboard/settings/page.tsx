"use client";

import React, { useState, useEffect } from "react";
import {
  Settings, Shield, Cpu, Lock, Database, Globe, Bell, ChevronRight,
  Save, Check, Zap, Loader, Image, Palette
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useThemeBranding } from "@/components/ThemeProvider";

interface SettingField { label: string; value: string | number; type?: string; disabled?: boolean; unit?: string; description?: string; }

interface SettingSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  fields: SettingField[];
}

const SECTIONS: SettingSection[] = [
  {
    id: "system",
    title: "SYSTEM CONFIGURATION",
    icon: <Cpu className="w-4 h-4" />,
    color: "#7c3aed",
    fields: [
      { label: "Platform Version", value: "CyberKavach v2.0", disabled: true, description: "Current platform build version" },
      { label: "Academic Year", value: "2025-2026", disabled: true, description: "Active academic session" },
      { label: "Environment", value: "PRODUCTION", disabled: true, description: "Deployment environment" },
    ]
  },
  {
    id: "escalation",
    title: "ESCALATION POLICY",
    icon: <Bell className="w-4 h-4" />,
    color: "#f59e0b",
    fields: [
      { label: "Escalation Threshold", value: 48, type: "number", unit: "hours", disabled: true, description: "Hours before auto-escalation triggers" },
      { label: "Max Approval Levels", value: 3, type: "number", disabled: true, description: "Maximum approval chain depth" },
    ]
  },
  {
    id: "security",
    title: "SECURITY SETTINGS",
    icon: <Lock className="w-4 h-4" />,
    color: "#06b6d4",
    fields: [
      { label: "Session Timeout", value: "24 hours", disabled: true, description: "Automatic session expiration" },
      { label: "Auth Method", value: "JWT + Cookie", disabled: true, description: "Active authentication protocol" },
    ]
  },
  {
    id: "data",
    title: "DATA & STORAGE",
    icon: <Database className="w-4 h-4" />,
    color: "#10b981",
    fields: [
      { label: "Database", value: "PostgreSQL 15", disabled: true, description: "Primary data store" },
      { label: "File Storage", value: "Local / S3 Compatible", disabled: true, description: "Asset storage backend" },
    ]
  },
  {
    id: "branding",
    title: "CLUB BRANDING & THEME",
    icon: <Globe className="w-4 h-4" />,
    color: "var(--ck-lime)",
    fields: []
  }
];

export default function SettingsPage() {
  const { user, token } = useAuth();
  const { club, refreshBranding } = useThemeBranding();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("system");

  // Custom branding states
  const [primaryColor, setPrimaryColor] = useState("#CCFF00");
  const [secondaryColor, setSecondaryColor] = useState("#FF4D00");
  const [themeMode, setThemeMode] = useState("dark");
  const [fontFamily, setFontFamily] = useState("Outfit");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    if (club) {
      setPrimaryColor(club.primaryColor);
      setSecondaryColor(club.secondaryColor);
      setThemeMode(club.themeMode);
      setFontFamily(club.fontFamily);
      setLogoUrl(club.logoUrl || "");
    }
  }, [club]);

  const handleSaveDefault = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveBranding = async () => {
    const activeClubSlug = typeof window !== "undefined" ? localStorage.getItem("ck_active_club_slug") || "cyberkavach" : "cyberkavach";
    try {
      setSaving(true);
      await api(`/clubs/${activeClubSlug}/branding`, {
        method: "PATCH",
        token: token || undefined,
        body: JSON.stringify({
          primaryColor,
          secondaryColor,
          themeMode,
          fontFamily,
          logoUrl: logoUrl.trim() || null
        })
      });
      setSaved(true);
      await refreshBranding(); // Apply styles immediately
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const section = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[var(--ck-lime)] animate-pulse shadow-[0_0_8px_var(--ck-lime)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ck-lime)]">SYSTEM CONSOLE</span>
          </div>
          <h1 className="text-3xl font-black font-mono tracking-tighter text-white">
            SETTINGS <span className="text-[var(--ck-lime)]">PANEL</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">COORDINATOR ACCESS ONLY · NAMESPACE PARAMETERS</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--ck-lime)]/20 bg-[var(--ck-lime)]/5">
          <Shield className="w-4 h-4 text-[var(--ck-lime)]" />
          <span className="text-xs font-mono text-[var(--ck-lime)] font-bold">COORDINATOR SIGNATURE APPROVED</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        {/* Sidebar Nav */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="space-y-1"
        >
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${activeSection === s.id
                ? "border shadow-[0_0_15px_rgba(0,0,0,0.4)]"
                : "border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/3"
              }`}
              style={activeSection === s.id ? {
                background: s.id === "branding" ? "rgba(204,255,0,0.08)" : `${s.color}10`,
                borderColor: s.id === "branding" ? "var(--ck-lime)" : `${s.color}25`,
                color: s.id === "branding" ? "var(--ck-lime)" : s.color
              } : {}}
            >
              <span style={activeSection === s.id ? { color: s.id === "branding" ? "var(--ck-lime)" : s.color } : { color: "#52525b" }}>{s.icon}</span>
              <span className="text-[11px] font-black uppercase tracking-wider">{s.title.split(" ")[0]}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />
            </button>
          ))}
        </motion.div>

        {/* Main Panel */}
        <AnimatePresence mode="wait">
          <motion.div key={activeSection}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border overflow-hidden"
            style={{
              borderColor: activeSection === "branding" ? "rgba(204,255,0,0.2)" : `${section.color}20`,
              background: activeSection === "branding" ? "rgba(204,255,0,0.02)" : `${section.color}05`
            }}
          >
            {/* Panel header */}
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: activeSection === "branding" ? "rgba(204,255,0,0.15)" : `${section.color}15` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center border" style={{
                background: activeSection === "branding" ? "rgba(204,255,0,0.1)" : `${section.color}15`,
                borderColor: activeSection === "branding" ? "rgba(204,255,0,0.2)" : `${section.color}30`
              }}>
                <span style={{ color: activeSection === "branding" ? "var(--ck-lime)" : section.color }}>{section.icon}</span>
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: activeSection === "branding" ? "var(--ck-lime)" : section.color }}>{section.title}</h2>
                <p className="text-[10px] text-zinc-650 font-mono mt-0.5">PLATFORM CONFIGURATION PARAMETERS</p>
              </div>
            </div>

            {/* Custom Content for Branding Section */}
            {activeSection === "branding" ? (
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest font-mono text-[var(--ck-lime)]">
                    Theme Mode
                  </label>
                  <p className="text-[11px] text-zinc-500">Toggle default background colors and text contrasts.</p>
                  <div className="flex gap-2">
                    {[
                      { id: "dark", label: "DARK DEEP SPACE" },
                      { id: "light", label: "LIGHT OPERATIVE" }
                    ].map(mode => {
                      const active = themeMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setThemeMode(mode.id)}
                          className="px-4 py-2 text-xs font-bold font-mono border rounded-lg transition-all cursor-pointer"
                          style={{
                            background: active ? "rgba(204,255,0,0.08)" : "transparent",
                            borderColor: active ? "var(--ck-lime)" : "#1A1E26",
                            color: active ? "var(--ck-lime)" : "#8892A4"
                          }}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-widest font-mono text-[var(--ck-lime)]">
                      Primary Brand Color
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded border border-[#1A1E26] bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="ck-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-widest font-mono text-[var(--ck-lime)]">
                      Secondary Brand Color
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="w-10 h-10 rounded border border-[#1A1E26] bg-transparent cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="ck-input text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest font-mono text-[var(--ck-lime)]">
                    Font Family
                  </label>
                  <select
                    value={fontFamily}
                    onChange={e => setFontFamily(e.target.value)}
                    className="ck-input ck-select"
                  >
                    {["Outfit", "Space Grotesk", "Inter", "JetBrains Mono", "Playfair Display"].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest font-mono text-[var(--ck-lime)]">
                    Custom Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="ck-input"
                  />
                </div>
              </div>
            ) : (
              /* Fields for default sections */
              <div className="p-6 space-y-4">
                {section.fields.map((field, i) => (
                  <motion.div key={field.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="space-y-1.5"
                  >
                    <label className="block text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: section.color }}>
                      {field.label}
                    </label>
                    {field.description && (
                      <p className="text-[11px] text-zinc-650">{field.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        type={field.type || "text"}
                        defaultValue={field.value}
                        disabled={field.disabled}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm border font-mono bg-black/40 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--ck-text)" }}
                      />
                      {field.unit && <span className="text-xs text-zinc-500 font-mono shrink-0">{field.unit}</span>}
                      {field.disabled && (
                        <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border border-white/5 bg-white/3">
                          <Lock className="w-3 h-3 text-zinc-600" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="px-6 pb-6 flex items-center justify-between border-t border-[#1A1E26]/20 pt-4">
              <p className="text-[10px] text-zinc-700 font-mono">
                {activeSection === "branding" ? "BRANDING SAVES IN REAL-TIME" : "CHANGES REQUIRE PLATFORM RESTART"}
              </p>
              
              {activeSection === "branding" ? (
                <button onClick={handleSaveBranding} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  style={{
                    background: saved ? "rgba(16,185,129,0.15)" : "rgba(204,255,0,0.15)",
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: saved ? "rgba(16,185,129,0.3)" : "rgba(204,255,0,0.3)",
                    color: saved ? "#10b981" : "var(--ck-lime)",
                  }}
                >
                  {saving ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : saved ? (
                    <><Check className="w-4 h-4" /> SAVED</>
                  ) : (
                    <><Save className="w-4 h-4" /> SAVE BRANDING</>
                  )}
                </button>
              ) : (
                <button onClick={handleSaveDefault}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                  style={{
                    background: saved ? "rgba(16,185,129,0.15)" : `${section.color}15`,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: saved ? "rgba(16,185,129,0.3)" : `${section.color}30`,
                    color: saved ? "#10b981" : section.color,
                  }}
                >
                  {saved ? <><Check className="w-4 h-4" /> SAVED</> : <><Save className="w-4 h-4" /> SAVE</>}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* System Status */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: "UPTIME",      value: "99.97%",  color: "#10b981" },
          { label: "API VERSION", value: "v2.0.0",  color: "#7c3aed" },
          { label: "DB STATUS",   value: "ONLINE",  color: "#06b6d4" },
          { label: "ENV",         value: "PROD",    color: "#f59e0b" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.07 }}
            className="p-3 rounded-xl border border-white/5 bg-white/2 text-center"
          >
            <p className="text-[9px] uppercase tracking-widest text-zinc-650 font-mono">{s.label}</p>
            <p className="text-sm font-black font-mono mt-1" style={{ color: s.color }}>{s.value}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

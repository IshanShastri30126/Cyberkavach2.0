"use client";
import React from "react";
import { Settings, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: "var(--ck-text)" }}>Settings</h1>
        <p className="mt-1" style={{ color: "var(--ck-text-secondary)" }}>Club configuration (Faculty only)</p>
      </div>
      <div className="ck-card p-6 space-y-6">
        <div>
          <h3 className="font-semibold mb-2" style={{ color: "var(--ck-text)" }}>Academic Year</h3>
          <input className="ck-input max-w-xs" defaultValue="2025-2026" disabled />
        </div>
        <div>
          <h3 className="font-semibold mb-2" style={{ color: "var(--ck-text)" }}>Escalation Threshold</h3>
          <div className="flex items-center gap-2">
            <input className="ck-input max-w-20" type="number" defaultValue={48} disabled />
            <span className="text-sm" style={{ color: "var(--ck-text-muted)" }}>hours</span>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2" style={{ color: "var(--ck-text)" }}>Platform Version</h3>
          <p className="text-sm flex items-center gap-2" style={{ color: "var(--ck-text-secondary)" }}><Shield className="w-4 h-4 text-indigo-500" /> CyberKavach 2.0</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { Download, MonitorPlay } from "lucide-react";

export function PWARegistration() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log("[PWA] ServiceWorker registered: ", registration.scope);
          },
          (err) => {
            console.error("[PWA] ServiceWorker registration failed: ", err);
          }
        );
      });
    }

    // 2. Detect if running standalone (installed app)
    if (typeof window !== "undefined") {
      const isWindowStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
      setIsStandalone(!!isWindowStandalone);

      // Listen for display mode changes
      window.matchMedia("(display-mode: standalone)").addEventListener("change", (evt) => {
        setIsStandalone(evt.matches);
      });
    }

    // 3. Track BeforeInstallPrompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Request notifications permission on demand
  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      console.log(`[PWA] Notification permission result: ${permission}`);
    }
  };

  if (!isInstallable || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-[60] max-w-xs p-4 rounded-xl border border-[var(--ck-lime)] bg-black/90 shadow-[0_0_20px_rgba(204,255,0,0.15)] flex flex-col gap-2 backdrop-blur-md animate-bounce-short">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[var(--ck-lime)] animate-ping" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--ck-lime)]">PWA DETECTED</span>
      </div>
      <p className="text-[11px] text-[#8892A4] leading-relaxed">
        Install CyberKavach to your home screen for rapid offline check-in capability.
      </p>
      <div className="flex gap-2 mt-1">
        <button
          onClick={handleInstallClick}
          className="flex-1 ck-btn-primary py-1.5 px-3 text-[10px] font-bold flex items-center justify-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> INSTALL NOW
        </button>
        <button
          onClick={requestNotificationPermission}
          className="ck-btn-secondary py-1.5 px-3 text-[10px] font-bold"
          title="Enable Broadcast Alerts"
        >
          NOTIFY
        </button>
      </div>
    </div>
  );
}

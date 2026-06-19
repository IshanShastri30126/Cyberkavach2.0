"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface ClubBranding {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  themeMode: string;
  fontFamily: string;
}

interface ThemeContextType {
  club: ClubBranding | null;
  loading: boolean;
  refreshBranding: () => Promise<void>;
  changeClub: (slug: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  club: null,
  loading: true,
  refreshBranding: async () => {},
  changeClub: () => {},
});

export const useThemeBranding = () => useContext(ThemeContext);

export function ThemeBrandingProvider({ children }: { children: React.ReactNode }) {
  const [club, setClub] = useState<ClubBranding | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBranding = async () => {
    try {
      const slug = localStorage.getItem("ck_active_club_slug") || "cyberkavach";
      const data = await api<any>(`/clubs/${slug}`);
      if (data.club) {
        setClub(data.club);
        applyBranding(data.club);
      }
    } catch (err) {
      console.error("[ThemeProvider] Failed to load branding:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
    
    // Listen to localStorage changes in the same window (e.g. switcher)
    const handleStorageChange = () => {
      fetchBranding();
    };
    window.addEventListener("ck_club_changed", handleStorageChange);
    return () => window.removeEventListener("ck_club_changed", handleStorageChange);
  }, []);

  const changeClub = (slug: string) => {
    localStorage.setItem("ck_active_club_slug", slug);
    fetchBranding();
    window.dispatchEvent(new Event("ck_club_changed"));
  };

  const applyBranding = (branding: ClubBranding) => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Apply primary & secondary colors
    root.style.setProperty("--ck-lime", branding.primaryColor);
    root.style.setProperty("--ck-primary", branding.primaryColor);
    root.style.setProperty("--ck-primary-light", branding.primaryColor);
    
    root.style.setProperty("--ck-orange", branding.secondaryColor);
    root.style.setProperty("--ck-accent", branding.secondaryColor);
    root.style.setProperty("--ck-accent-light", branding.secondaryColor);

    // Apply fonts (loads Google Font dynamically if not available)
    if (branding.fontFamily) {
      const fontId = `ck-font-${branding.fontFamily.replace(/\s+/g, "-").toLowerCase()}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${branding.fontFamily.replace(/\s+/g, "+")}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
      root.style.setProperty("--font-sans", `'${branding.fontFamily}', sans-serif`);
      root.style.fontFamily = `'${branding.fontFamily}', sans-serif`;
    }

    const pColor = branding.primaryColor || "#CCFF00";
    const sColor = branding.secondaryColor || "#FF4D00";

    // Convert hex to RGBA with custom opacity for smooth dark space ambient glows
    const hexToRgba = (hex: string, opacity: number) => {
      try {
        let c = hex.substring(1);
        if (c.length === 3) {
          c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        }
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
      } catch {
        return hex;
      }
    };

    // Apply theme mode (light vs dark vs hybrid)
    if (branding.themeMode === "light") {
      const lightGradient = `linear-gradient(135deg, ${hexToRgba(pColor, 0.04)} 0%, #F8FAFC 50%, ${hexToRgba(sColor, 0.04)} 100%)`;
      root.style.setProperty("--ck-bg", "#F8FAFC");
      root.style.setProperty("--ck-bg-gradient", lightGradient);
      root.style.setProperty("--ck-bg-secondary", "#F1F5F9");
      root.style.setProperty("--ck-bg-card", "#FFFFFF");
      root.style.setProperty("--ck-bg-elevated", "#E2E8F0");
      root.style.setProperty("--ck-text", "#0F172A");
      root.style.setProperty("--ck-text-secondary", "#475569");
      root.style.setProperty("--ck-text-muted", "#94A3B8");
      root.style.setProperty("--ck-border", "#E2E8F0");
      root.style.setProperty("--ck-border-bright", "#CBD5E1");
      root.style.setProperty("--ck-glass-bg", "rgba(255,255,255,0.85)");
      root.style.setProperty("--ck-glass-border", "rgba(15,23,42,0.1)");
      document.body.style.background = lightGradient;
      document.body.style.color = "#0F172A";
    } else {
      // Dark Mode (SpaceX theme defaults with dynamic glow)
      const darkGradient = `radial-gradient(circle at 0% 0%, ${hexToRgba(pColor, 0.08)} 0%, #05070A 50%), radial-gradient(circle at 100% 100%, ${hexToRgba(sColor, 0.08)} 0%, #05070A 100%)`;
      root.style.setProperty("--ck-bg", "#05070A");
      root.style.setProperty("--ck-bg-gradient", darkGradient);
      root.style.setProperty("--ck-bg-secondary", "#080A0F");
      root.style.setProperty("--ck-bg-card", "#0D0F14");
      root.style.setProperty("--ck-bg-elevated", "#121519");
      root.style.setProperty("--ck-text", "#F0F4FF");
      root.style.setProperty("--ck-text-secondary", "#8892A4");
      root.style.setProperty("--ck-text-muted", "#4B5563");
      root.style.setProperty("--ck-border", "#1A1E26");
      root.style.setProperty("--ck-border-bright", "#252B35");
      root.style.setProperty("--ck-glass-bg", "rgba(13,15,20,0.85)");
      root.style.setProperty("--ck-glass-border", "rgba(204,255,0,0.12)");
      document.body.style.background = darkGradient;
      document.body.style.color = "#F0F4FF";
    }
  };

  return (
    <ThemeContext.Provider value={{ club, loading, refreshBranding: fetchBranding, changeClub }}>
      {children}
    </ThemeContext.Provider>
  );
}

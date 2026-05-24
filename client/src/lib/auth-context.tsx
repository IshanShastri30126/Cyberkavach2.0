"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import Cookies from "js-cookie";

export type Role = "FACULTY" | "STUDENT_COORDINATOR" | "TECH" | "CONTENT" | "SOCIAL_MEDIA" | "MEMBER" | "GUEST";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  studentId?: string;
  phone?: string;
  department?: string;
  institute?: string;
  semester?: string;
  isApproved: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string, extra?: { studentId?: string; phone?: string; department?: string; institute?: string; semester?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async (accessToken: string) => {
    try {
      const data = await api<{ user: User }>("/auth/me", { token: accessToken });
      setUser(data.user);
      setToken(accessToken);
    } catch {
      setUser(null);
      setToken(null);
      Cookies.remove("accessToken");
    }
  }, []);

  useEffect(() => {
    const savedToken = Cookies.get("accessToken");
    if (savedToken) {
      fetchMe(savedToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const data = await api<{ user: User; accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    Cookies.set("accessToken", data.accessToken, { expires: 1 });
    setUser(data.user);
    setToken(data.accessToken);
  };

  const loginWithGoogle = async (credential: string) => {
    const data = await api<{ user: User; accessToken: string }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
    Cookies.set("accessToken", data.accessToken, { expires: 1 });
    setUser(data.user);
    setToken(data.accessToken);
  };

  const register = async (name: string, email: string, password: string, extra?: { studentId?: string; phone?: string; department?: string; institute?: string; semester?: string }) => {
    const data = await api<{ user: User; accessToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, ...extra }),
    });
    Cookies.set("accessToken", data.accessToken, { expires: 1 });
    setUser(data.user);
    setToken(data.accessToken);
  };

  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST", token: token || undefined });
    } catch { /* ignore */ }
    setUser(null);
    setToken(null);
    Cookies.remove("accessToken");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, Role } from "@/lib/auth-context";
import { api, SERVER_BASE_URL } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Shield, LayoutDashboard, Calendar, Users, Award,
  FileCheck, BarChart3, CheckSquare, LogOut,
  ChevronRight, ClipboardList, Bell, Menu, X, UsersRound,
  User, Settings
} from "lucide-react";
import { DefaultAvatar } from "@/components/default-avatar";

interface NavItem { label: string; href: string; icon: React.ReactNode; roles?: Role[]; }

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Events", href: "/dashboard/events", icon: <Calendar className="w-5 h-5" /> },
  { label: "Teams", href: "/dashboard/teams", icon: <UsersRound className="w-5 h-5" /> },
  { label: "Attendance", href: "/dashboard/attendance", icon: <CheckSquare className="w-5 h-5" /> },
  { label: "Certificates", href: "/dashboard/certificates", icon: <FileCheck className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR", "TECH", "SOCIAL_MEDIA"] },
  { label: "Approvals", href: "/dashboard/approvals", icon: <ClipboardList className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR", "TECH", "CONTENT", "SOCIAL_MEDIA"] },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: <Award className="w-5 h-5" /> },
  { label: "Users", href: "/dashboard/users", icon: <Users className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR"] },
  { label: "Analytics", href: "/dashboard/analytics", icon: <BarChart3 className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR"] },
  { label: "Profile", href: "/dashboard/profile", icon: <User className="w-5 h-5" /> },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings className="w-5 h-5" />, roles: ["FACULTY"] },
];

const ROLE_COLORS: Record<Role, string> = {
  FACULTY: "from-red-600 to-red-400",
  STUDENT_COORDINATOR: "from-red-900 to-red-700",
  TECH: "from-zinc-700 to-zinc-900",
  CONTENT: "from-red-950 to-red-800",
  SOCIAL_MEDIA: "from-red-500 to-orange-600",
  MEMBER: "from-zinc-400 to-zinc-600",
  GUEST: "from-zinc-800 to-zinc-900",
};

const ROLE_LABELS: Record<Role, string> = {
  FACULTY: "Faculty",
  STUDENT_COORDINATOR: "Student Coordinator",
  TECH: "Tech Team",
  CONTENT: "Content Team",
  SOCIAL_MEDIA: "Social Media",
  MEMBER: "Member",
  GUEST: "Guest",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) router.push("/");
  }, [user, isLoading, router]);

  // Fetch unread notifications count
  useEffect(() => {
    if (!token) return;
    const fetchCount = async () => {
      try {
        const data = await api<{ count: number }>("/notifications/unread-count", { token });
        setUnreadCount(data.count);
      } catch { /* ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [token]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(220,38,38,0.3)]" />
      </div>
    );
  }

  // Show pending approval screen for unapproved users
  if (!user.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--ck-bg)" }}>
        <div className="ck-card p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--ck-text)" }}>Account Pending Approval</h2>
          <p className="text-sm mb-6" style={{ color: "var(--ck-text-secondary)" }}>
            Your account is awaiting coordinator approval. You&apos;ll be notified once approved.
          </p>
          <button onClick={() => { logout(); router.push("/"); }} className="ck-btn-secondary">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  const filteredNav = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user.role));

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-red-900/20">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)] group-hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] transition-all">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg font-mono tracking-tighter uppercase" style={{ color: "var(--ck-text)" }}>CYBERKAVACH</span>
        </Link>
      </div>

      <div className="p-4">
        <div className="p-3 rounded-lg border border-red-900/10 bg-black/40">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img src={`${SERVER_BASE_URL}${user.avatarUrl}`} alt="Avatar" className="w-9 h-9 rounded-lg object-cover border border-red-900 shadow-[0_0_8px_rgba(220,38,38,0.3)]" />
            ) : (
              <DefaultAvatar className="w-9 h-9 border border-red-900" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--ck-text)" }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--ck-text-muted)" }}>{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`ck-sidebar-link text-[13px] tracking-wide ${isActive ? "active" : ""}`}>
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[var(--ck-border)] space-y-1">
        <button onClick={() => { logout(); router.push("/"); }} className="ck-sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "var(--ck-bg)" }}>
      {/* Desktop Sidebar */}
      <aside className="ck-sidebar hidden md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="ck-sidebar relative z-10 h-full">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--ck-border)]" style={{ background: "var(--ck-bg-secondary)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-[var(--ck-border)] transition">
              <Menu className="w-5 h-5" style={{ color: "var(--ck-text-secondary)" }} />
            </button>
            <div className="hidden md:block">
              <h2 className="text-sm font-medium" style={{ color: "var(--ck-text-secondary)" }}>
                {filteredNav.find((n) => n.href === pathname)?.label || "Dashboard"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/notifications" className="relative p-2 rounded-lg hover:bg-[var(--ck-border)] transition">
              <Bell className="w-5 h-5" style={{ color: "var(--ck-text-secondary)" }} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-6 lg:p-8">
          {children}
        </motion.div>
      </main>
    </div>
  );
}

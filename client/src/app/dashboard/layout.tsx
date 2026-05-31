"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, Role } from "@/lib/auth-context";
import { api, SERVER_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, LayoutDashboard, Calendar, Users, Award,
  FileCheck, BarChart3, CheckSquare, LogOut,
  ChevronLeft, ChevronRight, ClipboardList, Bell, Menu, X, UsersRound,
  User, Settings
} from "lucide-react";
import { DefaultAvatar } from "@/components/default-avatar";

interface NavItem { label: string; href: string; icon: React.ReactNode; roles?: Role[]; }

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Events", href: "/dashboard/events", icon: <Calendar className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR", "TECH", "CONTENT", "SOCIAL_MEDIA"] },
  { label: "Teams", href: "/dashboard/teams", icon: <UsersRound className="w-5 h-5" /> },
  { label: "Attendance", href: "/dashboard/attendance", icon: <CheckSquare className="w-5 h-5" /> },
  { label: "Certificates", href: "/dashboard/certificates", icon: <FileCheck className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR", "TECH", "SOCIAL_MEDIA"] },
  { label: "Approvals", href: "/dashboard/approvals", icon: <ClipboardList className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR", "TECH", "CONTENT", "SOCIAL_MEDIA"] },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: <Award className="w-5 h-5" /> },
  { label: "Users", href: "/dashboard/users", icon: <Users className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR"] },
  { label: "Analytics", href: "/dashboard/analytics", icon: <BarChart3 className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR"] },
  { label: "Landing CMS", href: "/dashboard/landing-management", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR"] },
  { label: "My Certificates", href: "/dashboard/my-certificates", icon: <Award className="w-5 h-5" /> },
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
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  // Body scroll lock when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("drawer-open");
    } else {
      document.body.classList.remove("drawer-open");
    }
    return () => document.body.classList.remove("drawer-open");
  }, [mobileOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 border-3 border-red-500/30 border-t-red-500 rounded-full animate-spin shadow-[0_0_15px_rgba(220,38,38,0.3)]" />
      </div>
    );
  }

  // Show pending approval screen for unapproved users (except guest role)
  if (!user.isApproved && user.role !== "GUEST") {
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

  // Sidebar navigation content — shared between desktop and mobile
  const SidebarNav = ({ collapsed, showCollapseBtn, isMobile }: { collapsed?: boolean; showCollapseBtn?: boolean; isMobile?: boolean }) => (
    <>
      {/* Logo / Brand */}
      <div className="p-5 border-b border-red-900/20 flex items-center justify-between relative">
        <Link href="/dashboard" className="flex items-center gap-3 group min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)] group-hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] transition-all">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && <span className="font-bold text-lg font-mono tracking-tighter uppercase truncate" style={{ color: "var(--ck-text)" }}>CYBERKAVACH</span>}
        </Link>
        {showCollapseBtn && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="shrink-0 w-7 h-7 rounded-md border border-red-900/30 bg-black/60 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/40 transition-all group/btn"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-red-400 group-hover/btn:text-red-300 transition-colors" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-red-400 group-hover/btn:text-red-300 transition-colors" />
            )}
          </button>
        )}
        {/* Close button — mobile only */}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ck-drawer-close"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`ck-sidebar-link text-[13px] tracking-wide ${isActive ? "active" : ""} ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && isActive && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />}
            </Link>
          );
        })}
      </nav>

      {/* User profile section — at bottom */}
      <div className="px-3 pb-2">
        <Link
          href="/dashboard/profile"
          className={`flex items-center p-3 rounded-lg border border-red-900/10 bg-black/40 hover:border-red-500/20 transition-all duration-200 ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          {user.avatarUrl ? (
            <img src={`${SERVER_BASE_URL}${user.avatarUrl}`} alt="Avatar" className="w-9 h-9 shrink-0 rounded-lg object-cover border border-red-900 shadow-[0_0_8px_rgba(220,38,38,0.3)]" />
          ) : (
            <DefaultAvatar className="w-9 h-9 shrink-0 border border-red-900" />
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--ck-text)" }}>{user.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--ck-text-muted)" }}>{ROLE_LABELS[user.role]}</p>
            </div>
          )}
        </Link>
      </div>

      {/* Sign out */}
      <div className="p-3 border-t border-[var(--ck-border)]">
        <button onClick={() => { logout(); router.push("/"); }}
          className={`ck-sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${collapsed ? 'justify-center px-0' : ''}`}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "var(--ck-bg)" }}>
      {/* ── Desktop Sidebar (fixed, always visible ≥768px) ── */}
      <aside className={`ck-sidebar hidden md:flex ${isCollapsed ? 'ck-sidebar-collapsed' : ''}`}>
        <SidebarNav collapsed={isCollapsed} showCollapseBtn={true} />
      </aside>

      {/* ── Mobile Sidebar Drawer (animated, <768px) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              key="drawer-backdrop"
              className="ck-drawer-backdrop md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer panel */}
            <motion.aside
              key="drawer-panel"
              className="ck-drawer md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <SidebarNav collapsed={false} isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-[var(--ck-border)] sticky top-0 z-30" style={{ background: "var(--ck-bg-secondary)", height: "var(--ck-topbar-height)" }}>
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--ck-border)] transition"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" style={{ color: "var(--ck-text-secondary)" }} />
            </button>
            {/* Page title — desktop */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--ck-text-muted)" }}>Dashboard</span>
              <ChevronRight className="w-3 h-3" style={{ color: "var(--ck-text-muted)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--ck-text)" }}>
                {filteredNav.find((n) => n.href === pathname)?.label || "Overview"}
              </h2>
            </div>
            {/* Page title — mobile */}
            <h2 className="md:hidden text-sm font-bold font-mono uppercase tracking-wider" style={{ color: "var(--ck-text)" }}>
              {filteredNav.find((n) => n.href === pathname)?.label || "Dashboard"}
            </h2>
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

        {/* Page content with responsive padding */}
        <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-4 sm:p-6 lg:p-8">
          {children}
        </motion.div>
      </main>
    </div>
  );
}

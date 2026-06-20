"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth, Role } from "@/lib/auth-context";
import { api, getFileUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, LayoutDashboard, Calendar, Users, Award,
  FileCheck, BarChart3, CheckSquare, LogOut,
  ChevronLeft, ChevronRight, ClipboardList, Bell, Menu, X, UsersRound,
  User, Settings, Check, CheckCheck, Terminal, Mail, MessageSquare, BookOpen, RotateCw
} from "lucide-react";
import { DefaultAvatar } from "@/components/default-avatar";
import { useThemeBranding } from "@/components/ThemeProvider";
import { CyberKavachLogo } from "@/components/CyberKavachLogo";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NavItem { label: string; href: string; icon: React.ReactNode; roles?: Role[]; }

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "AI Chatbot", href: "/dashboard/chatbot", icon: <MessageSquare className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR", "TECH", "SOCIAL_MEDIA"] },
  { label: "Notebook", href: "/dashboard/notebook", icon: <BookOpen className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR", "TECH", "SOCIAL_MEDIA"] },
  { label: "Events", href: "/dashboard/events", icon: <Calendar className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR", "TECH", "CONTENT", "SOCIAL_MEDIA"] },
  { label: "Teams", href: "/dashboard/teams", icon: <UsersRound className="w-5 h-5" /> },
  { label: "Attendance", href: "/dashboard/attendance", icon: <CheckSquare className="w-5 h-5" /> },
  { label: "Certificates", href: "/dashboard/certificates", icon: <FileCheck className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR", "TECH", "SOCIAL_MEDIA"] },
  { label: "Approvals", href: "/dashboard/approvals", icon: <ClipboardList className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR", "TECH", "CONTENT", "SOCIAL_MEDIA"] },
  { label: "Social Drafts", href: "/dashboard/social-drafts", icon: <Terminal className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR", "TECH", "SOCIAL_MEDIA"] },
  { label: "Newsletters", href: "/dashboard/newsletters", icon: <Mail className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR", "TECH", "CONTENT"] },
  { label: "Leaderboard", href: "/dashboard/leaderboard", icon: <Award className="w-5 h-5" /> },
  { label: "Users", href: "/dashboard/users", icon: <Users className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR"] },
  { label: "Analytics", href: "/dashboard/analytics", icon: <BarChart3 className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR"] },
  { label: "Landing CMS", href: "/dashboard/landing-management", icon: <LayoutDashboard className="w-5 h-5" />, roles: ["FACULTY", "STUDENT_COORDINATOR"] },
  { label: "My Certificates", href: "/dashboard/my-certificates", icon: <Award className="w-5 h-5" /> },
  { label: "Profile", href: "/dashboard/profile", icon: <User className="w-5 h-5" /> },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings className="w-5 h-5" />, roles: ["FACULTY"] },
];

const ROLE_COLORS: Record<Role, string> = {
  FACULTY: "from-violet-600 to-indigo-500",
  STUDENT_COORDINATOR: "from-fuchsia-600 to-purple-500",
  TECH: "from-cyan-600 to-blue-500",
  CONTENT: "from-pink-600 to-rose-500",
  SOCIAL_MEDIA: "from-amber-600 to-yellow-500",
  MEMBER: "from-zinc-550 to-slate-400",
  GUEST: "from-zinc-800 to-zinc-700",
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
  const { club } = useThemeBranding();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [disablePopups, setDisablePopups] = useState(false);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ck_disable_popups");
      if (stored === "true") {
        setDisablePopups(true);
      }
    }
  }, []);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const handleTogglePopups = (checked: boolean) => {
    setDisablePopups(checked);
    localStorage.setItem("ck_disable_popups", checked ? "true" : "false");
  };

  const handleToastRedirect = () => {
    router.push("/dashboard/notifications");
    setActiveToast(null);
  };

  const handleMarkToastRead = async (id: string) => {
    try {
      await api(`/notifications/${id}/read`, { method: "PATCH", token: token || undefined });
      setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setActiveToast(null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) router.push("/");
  }, [user, isLoading, router]);

  // Fetch unread notifications list & poll for real-time updates
  useEffect(() => {
    if (!token) return;
    
    const fetchNotifications = async () => {
      try {
        const data = await api<{ notifications: Notification[] }>("/notifications", { token });
        const unread = data.notifications.filter((n) => !n.isRead);
        setUnreadNotifications(unread);
        setUnreadCount(unread.length);
        
        // Show bottom-right popup on first load if notifications exist and not disabled
        if (unread.length > 0 && !sessionStorage.getItem("ck_notified")) {
          const storedDisable = localStorage.getItem("ck_disable_popups") === "true";
          if (!storedDisable && unread[0]) {
            setActiveToast(unread[0]);
          }
          sessionStorage.setItem("ck_notified", "true");
        }
      } catch { /* ignore */ }
    };
    
    fetchNotifications();
    
    // Set up polling interval to get new ones
    const interval = setInterval(async () => {
      try {
        const data = await api<{ notifications: Notification[] }>("/notifications", { token });
        const unread = data.notifications.filter((n) => !n.isRead);
        setUnreadNotifications((prev) => {
          // If there are new unread notifications that were not in prev, trigger active toast!
          const prevIds = new Set(prev.map(p => p.id));
          const newNotifs = unread.filter(u => !prevIds.has(u.id));
          const storedDisable = localStorage.getItem("ck_disable_popups") === "true";
          if (newNotifs.length > 0 && !storedDisable) {
            setActiveToast(newNotifs[0]);
          }
          return unread;
        });
        setUnreadCount(unread.length);
      } catch { /* ignore */ }
    }, 30000);

    return () => clearInterval(interval);
  }, [token]);

  const markNotificationRead = async (id: string) => {
    try {
      await api(`/notifications/${id}/read`, { method: "PATCH", token: token || undefined });
      setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await api("/notifications/read-all", { method: "PATCH", token: token || undefined });
      setUnreadNotifications([]);
      setUnreadCount(0);
      setShowNotificationModal(false);
    } catch (err) {
      console.error(err);
    }
  };

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
      <div className={`border-b border-[#1A1E26] flex relative transition-all duration-200 ${collapsed ? "flex-col items-center justify-center py-4 px-2 gap-3" : "p-5 items-center justify-between"}`}>
        <Link href="/dashboard" className="group min-w-0 flex items-center">
          <CyberKavachLogo collapsed={collapsed} animateDrawing={false} />
        </Link>
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
              <div className="ck-sidebar-icon-container">
                {item.icon}
              </div>
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && isActive && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#CCFF00", boxShadow: "0 0 8px rgba(204,255,0,0.8)" }} />}
            </Link>
          );
        })}
      </nav>

      {/* User profile section — at bottom */}
      <div className="px-3 pb-2">
        <Link
          href="/dashboard/profile"
          className={`flex items-center p-3 rounded-xl border border-[#1A1E26] bg-[#080A0F] hover:border-[rgba(204,255,0,0.2)] transition-all duration-200 ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          {user.avatarUrl ? (
            <img src={getFileUrl(user.avatarUrl)} alt="Avatar" className="w-9 h-9 shrink-0 rounded-lg object-cover border border-[#1A1E26]" />
          ) : (
            <DefaultAvatar className="w-9 h-9 shrink-0 border border-[#1A1E26]" />
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "#F0F4FF", fontFamily: "'Space Grotesk', sans-serif" }}>{user.name}</p>
              <p className="text-[10px] truncate font-mono" style={{ color: "rgba(204,255,0,0.6)" }}>{ROLE_LABELS[user.role]}</p>
            </div>
          )}
        </Link>
      </div>

      {/* Sign out */}
      <div className="p-3 border-t border-[#1A1E26]">
        <button onClick={() => { logout(); router.push("/"); }}
          className={`ck-sidebar-link w-full hover:bg-[rgba(255,0,60,0.06)] ${collapsed ? 'justify-center px-0' : ''}`}
          style={{ color: "#FF003C" }}
          title={collapsed ? "Sign Out" : undefined}
        >
          <div className="ck-sidebar-icon-container">
            <LogOut className="w-5 h-5" />
          </div>
          {!collapsed && <span className="font-mono text-[10px] uppercase tracking-widest">Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "var(--ck-bg-gradient, var(--ck-bg))" }}>
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


            {/* Sidebar Collapse Toggle Button (Desktop only) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex shrink-0 w-8 h-8 rounded-lg border border-[var(--ck-border)] bg-[#080A0F] items-center justify-center hover:border-[rgba(204,255,0,0.3)] transition-all cursor-pointer"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-[#8892A4] hover:text-[#CCFF00] transition-colors" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-[#8892A4] hover:text-[#CCFF00] transition-colors" />
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="shrink-0 w-8 h-8 rounded-lg border border-[var(--ck-border)] bg-[#080A0F] flex items-center justify-center hover:border-[rgba(204,255,0,0.3)] transition-all cursor-pointer"
              title="Refresh page contents"
            >
              <RotateCw className="w-4 h-4 text-[#8892A4] hover:text-[#CCFF00] transition-colors" />
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
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setShowNotificationModal(prev => !prev)} 
              className="relative p-2 rounded-lg hover:bg-[var(--ck-border)] transition cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" style={{ color: "#8892A4" }} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 text-black text-[9px] font-black rounded-full flex items-center justify-center" style={{ background: "#CCFF00", boxShadow: "0 0 8px rgba(204,255,0,0.6)" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            <AnimatePresence>
              {showNotificationModal && (
                <>
                  {/* Transparent click detector backdrop */}
                  <div
                    onClick={() => setShowNotificationModal(false)}
                    className="fixed inset-0 z-40"
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 flex flex-col shadow-2xl rounded-xl overflow-hidden border"
                    style={{
                      background: "rgba(8,10,15,0.97)",
                      borderColor: "rgba(204,255,0,0.2)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                    }}
                  >
                    {/* Header lime bar */}
                    <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, transparent, #CCFF00, transparent)" }} />
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-[#1A1E26] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#CCFF00" }} />
                        <span className="text-[10px] uppercase tracking-widest font-bold font-mono" style={{ color: "#CCFF00" }}>
                          NOTIFICATIONS
                        </span>
                      </div>
                      <button
                        onClick={() => setShowNotificationModal(false)}
                        className="w-6 h-6 rounded-md border border-[#1A1E26] flex items-center justify-center text-[#4B5563] hover:text-white hover:border-[rgba(255,0,60,0.3)] transition-all cursor-pointer"
                        aria-label="Close feed"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Action bar if there are unread notifications */}
                    {unreadNotifications.length > 0 && (
                      <div className="px-4 py-2 border-b border-[#1A1E26] flex justify-between items-center" style={{ background: "rgba(204,255,0,0.03)" }}>
                        <span className="text-[9px] text-[#4B5563] uppercase tracking-wider font-mono">
                          {unreadNotifications.length} UNREAD
                        </span>
                        <button
                          onClick={markAllNotificationsRead}
                          className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold font-mono hover:underline transition-all cursor-pointer"
                          style={{ color: "#CCFF00" }}
                        >
                          <CheckCheck className="w-3 h-3" /> MARK ALL READ
                        </button>
                      </div>
                    )}

                    {/* Feed Content */}
                    <div className="max-h-[320px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
                      <AnimatePresence initial={false}>
                        {unreadNotifications.length > 0 ? (
                          unreadNotifications.map((notif) => (
                            <motion.div
                              key={notif.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: 50, transition: { duration: 0.15 } }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 rounded-xl border border-[#1A1E26] hover:border-[rgba(204,255,0,0.15)] transition-all flex gap-3 relative group overflow-hidden bg-[#0D0F14]">
                                <div className="absolute top-0 bottom-0 left-0 w-[2px]" style={{ background: "#CCFF00", boxShadow: "0 0 6px rgba(204,255,0,0.6)" }} />

                                <div className="flex-1 min-w-0 pl-1">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <span className="font-semibold text-xs text-white tracking-wide" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                      {notif.title}
                                    </span>
                                    <span className="text-[9px] text-[#4B5563] shrink-0 whitespace-nowrap mt-0.5 font-mono">
                                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#8892A4] leading-relaxed" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                    {notif.message}
                                  </p>
                                </div>

                                <div className="flex flex-col justify-center shrink-0">
                                  <button
                                    onClick={() => markNotificationRead(notif.id)}
                                    className="p-1.5 rounded-lg border border-[#1A1E26] hover:border-[rgba(204,255,0,0.3)] transition-all cursor-pointer"
                                    style={{ color: "#CCFF00" }}
                                    title="Mark as read"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          /* Secure Matrix Empty State */
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className="py-8 flex flex-col items-center justify-center text-center px-4 select-none"
                          >
                            <div className="relative mb-3">
                              <div className="absolute -inset-1.5 bg-cyan-500/10 rounded-full blur-lg animate-pulse" />
                              <div className="relative w-12 h-12 rounded-full border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-center text-cyan-550/70">
                                <Shield className="w-6 h-6" />
                              </div>
                            </div>
                            <h4 className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold mb-1">
                              Secure Matrix Active
                            </h4>
                            <p className="text-[11px] text-zinc-500 max-w-[200px] leading-relaxed">
                              All feeds verified. Zero unacknowledged system broadcasts detected.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Right Slide-in toast notification popup */}
        <AnimatePresence>
          {activeToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 20, x: 20 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 160, damping: 20 }}
              className="fixed bottom-5 right-5 z-[60] w-72 sm:w-80 rounded-2xl overflow-hidden border shadow-2xl"
              style={{ background: "rgba(8,10,15,0.97)", borderColor: "rgba(204,255,0,0.25)", borderLeft: "3px solid #CCFF00" }}
            >
              {/* Top glow bar */}
              <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #CCFF00, transparent)" }} />

              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5" style={{ color: "#CCFF00" }} />
                    <span className="text-[9px] uppercase tracking-widest font-bold font-mono" style={{ color: "#CCFF00" }}>NEW NOTIFICATION</span>
                  </div>
                  <button onClick={() => setActiveToast(null)} className="w-5 h-5 flex items-center justify-center text-[#4B5563] hover:text-white transition">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="cursor-pointer" onClick={handleToastRedirect}>
                  <h4 className="font-bold text-sm text-white mb-1 hover:text-[#CCFF00] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {activeToast.title}
                  </h4>
                  <p className="text-[11px] text-[#8892A4] leading-relaxed line-clamp-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {activeToast.message}
                  </p>
                </div>
                
                <div className="flex items-center justify-between border-t border-[#1A1E26] pt-3">
                  <button
                    onClick={() => handleMarkToastRead(activeToast.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1A1E26] text-[9px] font-bold font-mono uppercase tracking-wider transition-all hover:border-[rgba(204,255,0,0.3)] cursor-pointer"
                    style={{ color: "#CCFF00" }}
                  >
                    <Check className="w-3 h-3" /> MARK READ
                  </button>
                  
                  <label className="flex items-center gap-1.5 text-[9px] text-[#4B5563] hover:text-[#8892A4] cursor-pointer select-none font-mono uppercase">
                    <input
                      type="checkbox"
                      checked={disablePopups}
                      onChange={(e) => handleTogglePopups(e.target.checked)}
                      className="rounded border-[#1A1E26] bg-black w-3 h-3 cursor-pointer"
                      style={{ accentColor: "#CCFF00" }}
                    />
                    DISABLE
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page content with responsive padding */}
        <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-4 sm:p-6 lg:p-8">
          {children}
        </motion.div>
      </main>
    </div>
  );
}

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
  User, Settings, Check, CheckCheck, Terminal
} from "lucide-react";
import { DefaultAvatar } from "@/components/default-avatar";

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
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

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
        
        // Show the pop-out modal on first load of the dashboard in this session
        if (unread.length > 0 && !sessionStorage.getItem("ck_notified")) {
          setShowNotificationModal(true);
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
          // If there are new unread notifications that were not in prev, we trigger the modal!
          const prevIds = new Set(prev.map(p => p.id));
          const hasNew = unread.some(u => !prevIds.has(u.id));
          if (hasNew) {
            setShowNotificationModal(true);
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
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setShowNotificationModal(prev => !prev)} 
              className="relative p-2 rounded-lg hover:bg-[var(--ck-border)] transition cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" style={{ color: "var(--ck-text-secondary)" }} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.6)]">
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
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 ck-glass z-50 flex flex-col shadow-2xl border border-red-500/20 rounded-xl overflow-hidden"
                    style={{
                      background: "rgba(6, 6, 6, 0.95)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                    }}
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-red-500/15 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-red-500 animate-pulse" />
                        <span className="text-xs uppercase tracking-widest text-red-400 font-bold">
                          System Broadcast Feed
                        </span>
                      </div>
                      <button
                        onClick={() => setShowNotificationModal(false)}
                        className="p-1 rounded-md border border-red-950/40 bg-black/40 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                        aria-label="Close feed"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Action bar if there are unread notifications */}
                    {unreadNotifications.length > 0 && (
                      <div className="px-4 py-2 bg-red-950/10 border-b border-red-950/25 flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                          Unread Batch: {unreadNotifications.length}
                        </span>
                        <button
                          onClick={markAllNotificationsRead}
                          className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-red-400 hover:text-red-300 hover:underline transition-all cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Acknowledge All
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
                              <div className="p-3 rounded-lg bg-black/60 border border-red-950/40 hover:border-red-500/30 transition-all flex gap-3 relative group overflow-hidden">
                                {/* Pulse indicator on the left side of notification */}
                                <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <span className="font-semibold text-xs text-zinc-200 tracking-wide">
                                      {notif.title}
                                    </span>
                                    <span className="text-[9px] text-zinc-500 shrink-0 whitespace-nowrap mt-0.5">
                                      {new Date(notif.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                                    {notif.message}
                                  </p>
                                </div>

                                <div className="flex flex-col justify-center shrink-0">
                                  <button
                                    onClick={() => markNotificationRead(notif.id)}
                                    className="p-1 rounded bg-red-950/30 border border-red-950/60 hover:bg-red-500/20 hover:border-red-500/40 text-red-400 transition-all cursor-pointer"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3.5 h-3.5" />
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
                              <div className="absolute -inset-1.5 bg-red-500/10 rounded-full blur-lg animate-pulse" />
                              <div className="relative w-12 h-12 rounded-full border border-red-500/30 bg-red-950/20 flex items-center justify-center text-red-500/70">
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

        {/* Page content with responsive padding */}
        <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-4 sm:p-6 lg:p-8">
          {children}
        </motion.div>
      </main>

    </div>
  );
}

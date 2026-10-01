"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BookOpen, CalendarCheck2, CalendarDays, ChevronDown, CircleDollarSign, FileText, GraduationCap, LayoutDashboard, LogOut, Menu, Search, ShieldCheck, UserRound, Users, X } from "lucide-react";
import { canAccessRoute, getDashboardPath, type UserSession } from "@/lib/auth";
import { fetchCsrfToken } from "@/lib/csrf";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const navItems = {
  student: [
    { label: "Overview", href: "/dashboard/student", icon: LayoutDashboard },
    { label: "My courses", href: "/dashboard/student/results", icon: BookOpen },
    { label: "Timetable", href: "/dashboard/student/timetable", icon: CalendarDays },
    { label: "Attendance", href: "/dashboard/student/attendance", icon: CalendarCheck2 },
    { label: "Finances", href: "/dashboard/student/fees", icon: CircleDollarSign },
    { label: "Transcript", href: "/dashboard/student/transcript", icon: FileText },
  ],
  lecturer: [
    { label: "Overview", href: "/dashboard/lecturer", icon: LayoutDashboard },
    { label: "Courses", href: "/dashboard/lecturer/courses", icon: BookOpen },
    { label: "Attendance", href: "/dashboard/lecturer/attendance", icon: CalendarCheck2 },
    { label: "Results", href: "/dashboard/lecturer/results", icon: GraduationCap },
    { label: "Timetable", href: "/dashboard/lecturer/timetable", icon: CalendarDays },
  ],
  admin: [
    { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Courses", href: "/dashboard/admin/courses", icon: BookOpen },
    { label: "Attendance", href: "/dashboard/admin/attendance", icon: CalendarCheck2 },
    { label: "Timetable", href: "/dashboard/admin/timetable", icon: CalendarDays },
    { label: "Finance", href: "/dashboard/admin/fees", icon: CircleDollarSign },
    { label: "Users", href: "/dashboard/admin/users", icon: Users },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
      if (event.key === "Escape") { setSearchOpen(false); setMenuOpen(false); setProfileOpen(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const stored = localStorage.getItem("portal_user");
        if (!stored) { router.replace("/login"); return; }
        const parsed = JSON.parse(stored) as UserSession;
        setUser(parsed);
        const dashboardPath = getDashboardPath(parsed.role);
        if (pathname === "/dashboard" || !canAccessRoute(parsed.role, pathname)) { router.replace(dashboardPath); return; }
        const response = await fetch(`${API_BASE}/v1/auth/me`, { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user as UserSession);
          localStorage.setItem("portal_user", JSON.stringify(data.user));
        } else if (response.status === 401) {
          // Only a confirmed unauthenticated response should end a local
          // session. A temporary Render proxy/API failure must not log users out.
          localStorage.removeItem("portal_user");
          localStorage.removeItem("portal_token");
          router.replace("/login");
        }
      } catch { /* retain a locally available session when the service is unavailable */ }
      finally { setLoading(false); }
    }
    loadUser();
  }, [pathname, router]);

  async function handleLogout() {
    try { const csrfToken = await fetchCsrfToken(); await fetch(`${API_BASE}/v1/auth/logout`, { method: "POST", credentials: "include", headers: { "X-CSRF-Token": csrfToken } }); } catch {}
    localStorage.removeItem("portal_user"); localStorage.removeItem("portal_token"); router.replace("/login");
  }

  if (loading || !user) return <div className="portal-loading"><span />Loading your workspace...</div>;
  const items = navItems[user.role === "student" ? "student" : user.role === "lecturer" ? "lecturer" : "admin"].filter((item) => canAccessRoute(user.role, item.href));
  const initial = user.fullName.charAt(0).toUpperCase();

  return <div className="portal-app">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className={`portal-sidebar ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
      <div className="portal-brand"><div className="portal-logo"><ShieldCheck size={21} /></div><div><strong>Campusly</strong><span>Student Portal</span></div><button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20} /></button></div>
      <nav className="portal-nav">{items.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} aria-current={pathname === item.href ? "page" : undefined}><item.icon size={19} /><span>{item.label}</span></Link>)}</nav>
      <div className="sidebar-bottom"><Link href="/dashboard/student/profile"><UserRound size={18} /><span>Profile</span></Link><button onClick={handleLogout}><LogOut size={18} /><span>Log out</span></button></div>
    </aside>
    {menuOpen && <button className="menu-scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
    <section className="portal-workspace">
      <header className="portal-topbar">
        <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
        <button className="universal-search" onClick={() => setSearchOpen(true)} aria-label="Search the portal"><Search size={18} /><span>Search courses, resources, and more</span><kbd>⌘ K</kbd></button>
        <div className="topbar-actions"><button className="icon-button" aria-label="Notifications"><Bell size={20} /><span className="notification-dot">3</span></button><div className="profile-wrap"><button className="profile-trigger" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen}><span className="avatar">{initial}</span><span className="profile-name">{user.fullName.split(" ")[0]}</span><ChevronDown size={16} /></button>{profileOpen && <div className="profile-menu"><Link href="/dashboard/student/profile" onClick={() => setProfileOpen(false)}><UserRound size={16} />Your profile</Link><button onClick={handleLogout}><LogOut size={16} />Log out</button></div>}</div></div>
      </header>
      <main id="main-content" className="portal-main">{children}</main>
    </section>
    <nav className="mobile-nav" aria-label="Mobile navigation">{items.slice(0, 5).map((item) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}><item.icon size={20} /><span>{item.label}</span></Link>)}</nav>
    {searchOpen && <div className="search-layer" role="dialog" aria-modal="true" aria-label="Search the portal"><button className="search-backdrop" onClick={() => setSearchOpen(false)} aria-label="Close search" /><div className="search-dialog"><div><Search size={20} /><input autoFocus placeholder="Search courses, forms, services..." aria-label="Search portal" /><kbd>ESC</kbd></div><p>Quick links</p><Link href="/dashboard/student/timetable" onClick={() => setSearchOpen(false)}><CalendarDays size={17} />Today&apos;s timetable</Link><Link href="/dashboard/student/transcript" onClick={() => setSearchOpen(false)}><FileText size={17} />Request a transcript</Link><Link href="/dashboard/student/fees" onClick={() => setSearchOpen(false)}><CircleDollarSign size={17} />Pay fees</Link></div></div>}
  </div>;
}

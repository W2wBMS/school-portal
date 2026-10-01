"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, BookOpen, CalendarCheck2, CalendarDays, ChevronRight, CircleDollarSign, FileText, GraduationCap, LayoutDashboard, LogOut, Menu, ShieldCheck, Sparkles, UserRound, Users, X } from 'lucide-react';
import { canAccessRoute, getDashboardPath, type UserSession } from '@/lib/auth';
import { fetchCsrfToken } from '@/lib/csrf';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [today, setToday] = useState('Today');
  const [serviceNotice, setServiceNotice] = useState('');

  useEffect(() => {
    setToday(new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()));
    async function loadUser() {
      try {
        const stored = localStorage.getItem('portal_user');
        if (!stored) {
          router.replace('/login');
          return;
        }

        const parsed = JSON.parse(stored) as UserSession;
        setUser(parsed);

        const dashboardPath = getDashboardPath(parsed.role);
        if (pathname === '/dashboard' && dashboardPath !== '/dashboard') {
          router.replace(dashboardPath);
        }

        if (!canAccessRoute(parsed.role, pathname)) {
          router.replace(dashboardPath);
          return;
        }

        const response = await fetch(`${API_BASE}/v1/auth/me`, {
          credentials: 'include',
        });

        if (response.status === 503) {
          setServiceNotice('The portal cannot reach its database right now. Your sign-in is still saved; try again shortly.');
          return;
        }
        if (!response.ok) {
          localStorage.removeItem('portal_user');
          localStorage.removeItem('portal_token');
          router.replace('/login');
          return;
        }

        const data = await response.json();
        setServiceNotice('');
        setUser(data.user as UserSession);
        localStorage.setItem('portal_user', JSON.stringify(data.user));
      } catch {
        setServiceNotice('The portal service is temporarily unavailable. Your sign-in is still saved; try again shortly.');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [pathname, router]);

  async function handleLogout() {
    try {
      const csrfToken = await fetchCsrfToken();
      await fetch(`${API_BASE}/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': csrfToken },
      });
    } catch {}

    localStorage.removeItem('portal_user');
    localStorage.removeItem('portal_token');
    router.replace('/login');
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eeeae2] text-[#123c46]">
        <div className="loading-pulse flex items-center gap-3 rounded-full border border-[#d9d4ca] bg-[#f7f4ee] px-5 py-3 text-sm font-semibold shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-[#d28e58]" /> Loading portal...
        </div>
      </div>
    );
  }

  const navItems = {
    student: [
      { label: 'Overview', href: '/dashboard/student', icon: LayoutDashboard },
      { label: 'Results', href: '/dashboard/student/results', icon: GraduationCap },
      { label: 'Transcript', href: '/dashboard/student/transcript', icon: FileText },
      { label: 'Attendance', href: '/dashboard/student/attendance', icon: CalendarCheck2 },
      { label: 'Timetable', href: '/dashboard/student/timetable', icon: CalendarDays },
      { label: 'Fees', href: '/dashboard/student/fees', icon: CircleDollarSign },
      { label: 'Payments', href: '/dashboard/student/payments', icon: CircleDollarSign },
      { label: 'Registration', href: '/dashboard/student/registration', icon: FileText },
      { label: 'Profile', href: '/dashboard/student/profile', icon: UserRound },
      { label: 'Support', href: '/dashboard/student/support', icon: Bell },
    ],
    lecturer: [
      { label: 'Overview', href: '/dashboard/lecturer', icon: LayoutDashboard },
      { label: 'Courses', href: '/dashboard/lecturer/courses', icon: BookOpen },
      { label: 'Attendance', href: '/dashboard/lecturer/attendance', icon: CalendarCheck2 },
      { label: 'Results', href: '/dashboard/lecturer/results', icon: GraduationCap },
      { label: 'Timetable', href: '/dashboard/lecturer/timetable', icon: CalendarDays },
    ],
    admin: [
      { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
      { label: 'Courses', href: '/dashboard/admin/courses', icon: BookOpen },
      { label: 'Attendance', href: '/dashboard/admin/attendance', icon: CalendarCheck2 },
      { label: 'Timetable', href: '/dashboard/admin/timetable', icon: CalendarDays },
      { label: 'Fees', href: '/dashboard/admin/fees', icon: CircleDollarSign },
      { label: 'Payments', href: '/dashboard/admin/payments', icon: CircleDollarSign },
      { label: 'Results', href: '/dashboard/admin/results', icon: GraduationCap },
      { label: 'Users', href: '/dashboard/admin/users', icon: Users },
      { label: 'Requests', href: '/dashboard/admin/requests', icon: Bell },
    ],
  };

  const roleNav = user.role === 'student'
    ? navItems.student
    : user.role === 'lecturer'
      ? navItems.lecturer
      : navItems.admin;
  const visibleNav = roleNav.filter((item) => canAccessRoute(user.role, item.href));
  const currentNav = visibleNav.find((item) => pathname === item.href);
  const pageLabel = currentNav?.label || 'Overview';

  return (
    <div className="min-h-screen px-3 py-3 sm:px-6 sm:py-6">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-[#123c46]">Skip to content</a>
      <div className="panel-shell dashboard-shell mx-auto max-w-[1440px] overflow-hidden rounded-[32px]">
        <header className="dashboard-header relative flex flex-col gap-4 border-b border-[#2c7768] bg-[#0d5a4d] px-5 py-5 text-white sm:px-7 md:flex-row md:items-center md:justify-between">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-20 [background-image:linear-gradient(120deg,transparent_45%,#d6b46a_45%,#d6b46a_47%,transparent_47%),linear-gradient(60deg,transparent_48%,#fff_48%,#fff_49%,transparent_49%)]" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d6b46a] text-[#123d35] shadow-lg shadow-black/10"><ShieldCheck size={23} /></div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#dfece7]">Student Portal</p>
              <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Regent University College of Science and Technology</h1>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">{user.fullName}</div>
              <div className="text-xs capitalize text-[#c8dfd5]">{user.role.replaceAll('_', ' ')}</div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4efe7] font-bold text-[#123d35]">{user.fullName.charAt(0).toUpperCase()}</div>
            <button onClick={() => setMenuOpen((open) => !open)} className="rounded-xl bg-white/10 p-2.5 sm:hidden" aria-label="Toggle navigation" aria-expanded={menuOpen}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
            <button
              onClick={handleLogout}
              className="hidden items-center gap-2 rounded-xl bg-[#f4efe7] px-4 py-2.5 text-sm font-semibold text-[#123d35] transition hover:bg-white sm:flex"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        <div className="grid gap-0 lg:grid-cols-[232px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)_256px]">
          <aside className={`dashboard-sidebar ${menuOpen ? 'block' : 'hidden'} rounded-[26px] bg-[#f5faf7] p-4 ring-1 ring-[#dfe7e1] lg:block`}>
            <div className="mb-6 rounded-2xl bg-white p-4 ring-1 ring-[#dfe7e1] shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e4f2ea] text-[#0d5a4d]"><ShieldCheck size={19} /></div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.17em] text-[#61737d]">Signed in as</div>
                  <div className="mt-1 text-sm font-bold capitalize text-[#11222d]">{user.role.replaceAll('_', ' ')}</div>
                </div>
              </div>
            </div>

            <div className="mb-5 px-2"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9aa9a5]">Workspace</p><p className="mt-2 text-sm leading-5 text-[#5f716e]">Everything you need to keep academic work moving.</p></div>

            <nav className="space-y-2">
              {visibleNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${
                    pathname === item.href ? 'bg-[#0d5a4d] text-white shadow-[0_10px_20px_rgba(13,90,77,0.18)]' : 'text-[#273642] hover:bg-white hover:text-[#0d5a4d]'
                  }`}
                >
                  <span className="flex items-center gap-3"><item.icon size={17} />{item.label}</span>
                  <ChevronRight size={16} />
                </Link>
              ))}
            </nav>
            <button onClick={handleLogout} className="mt-8 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-[#b15348] transition hover:bg-white sm:hidden"><LogOut size={17} />Log out</button>
          </aside>

          <main id="main-content" className="dashboard-main min-w-0 space-y-6 p-4 sm:p-6">
            <div className="dashboard-content flex items-center justify-between gap-4 px-1">
              <div>
                <p className="muted-kicker">{user.role.replaceAll('_', ' ')} workspace</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#11222d] sm:text-3xl">{pageLabel}</h2>
              </div>
              <div className="hidden rounded-full bg-[#e6f1e9] px-3 py-1.5 text-xs font-bold text-[#0d5a4d] sm:block">Account active</div>
            </div>
            {serviceNotice ? <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{serviceNotice}</div> : null}
            {children}
          </main>

          <aside className="context-panel hidden p-5 xl:block">
            <div className="sticky top-6 space-y-5">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-[#dfe8e4]">
                <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#899a96]">Your account</p><UserRound size={16} className="text-[#0d5a4d]" /></div>
                <div className="mt-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f1ed] font-bold text-[#0d5a4d]">{user.fullName.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-[#17272a]">{user.fullName}</p><p className="truncate text-xs capitalize text-[#718083]">{user.role.replaceAll('_', ' ')}</p></div></div>
              </div>
              <div className="rounded-2xl bg-[#e5f1ed] p-4 text-[#0d5a4d]"><div className="flex items-center gap-2"><Sparkles size={16} /><span className="text-xs font-bold uppercase tracking-[0.16em]">Portal pulse</span></div><p className="mt-3 text-sm font-semibold">Your workspace is ready.</p><p className="mt-1 text-xs leading-5 text-[#4c756c]">Use the navigation to move between your academic services.</p></div>
              <div className="rounded-2xl bg-white p-4 ring-1 ring-[#dfe8e4]"><div className="flex items-center gap-2 text-[#0d5a4d]"><CalendarDays size={16} /><span className="text-xs font-bold uppercase tracking-[0.16em]">Today</span></div><p className="mt-3 text-sm font-bold text-[#17272a]">{today}</p><p className="mt-1 text-xs text-[#718083]">Keep your academic record current.</p></div>
              <div className="border-t border-[#dfe8e4] pt-4 text-xs leading-5 text-[#899a96]">Need help? Open Support from your navigation.</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

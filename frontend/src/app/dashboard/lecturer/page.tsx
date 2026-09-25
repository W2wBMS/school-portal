"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, BookOpen, CalendarCheck2, ClipboardList, Users } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
type Course = { _id: string; code: string; title: string; credits: number; semester: string };
type Attendance = { _id: string; percentage: number; studentId?: { fullName?: string }; courseId?: { code?: string } };

export default function LecturerDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      const headers = { Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}` };
      const [coursesResponse, attendanceResponse] = await Promise.all([
        fetch(`${API_BASE}/portal/courses`, { credentials: 'include', headers }),
        fetch(`${API_BASE}/portal/attendance`, { credentials: 'include', headers }),
      ]);
      if (!coursesResponse.ok || !attendanceResponse.ok) throw new Error('Unable to load teaching workspace');
      setCourses((await coursesResponse.json()).courses || []);
      setAttendance((await attendanceResponse.json()).attendance || []);
      setLoading(false);
    }
    loadDashboard().catch((reason) => { setError(reason instanceof Error ? reason.message : 'Unable to load teaching workspace'); setLoading(false); });
  }, []);

  const averageAttendance = attendance.length ? Math.round(attendance.reduce((sum, row) => sum + Number(row.percentage || 0), 0) / attendance.length) : 0;

  return (
    <div className="dashboard-page space-y-6">
      {loading && <div className="rounded-2xl bg-[#e5f1ed] p-4 text-sm font-semibold text-[#0d5a4d]">Loading your teaching workspace...</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      <div className="relative overflow-hidden rounded-[28px] bg-[#0d5a4d] p-6 text-white sm:p-8">
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[30px] border-[#d6b46a]/20" />
        <p className="relative text-xs uppercase tracking-[0.2em] text-[#dfece7]">Lecturer workspace / 01</p>
        <h2 className="relative mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Make every class count.</h2>
        <p className="relative mt-3 max-w-lg text-sm leading-6 text-[#dfece7]">Keep your teaching load, attendance records, and course activity in one calm working view.</p>
        <div className="relative mt-6 flex flex-wrap gap-3"><Link href="/dashboard/lecturer/courses" className="flex items-center gap-2 rounded-xl bg-[#f4efe7] px-4 py-3 text-sm font-bold text-[#123d35]">View courses <ArrowUpRight size={16} /></Link><Link href="/dashboard/lecturer/attendance" className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/20">Record attendance <CalendarCheck2 size={16} /></Link></div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[{ label: 'Assigned courses', value: courses.length, icon: BookOpen, tone: 'bg-[#e6f1e9] text-[#0d5a4d]' }, { label: 'Attendance entries', value: attendance.length, icon: ClipboardList, tone: 'bg-[#f6eddb] text-[#8a6a2f]' }, { label: 'Average attendance', value: `${averageAttendance}%`, icon: Users, tone: 'bg-[#e9eef1] text-[#38576a]' }].map((metric) => <div key={metric.label} className="rounded-[24px] bg-[#f8fafc] p-5 ring-1 ring-slate-200"><div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.tone}`}><metric.icon size={19} /></div><span className="text-xs font-semibold text-[#8a9899]">LIVE</span></div><div className="mt-5 text-3xl font-bold tracking-tight text-[#11222d]">{metric.value}</div><div className="mt-1 text-sm text-slate-500">{metric.label}</div></div>)}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#718183]">Teaching load</p><h3 className="mt-2 text-xl font-bold text-[#11222d]">Your active courses</h3></div><BookOpen className="text-[#0d5a4d]" size={22} /></div><div className="mt-5 space-y-3">{courses.slice(0, 4).map((course) => <div key={course._id} className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-slate-200"><div><div className="font-bold text-[#11222d]">{course.code}</div><div className="mt-1 text-sm text-slate-500">{course.title}</div></div><span className="rounded-full bg-[#e6f1e9] px-3 py-1 text-xs font-bold text-[#0d5a4d]">{course.credits} credits</span></div>)}{courses.length === 0 && <p className="text-sm text-slate-500">No courses have been assigned yet.</p>}</div></div>
        <div className="rounded-[28px] bg-[#17252b] p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b9d6c4]">Quick note</p><h3 className="mt-3 text-2xl font-bold">Attendance deserves a rhythm.</h3><p className="mt-3 text-sm leading-6 text-[#bfd0cb]">Keep records close to the classroom. A timely update gives students a clearer picture of their progress.</p><Link href="/dashboard/lecturer/attendance" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#d6b46a]">Open attendance register <ArrowUpRight size={16} /></Link></div>
      </div>
    </div>
  );
}

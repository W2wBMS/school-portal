"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarCheck2, CircleDollarSign, GraduationCap, UserRound } from 'lucide-react';
import { fetchStudentOverview, type StudentOverview } from '@/lib/portal';

export default function StudentDashboardPage() {
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStudentOverview();
      setOverview(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load your dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetchStudentOverview()
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load your dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="rounded-[28px] bg-[#f8fafc] p-8 ring-1 ring-slate-200"><div className="loading-pulse flex items-center gap-3 text-sm font-semibold text-[#0d5a4d]"><span className="h-2.5 w-2.5 rounded-full bg-[#d28e58]" /> Loading your academic overview...</div></div>;
  }

  if (error) {
    return <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-800"><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">Connection issue</p><h2 className="mt-2 text-2xl font-bold">Your overview could not load.</h2><p className="mt-2 max-w-lg text-sm leading-6">Your account is safe. The latest academic data is temporarily unavailable.</p><button onClick={loadData} className="mt-5 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Try again</button></div>;
  }

  const profile = overview?.profile || {};
  const attendance = overview?.attendance || [];
  const feeLedger = overview?.feeLedger || [];
  const averageAttendance = attendance.length ? Math.round(attendance.reduce((sum, row) => sum + Number(row.percentage || 0), 0) / attendance.length) : 0;

  return (
    <div className="dashboard-page space-y-6">
      <div className="student-hero relative overflow-hidden rounded-[28px] bg-[#0d5a4d] p-6 text-white sm:p-8">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[36px] border-[#d6b46a]/20" />
        <p className="relative text-xs uppercase tracking-[0.2em] text-[#dfece7]">Student overview / 01</p>
        <h2 className="relative mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Welcome, {profile.fullName || 'Student'}</h2>
        <p className="relative mt-3 max-w-lg text-sm leading-6 text-[#dfece7]">Your academic essentials, gathered in one place. Stay close to your results, attendance, and next payment.</p>
        <div className="relative mt-6 flex flex-wrap gap-3"><Link href="/dashboard/student/results" className="flex items-center gap-2 rounded-xl bg-[#f4efe7] px-4 py-3 text-sm font-bold text-[#123d35]">View results <ArrowUpRight size={16} /></Link><Link href="/dashboard/student/fees" className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/20">Fee statement <CircleDollarSign size={16} /></Link></div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[{ label: 'Current GPA', value: profile.cgpa ?? '—', icon: GraduationCap, tone: 'bg-[#e6f1e9] text-[#0d5a4d]' }, { label: 'Credits completed', value: profile.creditsCompleted ?? '—', icon: UserRound, tone: 'bg-[#e9eef1] text-[#38576a]' }, { label: 'Average attendance', value: `${averageAttendance}%`, icon: CalendarCheck2, tone: 'bg-[#f6eddb] text-[#8a6a2f]' }].map((metric) => <div key={metric.label} className="metric-card rounded-[24px] bg-[#f8fafc] p-5 ring-1 ring-slate-200"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.tone}`}><metric.icon size={19} /></div><div className="mt-5 text-3xl font-bold tracking-tight text-[#11222d]">{metric.value}</div><div className="mt-1 text-sm text-slate-500">{metric.label}</div></div>)}
      </div>

      <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
        <h3 className="text-xl font-bold text-[#11222d]">Academic profile</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div><span className="text-sm text-slate-500">Email</span><p className="mt-1 font-medium">{profile.email}</p></div>
          <div><span className="text-sm text-slate-500">Student ID</span><p className="mt-1 font-medium">{profile.studentId || 'N/A'}</p></div>
          <div><span className="text-sm text-slate-500">Department</span><p className="mt-1 font-medium">{profile.department || 'N/A'}</p></div>
          <div><span className="text-sm text-slate-500">Programme</span><p className="mt-1 font-medium">{profile.programme || 'N/A'}</p></div>
          <div><span className="text-sm text-slate-500">Hall of residence</span><p className="mt-1 font-medium">{profile.hallResidence || 'N/A'}</p></div>
          <div><span className="text-sm text-slate-500">Status</span><p className="mt-1 font-medium capitalize">{profile.status || 'registered'}</p></div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
          <h3 className="text-xl font-bold text-[#11222d]">Attendance</h3>
          <div className="mt-4 space-y-3">
            {attendance.length === 0 ? <p className="text-slate-500">No attendance records found.</p> : attendance.map((row: StudentOverview['attendance'][number], index: number) => (
              <div key={`${row.courseId?.code || 'attendance'}-${index}`} className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <div>
                  <div className="font-semibold text-[#11222d]">{row.courseId?.code || 'Course'}</div>
                  <div className="text-sm text-slate-500">{row.courseId?.title || 'Attendance record'}</div>
                </div>
                <div className="text-right font-bold text-[#0d5a4d]">{row.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
        <h3 className="text-xl font-bold text-[#11222d]">Fee ledger</h3>
        <div className="mt-4 space-y-3">
          {feeLedger.length === 0 ? <p className="text-slate-500">No fee records found.</p> : feeLedger.map((row: StudentOverview['feeLedger'][number], index: number) => (
            <div key={`${row.invoiceNumber}-${index}`} className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200">
              <div>
                <div className="font-semibold text-[#11222d]">{row.invoiceNumber}</div>
                <div className="text-sm text-slate-500">{row.semester}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-[#0d5a4d]">GH¢ {row.balance.toFixed(2)}</div>
                <div className="text-sm text-slate-500 capitalize">{row.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

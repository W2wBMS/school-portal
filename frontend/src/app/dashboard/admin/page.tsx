"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, BookOpen, CircleDollarSign, ShieldCheck, Users } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      const headers = { Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}` };
      const responses = await Promise.all([fetch(`${API_BASE}/users`, { credentials: 'include', headers }), fetch(`${API_BASE}/portal/courses`, { credentials: 'include', headers }), fetch(`${API_BASE}/portal/fees`, { credentials: 'include', headers })]);
      if (responses[0].ok) setUsers((await responses[0].json()).users || []);
      if (responses[1].ok) setCourses((await responses[1].json()).courses || []);
      if (responses[2].ok) setFees((await responses[2].json()).fees || []);
    }
    loadDashboard().catch(console.error);
  }, []);

  const outstanding = fees.reduce((sum, fee) => sum + Number(fee.balance || 0), 0);

  return (
    <div className="dashboard-page space-y-6">
      <div className="relative overflow-hidden rounded-[28px] bg-[#0d5a4d] p-6 text-white sm:p-8">
        <div className="absolute -bottom-28 -right-8 h-64 w-64 rounded-full border-[34px] border-[#d6b46a]/20" />
        <p className="relative text-xs uppercase tracking-[0.2em] text-[#dfece7]">Operations console / 01</p>
        <h2 className="relative mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">A clearer view of the institution.</h2>
        <p className="relative mt-3 max-w-xl text-sm leading-6 text-[#dfece7]">Monitor people, learning, and financial operations from one dependable control surface.</p>
        <div className="relative mt-6 flex flex-wrap gap-3"><Link href="/dashboard/admin/users" className="flex items-center gap-2 rounded-xl bg-[#f4efe7] px-4 py-3 text-sm font-bold text-[#123d35]">Manage users <ArrowUpRight size={16} /></Link><Link href="/dashboard/admin/courses" className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/20">Course catalogue <BookOpen size={16} /></Link></div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[{ label: 'Registered users', value: users.length, icon: Users, tone: 'bg-[#e6f1e9] text-[#0d5a4d]' }, { label: 'Active courses', value: courses.length, icon: BookOpen, tone: 'bg-[#e9eef1] text-[#38576a]' }, { label: 'Outstanding fees', value: `GH¢ ${outstanding.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: CircleDollarSign, tone: 'bg-[#f6eddb] text-[#8a6a2f]' }].map((metric) => <div key={metric.label} className="rounded-[24px] bg-[#f8fafc] p-5 ring-1 ring-slate-200"><div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.tone}`}><metric.icon size={19} /></div><span className="text-xs font-semibold text-[#8a9899]">LIVE</span></div><div className="mt-5 text-3xl font-bold tracking-tight text-[#11222d]">{metric.value}</div><div className="mt-1 text-sm text-slate-500">{metric.label}</div></div>)}
      </div>

      <div className="grid gap-6 lg:grid-cols-2"><div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#718183]">Control centre</p><h3 className="mt-2 text-xl font-bold text-[#11222d]">Daily operations</h3></div><ShieldCheck className="text-[#0d5a4d]" size={22} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Link href="/dashboard/admin/attendance" className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-[#0d5a4d]"><div className="font-bold text-[#11222d]">Attendance oversight</div><div className="mt-1 text-sm text-slate-500">Review class records and trends.</div></Link><Link href="/dashboard/admin/fees" className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-[#0d5a4d]"><div className="font-bold text-[#11222d]">Fee management</div><div className="mt-1 text-sm text-slate-500">Track balances and ledger entries.</div></Link></div></div><div className="rounded-[28px] bg-[#17252b] p-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b9d6c4]">System pulse</p><h3 className="mt-3 text-2xl font-bold">Everything in one place.</h3><p className="mt-3 text-sm leading-6 text-[#bfd0cb]">The portal keeps academic and administrative records close, current, and easy to act on.</p><div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#d6b46a]"><span className="h-2 w-2 rounded-full bg-[#d6b46a]" /> All services operational</div></div></div>
    </div>
  );
}

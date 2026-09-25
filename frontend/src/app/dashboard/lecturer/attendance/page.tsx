"use client";

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
type Attendance = { _id: string; percentage: number; studentId?: { fullName?: string; email?: string }; courseId?: { code?: string; title?: string } };

export default function LecturerAttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAttendance() {
      try {
        const response = await fetch(`${API_BASE}/portal/attendance`, {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAttendance(data.attendance || []);
        } else {
          throw new Error('Unable to load attendance records');
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to load attendance records');
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, []);

  return (
    <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="muted-kicker">Class operations</p><h2 className="mt-2 text-2xl font-bold text-[#11222d]">Attendance register</h2><p className="mt-2 text-sm text-slate-500">Review attendance for your assigned courses.</p></div><div className="rounded-2xl bg-[#e5f1ed] px-4 py-3 text-right"><span className="block text-xs text-[#4c756c]">Records</span><strong className="text-2xl text-[#0d5a4d]">{attendance.length}</strong></div></div>
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="mt-5 text-sm font-semibold text-[#0d5a4d]">Loading attendance...</div>}
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student or course" className="input-field mt-6" />
      <div className="mt-6 space-y-3">
        {attendance.filter((row) => `${row.studentId?.fullName || ''} ${row.courseId?.code || ''} ${row.courseId?.title || ''}`.toLowerCase().includes(query.toLowerCase())).length === 0 ? <p className="text-slate-500">No matching attendance records available.</p> : attendance.filter((row) => `${row.studentId?.fullName || ''} ${row.courseId?.code || ''} ${row.courseId?.title || ''}`.toLowerCase().includes(query.toLowerCase())).map((row) => (
          <div key={row._id} className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold text-[#11222d]">{row.studentId?.fullName || 'Student'} — {row.courseId?.code || 'Course'}</div>
              <div className="text-sm text-slate-500">{row.courseId?.title || 'Course title'}</div>
            </div>
            <div className="text-right font-bold text-[#0d5a4d]">{row.percentage}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

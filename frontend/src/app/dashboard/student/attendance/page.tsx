"use client";

import { useEffect, useState } from 'react';
import { fetchStudentOverview, type AttendanceRow } from '@/lib/portal';

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const overview = await fetchStudentOverview();
        setAttendance(overview.attendance || []);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to load attendance');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="muted-kicker">Academic progress</p><h2 className="mt-2 text-2xl font-bold text-[#11222d]">Attendance</h2><p className="mt-2 text-sm text-slate-500">Track your attendance by course.</p></div><div className="rounded-2xl bg-[#e5f1ed] px-4 py-3 text-right"><span className="block text-xs text-[#4c756c]">Courses tracked</span><strong className="text-2xl text-[#0d5a4d]">{attendance.length}</strong></div></div>
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="mt-5 text-sm font-semibold text-[#0d5a4d]">Loading attendance...</div>}
      <div className="mt-6 space-y-3">
        {attendance.length === 0 ? <p className="text-slate-500">No attendance data available.</p> : attendance.map((row, index) => (
          <div key={`${row.courseId?.code || 'attendance'}-${index}`} className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <div>
              <div className="font-semibold text-[#11222d]">{row.courseId?.code || 'Course'} — {row.courseId?.title || 'Attendance'}</div>
              <div className="text-sm text-slate-500">Current percentage</div>
            </div>
            <div className="text-right font-bold text-[#0d5a4d]">{row.percentage}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

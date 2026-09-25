"use client";

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
type Course = { _id: string; code: string; title: string; credits: number; department: string; semester: string; lecturerId?: { fullName?: string } };

export default function LecturerCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await fetch(`${API_BASE}/portal/courses`, {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
        } else {
          throw new Error('Unable to load assigned courses');
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to load assigned courses');
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  return (
    <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="muted-kicker">Teaching workspace</p><h2 className="mt-2 text-2xl font-bold text-[#11222d]">Assigned courses</h2><p className="mt-2 text-sm text-slate-500">Review your teaching load and course details.</p></div><div className="rounded-2xl bg-[#e5f1ed] px-4 py-3 text-right"><span className="block text-xs text-[#4c756c]">Courses</span><strong className="text-2xl text-[#0d5a4d]">{courses.length}</strong></div></div>
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="mt-5 text-sm font-semibold text-[#0d5a4d]">Loading courses...</div>}
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course code or title" className="input-field mt-6" />
      <div className="mt-6 space-y-3">
        {courses.filter((course) => `${course.code} ${course.title}`.toLowerCase().includes(query.toLowerCase())).length === 0 ? <p className="text-slate-500">No matching courses available.</p> : courses.filter((course) => `${course.code} ${course.title}`.toLowerCase().includes(query.toLowerCase())).map((course) => (
          <div key={course._id} className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold text-[#11222d]">{course.code} — {course.title}</div>
              <div className="text-sm text-slate-500">{course.department} • {course.semester}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-[#0d5a4d]">{course.credits} credits</div>
              <div className="text-sm text-slate-500">{course.lecturerId?.fullName || 'Unassigned'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

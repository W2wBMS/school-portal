"use client";

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
type Course = { _id: string; code: string; title: string; credits: number; department: string; semester: string; lecturerId?: { fullName?: string } };
type RosterStudent = { _id: string; fullName: string; email: string; studentId?: string; level?: string; programme?: string };
type RosterEntry = { student: RosterStudent };

export default function LecturerCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRosterCourse, setSelectedRosterCourse] = useState('');
  const [rosters, setRosters] = useState<Record<string, RosterEntry[]>>({});
  const [rosterLoading, setRosterLoading] = useState(false);

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

  async function toggleRoster(courseId: string) {
    if (selectedRosterCourse === courseId) {
      setSelectedRosterCourse('');
      return;
    }
    setSelectedRosterCourse(courseId);
    if (rosters[courseId]) return;
    setRosterLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/portal/courses/${courseId}/roster`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load class list');
      setRosters((current) => ({ ...current, [courseId]: data.roster || [] }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load class list');
    } finally {
      setRosterLoading(false);
    }
  }

  return (
    <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="muted-kicker">Teaching workspace</p><h2 className="mt-2 text-2xl font-bold text-[#11222d]">Assigned courses</h2><p className="mt-2 text-sm text-slate-500">Review your teaching load and course details.</p></div><div className="rounded-2xl bg-[#e5f1ed] px-4 py-3 text-right"><span className="block text-xs text-[#4c756c]">Courses</span><strong className="text-2xl text-[#0d5a4d]">{courses.length}</strong></div></div>
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="mt-5 text-sm font-semibold text-[#0d5a4d]">Loading courses...</div>}
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course code or title" className="input-field mt-6" />
      <div className="mt-6 space-y-3">
        {courses.filter((course) => `${course.code} ${course.title}`.toLowerCase().includes(query.toLowerCase())).length === 0 ? <p className="text-slate-500">No matching courses available.</p> : courses.filter((course) => `${course.code} ${course.title}`.toLowerCase().includes(query.toLowerCase())).map((course) => (
          <article key={course._id} className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-[#11222d]">{course.code} — {course.title}</div>
                <div className="text-sm text-slate-500">{course.department} • {course.semester}</div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="text-right">
                  <div className="font-bold text-[#0d5a4d]">{course.credits} credits</div>
                  <div className="text-sm text-slate-500">{course.lecturerId?.fullName || 'Unassigned'}</div>
                </div>
                <button onClick={() => toggleRoster(course._id)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#11222d]">{selectedRosterCourse === course._id ? 'Hide class list' : 'View class list'}</button>
              </div>
            </div>
            {selectedRosterCourse === course._id && <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-[#11222d]">Approved students</h3><span className="text-sm text-slate-500">{rosters[course._id]?.length || 0} students</span></div>
              {rosterLoading && !rosters[course._id] ? <p className="text-sm text-slate-500">Loading class list...</p> : rosters[course._id]?.length ? <div className="divide-y divide-slate-100">{rosters[course._id].map(({ student }) => <div key={student._id} className="grid gap-1 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_120px_1fr] sm:items-center"><span className="font-medium text-[#11222d]">{student.fullName}</span><span className="text-slate-600">{student.studentId || 'No student ID'}</span><span className="text-slate-500">{student.programme || student.email}{student.level ? ` · Level ${student.level}` : ''}</span></div>)}</div> : <p className="text-sm text-slate-500">No students have approved registration for this course.</p>}
            </div>}
          </article>
        ))}
      </div>
    </div>
  );
}

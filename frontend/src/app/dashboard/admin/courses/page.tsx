"use client";

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
type Course = { _id: string; code: string; title: string; credits: number; department: string; semester: string };

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({ code: '', title: '', credits: '3', department: 'Agronomy', semester: 'Semester 1' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}` };

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
        }
      } catch (reason) {
        setMessage(reason instanceof Error ? reason.message : 'Unable to load courses.');
      }
    }

    loadCourses();
  }, []);

  async function saveCourse(event: React.FormEvent) {
    event.preventDefault();
    const isEditing = Boolean(editingId && editingId !== 'new');
    const response = await fetch(`${API_BASE}/portal/courses${isEditing ? `/${editingId}` : ''}`, {
      method: isEditing ? 'PATCH' : 'POST', credentials: 'include', headers, body: JSON.stringify({ ...form, credits: Number(form.credits) }),
    });
    if (response.ok) {
      const data = await response.json();
      setCourses((current) => editingId ? current.map((course) => course._id === editingId ? data.course : course) : [data.course, ...current]);
      setForm({ code: '', title: '', credits: '3', department: 'Agronomy', semester: 'Semester 1' });
      setEditingId(null);
      setMessage('Course saved.');
    } else setMessage((await response.json()).message || 'Unable to save course.');
  }

  async function deleteCourse(id: string) {
    if (!window.confirm('Delete this course?')) return;
    const response = await fetch(`${API_BASE}/portal/courses/${id}`, { method: 'DELETE', credentials: 'include', headers });
    if (response.ok) setCourses((current) => current.filter((course) => course._id !== id));
  }

  return (
    <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><p className="muted-kicker">Academic operations</p><h2 className="mt-2 text-2xl font-bold text-[#11222d]">Course catalogue</h2><p className="mt-2 text-sm text-slate-500">Keep course offerings clear, current, and assignable.</p></div>
        <button onClick={() => setEditingId('new')} className="w-full rounded-lg bg-[#0d5a4d] px-4 py-2 text-sm font-semibold text-white sm:w-auto">Add course</button>
      </div>

      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course code or title" className="input-field mb-5" />

      {(editingId === 'new' || editingId) && <form onSubmit={saveCourse} className="mb-6 grid gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 md:grid-cols-5">
        {(['code', 'title', 'credits', 'department', 'semester'] as const).map((field) => <input key={field} required={field !== 'department' && field !== 'semester'} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={field} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />)}
        <div className="flex flex-wrap gap-2 md:col-span-5"><button className="w-full rounded-lg bg-[#0d5a4d] px-4 py-2 text-sm font-semibold text-white sm:w-auto">Save</button><button type="button" onClick={() => { setEditingId(null); setMessage(''); }} className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm sm:w-auto">Cancel</button>{message && <span className="py-2 text-sm text-slate-500">{message}</span>}</div>
      </form>}

      <div className="space-y-3">
        {courses.filter((course) => `${course.code} ${course.title}`.toLowerCase().includes(query.toLowerCase())).length === 0 ? <p className="text-slate-500">No matching courses available.</p> : courses.filter((course) => `${course.code} ${course.title}`.toLowerCase().includes(query.toLowerCase())).map((course) => (
          <div key={course._id} className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold text-[#11222d]">{course.code} — {course.title}</div>
              <div className="text-sm text-slate-500">{course.department} • {course.semester}</div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button onClick={() => { setEditingId(course._id); setForm({ code: course.code, title: course.title, credits: String(course.credits), department: course.department, semester: course.semester }); }} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium sm:w-auto">Edit</button>
              <button onClick={() => deleteCourse(course._id)} className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 sm:w-auto">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

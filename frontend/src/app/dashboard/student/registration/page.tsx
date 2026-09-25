"use client";

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
type Course = { _id: string; code: string; title: string; credits: number; semester: string };
type Registration = { _id: string; status: string; courseIds: Course[] } | null;

async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}`, ...(options.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export default function RegistrationPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [registration, setRegistration] = useState<Registration>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/portal/courses'), api('/v1/registrations/current')]).then(([courseData, registrationData]) => {
      setCourses(courseData.courses || []);
      const current = registrationData.registration || null;
      setRegistration(current);
      setSelected((current?.courseIds || []).map((course: Course) => course._id));
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load registration'));
  }, []);

  async function save(submit: boolean) {
    setError('');
    try {
      let current = registration;
      if (!current) {
        const data = await api('/v1/registrations', { method: 'POST', body: JSON.stringify({ courseIds: selected }) });
        current = data.registration;
        setRegistration(current);
      } else {
        const data = await api(`/v1/registrations/${current._id}`, { method: 'PUT', body: JSON.stringify({ courseIds: selected }) });
        current = data.registration;
        setRegistration(current);
      }
      if (submit && current) {
        const data = await api(`/v1/registrations/${current._id}/submit`, { method: 'POST' });
        setRegistration(data.registration);
      }
      setMessage(submit ? 'Registration submitted for approval.' : 'Draft saved.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save registration'); }
  }

  const locked = registration?.status === 'submitted' || registration?.status === 'approved';
  return <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="muted-kicker">Academic services</p><h2 className="mt-2 text-2xl font-bold text-[#11222d]">Course registration</h2><p className="mt-2 text-sm text-slate-500">Select courses for the current semester, save a draft, then submit it for approval.</p></div><span className="rounded-full bg-white px-3 py-2 text-sm font-semibold capitalize text-[#0d5a4d] ring-1 ring-slate-200">{registration?.status || 'draft'}</span></div>
    <div className="mt-6 grid gap-3">{courses.map((course) => <label key={course._id} className={`flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-slate-200 ${locked ? 'opacity-70' : 'cursor-pointer'}`}><span className="flex items-center gap-3"><input type="checkbox" disabled={locked} checked={selected.includes(course._id)} onChange={() => setSelected((items) => items.includes(course._id) ? items.filter((id) => id !== course._id) : [...items, course._id])} /><span><strong>{course.code}</strong> - {course.title}<span className="block text-xs text-slate-500">{course.semester}</span></span></span><span className="text-sm font-semibold text-[#0d5a4d]">{course.credits} credits</span></label>)}</div>
    {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</p>}
    {!locked && <div className="mt-6 flex flex-wrap gap-3"><button onClick={() => save(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold">Save draft</button><button onClick={() => save(true)} className="rounded-lg bg-[#0d5a4d] px-4 py-2 text-sm font-semibold text-white">Submit registration</button></div>}
  </div>;
}

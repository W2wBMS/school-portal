"use client";

import { useEffect, useState } from 'react';
import NotificationsPanel from '@/components/NotificationsPanel';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
type Student = { _id: string; fullName: string; email: string };
type Course = { _id: string; code: string; title: string; credits: number };
type Result = { _id: string; score: number; grade: string; semester: string; level?: string; academicYear?: string; approved: boolean; finalized: boolean; studentId?: Student; courseId?: Course };

export default function AdminResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentId: '', courseId: '', score: '90', level: '100', academicYear: '2025/2026', semester: 'Semester 1' });
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [csvText, setCsvText] = useState('studentId,studentName,courseCode,score,level,semester,academicYear\n10290001,Daniel Owusu,AGR101,88,100,Semester 1,2025/2026');
  const [csvFileName, setCsvFileName] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem('portal_token') || '';
        const headers = { Authorization: `Bearer ${token}` };

        const [resultsResponse, usersResponse, coursesResponse] = await Promise.all([
          fetch(`${API_BASE}/portal/results`, { credentials: 'include', headers }),
          fetch(`${API_BASE}/users`, { credentials: 'include', headers }),
          fetch(`${API_BASE}/portal/courses`, { credentials: 'include', headers }),
        ]);

        if (resultsResponse.ok) {
          const data = await resultsResponse.json();
          setResults(data.results || []);
        }

        if (usersResponse.ok) {
          const data = await usersResponse.json();
          setStudents((data.users || []).filter((user: Student & { role: string }) => user.role === 'student'));
        }

        if (coursesResponse.ok) {
          const data = await coursesResponse.json();
          setCourses(data.courses || []);
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to load results');
      }
    }

    loadData();
  }, []);

  async function createResult(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(`${API_BASE}/portal/results`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}`,
      },
      body: JSON.stringify({
        ...form,
        studentId: form.studentId,
        courseId: form.courseId,
        score: Number(form.score),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setResults((current) => [data.result, ...current]);
      setForm({ studentId: '', courseId: '', score: '90', level: '100', academicYear: '2025/2026', semester: 'Semester 1' });
      setShowForm(false);
    }
  }

  async function importResultsCsv(event?: React.FormEvent) {
    event?.preventDefault();
    if (!csvText.trim()) {
      setError('Select a CSV file first.');
      return;
    }

    setIsImportingCsv(true);
    try {
      const response = await fetch(`${API_BASE}/portal/results/import`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}`,
        },
        body: JSON.stringify({ csv: csvText }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Unable to import results CSV.');
        setNotice('');
        return;
      }

      setError('');
      setNotice(data.message || 'Results imported successfully.');
      const refreshed = await fetch(`${API_BASE}/portal/results`, { credentials: 'include', headers: { Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}` } });
      if (refreshed.ok) {
        const next = await refreshed.json();
        setResults(next.results || []);
      }
    } finally {
      setIsImportingCsv(false);
    }
  }

  async function handleResultsCsvFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setCsvText(content);
    setCsvFileName(file.name);
    setNotice('CSV loaded. Saving results...');
    setError('');
    await importResultsCsv();
  }

  async function updateResult(result: Result) {
    const score = window.prompt('Enter the new score', String(result.score ?? 0));
    if (score === null) return;

    const response = await fetch(`${API_BASE}/portal/results/${result._id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}`,
      },
      body: JSON.stringify({ score: Number(score) }),
    });

    if (response.ok) {
      const data = await response.json();
      setResults((current) => current.map((item) => item._id === result._id ? data.result : item));
    }
  }

  async function approveResult(result: Result) {
    const response = await fetch(`${API_BASE}/portal/results/${result._id}/approve`, {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}` },
    });

    if (response.ok) {
      const data = await response.json();
      setResults((current) => current.map((item) => item._id === result._id ? { ...item, ...data.result, approved: true, finalized: true } : item));
    }
  }

  async function correctResult(result: Result) {
    const score = window.prompt('Enter the corrected score', String(result.score ?? 0));
    const reason = score === null ? null : window.prompt('Enter the correction reason');
    if (score === null || !reason) return;
    const response = await fetch(`${API_BASE}/portal/results/${result._id}/correct`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}` },
      body: JSON.stringify({ score: Number(score), reason }),
    });
    if (response.ok) {
      const data = await response.json();
      setResults((current) => current.map((item) => item._id === result._id ? { ...item, ...data.result } : item));
    }
  }

  async function deleteResult(id: string) {
    if (!window.confirm('Delete this result record?')) return;
    const response = await fetch(`${API_BASE}/portal/results/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}`,
      },
    });

    if (response.ok) {
      setResults((current) => current.filter((row) => row._id !== id));
    }
  }

  const visibleResults = results.filter((result) => {
    const haystack = `${result.studentId?.fullName || ''} ${result.studentId?.email || ''} ${result.courseId?.code || ''} ${result.courseId?.title || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === 'all' || status === (result.approved ? 'published' : 'pending'));
  });
  const pendingCount = results.filter((result) => !result.approved).length;
  const publishedCount = results.filter((result) => result.approved).length;

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="muted-kicker">Academic records</p><h2 className="mt-2 text-2xl font-bold text-[#11222d]">Results workspace</h2><p className="mt-2 text-sm text-slate-500">Review, publish, and correct student results.</p></div>
          <button onClick={() => setShowForm((visible) => !visible)} className="w-full rounded-lg bg-[#0d5a4d] px-4 py-2 text-sm font-semibold text-white sm:w-auto">{showForm ? 'Close form' : 'Add result'}</button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><span className="text-xs text-slate-500">Total records</span><strong className="mt-1 block text-2xl text-[#11222d]">{results.length}</strong></div><div className="rounded-2xl bg-[#fff8e9] p-4 ring-1 ring-[#f0dfb8]"><span className="text-xs text-[#8a6a2f]">Pending approval</span><strong className="mt-1 block text-2xl text-[#8a6a2f]">{pendingCount}</strong></div><div className="rounded-2xl bg-[#eaf5ef] p-4 ring-1 ring-[#cfe6d7]"><span className="text-xs text-[#28704b]">Published</span><strong className="mt-1 block text-2xl text-[#28704b]">{publishedCount}</strong></div></div>
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
      </div>

      <div className="rounded-[28px] bg-[#f8fafc] p-4 ring-1 ring-slate-200 sm:p-6">
        <form onSubmit={importResultsCsv} className="mb-6 rounded-xl bg-white p-4 ring-1 ring-slate-200">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Upload results CSV</label>
          <div className="mb-3 flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
            <input type="file" accept=".csv,text/csv" onChange={handleResultsCsvFileChange} className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#0d5a4d] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
            {csvFileName && <span className="text-xs text-slate-500">Selected file: {csvFileName}</span>}
          </div>
          <textarea value={csvText} onChange={(event) => setCsvText(event.target.value)} rows={6} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="studentId,studentName,courseCode,score,level,semester,academicYear" />
          <div className="mt-3 flex justify-end">
            <button type="submit" disabled={isImportingCsv} className="rounded-lg bg-[#0d5a4d] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {isImportingCsv ? 'Saving...' : 'Save results list'}
            </button>
          </div>
        </form>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student or course" className="input-field flex-1" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="input-field sm:max-w-48"><option value="all">All statuses</option><option value="pending">Pending</option><option value="published">Published</option></select></div>
        <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-bold text-[#11222d]">Result records</h3><span className="text-sm text-slate-500">{visibleResults.length} shown</span></div>

      {showForm && (
        <form onSubmit={createResult} className="mb-6 grid gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 md:grid-cols-5">
          <select
            required
            value={form.studentId}
            onChange={(event) => setForm({ ...form, studentId: event.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student._id} value={student._id}>{student.fullName}</option>
            ))}
          </select>
          <select
            required
            value={form.courseId}
            onChange={(event) => setForm({ ...form, courseId: event.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>{course.code} — {course.title}</option>
            ))}
          </select>
          <input
            required
            value={form.score}
            onChange={(event) => setForm({ ...form, score: event.target.value })}
            placeholder="Score"
            type="number"
            min="0"
            max="100"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            required
            value={form.level}
            onChange={(event) => setForm({ ...form, level: event.target.value })}
            placeholder="Level e.g. 100"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            required
            value={form.academicYear}
            onChange={(event) => setForm({ ...form, academicYear: event.target.value })}
            placeholder="Academic year e.g. 2025/2026"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.semester}
            onChange={(event) => setForm({ ...form, semester: event.target.value })}
            placeholder="Semester"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button className="w-full rounded-lg bg-[#0d5a4d] px-4 py-2 text-sm font-semibold text-white md:col-span-5">Save result</button>
        </form>
      )}

      <div className="space-y-3">
        {visibleResults.length === 0 ? (
          <p className="text-slate-500">No result records available.</p>
        ) : (
          visibleResults.map((row) => (
            <div key={row._id} className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                <div className="font-semibold text-[#11222d]">
                  {row.studentId?.fullName || 'Student'} — {row.courseId?.code || 'Course'}
                </div>
                <div className="text-sm text-slate-500">
                  {row.courseId?.title || 'Course title'} • Level {row.level || '—'} • {row.academicYear || '—'} • {row.semester}
                </div>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.approved ? 'bg-[#eaf5ef] text-[#28704b]' : 'bg-[#fff8e9] text-[#8a6a2f]'}`}>{row.approved ? 'Published' : 'Pending approval'}</span>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 text-right sm:gap-4">
                <div>
                  <div className="text-lg font-bold text-[#0d5a4d]">{row.grade}</div>
                  <div className="text-sm text-slate-500">{row.score}%</div>
                </div>
                {!row.approved && (
                  <button onClick={() => approveResult(row)} className="w-full rounded-lg bg-[#0d5a4d] px-3 py-2 text-sm font-medium text-white sm:w-auto">Approve</button>
                )}
                {row.finalized ? <button onClick={() => correctResult(row)} className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm font-medium text-amber-700 sm:w-auto">Correct</button> : <button onClick={() => updateResult(row)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium sm:w-auto">Edit</button>}
                <button onClick={() => deleteResult(row._id)} className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 sm:w-auto">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
      <NotificationsPanel title="Academic review notifications" />
    </div>
  );
}

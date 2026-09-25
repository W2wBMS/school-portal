"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchStudentOverview, type AcademicSummary, type ResultRow } from '@/lib/portal';

export default function StudentResultsPage() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [semester, setSemester] = useState('all');
  const [level, setLevel] = useState('all');
  const [academicYear, setAcademicYear] = useState('all');
  const [summary, setSummary] = useState<AcademicSummary | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const overview = await fetchStudentOverview();
        setResults(overview.results || []);
        setSummary(overview.academicSummary);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to load results');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
        <p className="muted-kicker">Academic record</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold text-[#11222d]">My results</h2><p className="mt-2 text-sm text-slate-500">Your published grades, organized by course and semester.</p></div><div className="flex items-stretch gap-3"><div className="rounded-2xl bg-[#e5f1ed] px-4 py-3 text-right"><span className="block text-xs text-[#4c756c]">CGPA</span><strong className="text-2xl text-[#0d5a4d]">{summary?.cgpa.toFixed(2) || '0.00'}</strong></div><Link href="/dashboard/student/transcript" className="flex items-center rounded-2xl bg-[#0d5a4d] px-4 py-3 text-sm font-semibold text-white">View transcript</Link></div></div>
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>
      {loading ? <div className="rounded-[28px] bg-[#f8fafc] p-8 text-sm font-semibold text-[#0d5a4d]">Loading your results...</div> : <div className="rounded-[28px] bg-[#f8fafc] p-4 ring-1 ring-slate-200 sm:p-6">
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course or code" className="input-field lg:col-span-1" /><select value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="input-field"><option value="all">All academic years</option>{Array.from(new Set(results.map((row) => row.academicYear).filter(Boolean))).map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={level} onChange={(event) => setLevel(event.target.value)} className="input-field"><option value="all">All levels</option>{Array.from(new Set(results.map((row) => row.level).filter(Boolean))).map((item) => <option key={item} value={item}>Level {item}</option>)}</select><select value={semester} onChange={(event) => setSemester(event.target.value)} className="input-field"><option value="all">All semesters</option>{Array.from(new Set(results.map((row) => row.semester))).map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        <div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><span className="text-xs text-slate-500">Credits completed</span><strong className="mt-1 block text-xl text-[#11222d]">{summary?.totalCredits || 0}</strong></div>{summary?.semesters.slice(0, 2).map((item) => <div key={item.semester} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><span className="text-xs text-slate-500">{item.semester} GPA</span><strong className="mt-1 block text-xl text-[#0d5a4d]">{item.gpa.toFixed(2)}</strong></div>)}</div>
        <div className="space-y-3">{results.filter((row) => `${row.courseId?.code || ''} ${row.courseId?.title || ''}`.toLowerCase().includes(query.toLowerCase()) && (academicYear === 'all' || row.academicYear === academicYear) && (level === 'all' || row.level === level) && (semester === 'all' || row.semester === semester)).length === 0 ? <p className="py-6 text-slate-500">No matching results available.</p> : results.filter((row) => `${row.courseId?.code || ''} ${row.courseId?.title || ''}`.toLowerCase().includes(query.toLowerCase()) && (academicYear === 'all' || row.academicYear === academicYear) && (level === 'all' || row.level === level) && (semester === 'all' || row.semester === semester)).map((row, index) => <div key={`${row.courseId?.code || 'course'}-${index}`} className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-slate-200"><div><div className="font-semibold text-[#11222d]">{row.courseId?.code || 'Course'} <span className="font-normal text-slate-400">/</span> {row.courseId?.title || 'Result'}</div><div className="mt-1 text-sm text-slate-500">Level {row.level || '—'} · {row.academicYear || '—'} · {row.semester} · {row.courseId?.credits || 0} credits</div></div><div className="text-right"><div className="text-xl font-bold text-[#0d5a4d]">{row.grade}</div><div className="text-sm text-slate-500">{row.score}%</div></div></div>)}</div>
      </div>}
    </div>
  );
}

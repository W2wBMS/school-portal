"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchStudentOverview, type AcademicSummary, type ResultRow } from '@/lib/portal';

function getLatestSemesterName(semesters: AcademicSummary['semesters']) {
  if (!semesters.length) return 'all';

  const yearValue = (value?: string) => {
    const match = String(value || '').match(/(\d{4})/);
    return match ? Number(match[1]) : 0;
  };

  const levelValue = (value?: string) => {
    const match = String(value || '').match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  };

  const semesterValue = (value?: string) => {
    const match = String(value || '').match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  };

  return [...semesters].sort((left, right) => {
    const yearDifference = yearValue(right.academicYear) - yearValue(left.academicYear);
    if (yearDifference !== 0) return yearDifference;

    const levelDifference = levelValue(right.level) - levelValue(left.level);
    if (levelDifference !== 0) return levelDifference;

    return semesterValue(right.semester) - semesterValue(left.semester);
  })[0]?.semester || 'all';
}

export default function StudentResultsPage() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [semester, setSemester] = useState('all');
  const [level, setLevel] = useState('all');
  const [academicYear, setAcademicYear] = useState('all');
  const [summary, setSummary] = useState<AcademicSummary | null>(null);
  const [profile, setProfile] = useState<{
    fullName?: string;
    studentId?: string;
    email?: string;
    programme?: string;
    department?: string;
    level?: string;
  } | null>(null);

  const printableSemester = semester === 'all' ? summary?.semesters[0]?.semester ?? 'Semester 1' : semester;
  const printableRows = results.filter((row) => row.semester === printableSemester);
  const printableSummary = summary?.semesters.find((item) => item.semester === printableSemester) ?? null;

  const handlePrintSemesterResult = () => {
    const rows = printableRows.length
      ? printableRows.map((row) => `
        <tr>
          <td>${row.courseId?.code || 'Course'}</td>
          <td>${row.courseId?.title || 'Result'}</td>
          <td>${row.courseId?.credits || 0}</td>
          <td>${row.score}%</td>
          <td>${row.grade}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="5">No results found for this semester.</td></tr>';

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      window.alert('Your browser blocked the print window. Please allow pop-ups and try again.');
      return;
    }

    const studentName = profile?.fullName || 'Student';
    const studentId = profile?.studentId || '—';
    const studentEmail = profile?.email || '—';
    const programme = profile?.programme || '—';
    const department = profile?.department || '—';
    const level = profile?.level || '—';

    printWindow.document.write(`
      <html>
        <head>
          <title>Semester Result</title>
          <style>
            body { font-family: Arial, sans-serif; color: #11222d; margin: 24px; }
            .header { border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
            .kicker { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #0d5a4d; font-weight: 700; }
            h1 { margin: 12px 0 0; font-size: 28px; }
            .meta { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 8px 16px; margin-top: 16px; font-size: 14px; }
            .summary { display: flex; gap: 12px; margin: 20px 0; flex-wrap: wrap; }
            .pill { padding: 12px 16px; border-radius: 12px; background: #e5f1ed; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            th { background: #f8fafc; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
            .student-grid { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 10px 20px; margin-top: 18px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="kicker">Regent University College of Science and Technology</div>
            <h1>Semester Result</h1>
            <div class="student-grid">
              <div><strong>Student name:</strong> ${studentName}</div>
              <div><strong>Student ID:</strong> ${studentId}</div>
              <div><strong>Email:</strong> ${studentEmail}</div>
              <div><strong>Programme:</strong> ${programme}</div>
              <div><strong>Department:</strong> ${department}</div>
              <div><strong>Level:</strong> ${level}</div>
              <div><strong>Semester:</strong> ${printableSemester}</div>
              <div><strong>Academic year:</strong> ${summary?.semesters.find((item) => item.semester === printableSemester)?.academicYear || '—'}</div>
            </div>
          </div>

          <div class="summary">
            <div class="pill"><strong>Semester GPA:</strong> ${printableSummary?.gpa.toFixed(2) || '0.00'}</div>
            <div class="pill"><strong>Semester Credits:</strong> ${printableSummary?.credits || 0}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Title</th>
                <th>Credits</th>
                <th>Score</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
    setTimeout(() => printWindow.close(), 1000);
  };

  useEffect(() => {
    async function load() {
      try {
        const overview = await fetchStudentOverview();
        setResults(overview.results || []);
        setSummary(overview.academicSummary);
        setProfile(overview.profile || null);
        const latestSemester = getLatestSemesterName(overview.academicSummary?.semesters || []);
        if (latestSemester !== 'all') {
          setSemester(latestSemester);
        }
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
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold text-[#11222d]">My results</h2><p className="mt-2 text-sm text-slate-500">Your published grades, organized by course and semester.</p></div><div className="flex flex-wrap items-stretch gap-3"><div className="rounded-2xl bg-[#e5f1ed] px-4 py-3 text-right"><span className="block text-xs text-[#4c756c]">CGPA</span><strong className="text-2xl text-[#0d5a4d]">{summary?.cgpa.toFixed(2) || '0.00'}</strong></div><button onClick={handlePrintSemesterResult} className="flex items-center rounded-2xl bg-[#0d5a4d] px-4 py-3 text-sm font-semibold text-white print:hidden">Print semester result</button><Link href="/dashboard/student/transcript" className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#11222d] print:hidden">View transcript</Link></div></div>
        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>
      {loading ? <div className="rounded-[28px] bg-[#f8fafc] p-8 text-sm font-semibold text-[#0d5a4d]">Loading your results...</div> : <div className="rounded-[28px] bg-[#f8fafc] p-4 ring-1 ring-slate-200 sm:p-6 print:hidden">
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course or code" className="input-field lg:col-span-1" /><select value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="input-field"><option value="all">All academic years</option>{Array.from(new Set(results.map((row) => row.academicYear).filter(Boolean))).map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={level} onChange={(event) => setLevel(event.target.value)} className="input-field"><option value="all">All levels</option>{Array.from(new Set(results.map((row) => row.level).filter(Boolean))).map((item) => <option key={item} value={item}>Level {item}</option>)}</select><select value={semester} onChange={(event) => setSemester(event.target.value)} className="input-field"><option value="all">All semesters</option>{Array.from(new Set(results.map((row) => row.semester))).map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        <div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><span className="text-xs text-slate-500">Credits completed</span><strong className="mt-1 block text-xl text-[#11222d]">{summary?.totalCredits || 0}</strong></div>{summary?.semesters.slice(0, 2).map((item) => <div key={item.semester} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200"><span className="text-xs text-slate-500">{item.semester} GPA</span><strong className="mt-1 block text-xl text-[#0d5a4d]">{item.gpa.toFixed(2)}</strong></div>)}</div>
        <div className="space-y-3">{results.filter((row) => `${row.courseId?.code || ''} ${row.courseId?.title || ''}`.toLowerCase().includes(query.toLowerCase()) && (academicYear === 'all' || row.academicYear === academicYear) && (level === 'all' || row.level === level) && (semester === 'all' || row.semester === semester)).length === 0 ? <p className="py-6 text-slate-500">No matching results available.</p> : results.filter((row) => `${row.courseId?.code || ''} ${row.courseId?.title || ''}`.toLowerCase().includes(query.toLowerCase()) && (academicYear === 'all' || row.academicYear === academicYear) && (level === 'all' || row.level === level) && (semester === 'all' || row.semester === semester)).map((row, index) => <div key={`${row.courseId?.code || 'course'}-${index}`} className="flex items-center justify-between rounded-2xl bg-white p-4 ring-1 ring-slate-200"><div><div className="font-semibold text-[#11222d]">{row.courseId?.code || 'Course'} <span className="font-normal text-slate-400">/</span> {row.courseId?.title || 'Result'}</div><div className="mt-1 text-sm text-slate-500">Level {row.level || '—'} · {row.academicYear || '—'} · {row.semester} · {row.courseId?.credits || 0} credits</div></div><div className="text-right"><div className="text-xl font-bold text-[#0d5a4d]">{row.grade}</div><div className="text-sm text-slate-500">{row.score}%</div></div></div>)}</div>
      </div>}

      <div className="hidden print:block">
        <div className="rounded-[28px] bg-white p-6 ring-1 ring-slate-200">
          <div className="border-b border-slate-200 pb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0d5a4d]">Regent University College of Science and Technology</p>
            <h2 className="mt-2 text-2xl font-bold text-[#11222d]">Semester Result</h2>
            <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p><strong>Semester:</strong> {printableSemester}</p>
              <p><strong>Academic year:</strong> {summary?.semesters.find((item) => item.semester === printableSemester)?.academicYear || '—'}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-xl bg-[#e5f1ed] px-4 py-3">
              <span className="block text-xs text-[#4c756c]">Semester GPA</span>
              <strong className="text-xl text-[#0d5a4d]">{printableSummary?.gpa.toFixed(2) || '0.00'}</strong>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <span className="block text-xs text-slate-500">Semester Credits</span>
              <strong className="text-xl text-[#11222d]">{printableSummary?.credits || 0}</strong>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-3">Course</th>
                  <th className="px-3 py-3">Title</th>
                  <th className="px-3 py-3">Credits</th>
                  <th className="px-3 py-3">Score</th>
                  <th className="px-3 py-3">Grade</th>
                </tr>
              </thead>
              <tbody>
                {printableRows.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-4 text-slate-500">No results found for this semester.</td></tr>
                ) : printableRows.map((row, index) => (
                  <tr key={`${row.courseId?.code || 'course'}-${index}`} className="border-t border-slate-200">
                    <td className="px-3 py-3 font-medium text-[#11222d]">{row.courseId?.code || 'Course'}</td>
                    <td className="px-3 py-3">{row.courseId?.title || 'Result'}</td>
                    <td className="px-3 py-3">{row.courseId?.credits || 0}</td>
                    <td className="px-3 py-3">{row.score}%</td>
                    <td className="px-3 py-3 font-semibold text-[#0d5a4d]">{row.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

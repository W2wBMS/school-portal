"use client";

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
type User = { _id: string; fullName: string; email: string; role: string; status: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showLecturerImport, setShowLecturerImport] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'student' });
  const [csvText, setCsvText] = useState('fullName,programme,department,level,email\nRichard Mensah,BSc Computer Science,Computer Science,100,richard.mensah@rucst.edu.gh');
  const [csvFileName, setCsvFileName] = useState('');
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [lecturerCsvText, setLecturerCsvText] = useState('fullName,email,department\nAma Mensah,ama.mensah@example.edu.gh,Computer Science');
  const [lecturerCsvFileName, setLecturerCsvFileName] = useState('');
  const [lecturerSetupLinks, setLecturerSetupLinks] = useState<{ email: string; url: string }[]>([]);
  const [isImportingLecturers, setIsImportingLecturers] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch(`${API_BASE}/users`, {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } catch (reason) {
        setMessage(reason instanceof Error ? reason.message : 'Unable to load users.');
      }
    }

    loadUsers();
  }, []);

  async function updateUser(id: string, updates: Record<string, string>) {
    const response = await fetch(`${API_BASE}/users/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}` }, body: JSON.stringify(updates) });
    if (response.ok) {
      const data = await response.json();
      setUsers((current) => current.map((user) => user._id === id ? data.user : user));
      setMessage('User updated.');
    } else setMessage((await response.json()).message || 'Unable to update user.');
  }

  async function deleteUser(id: string) {
    if (!window.confirm('Delete this user?')) return;
    const response = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE', credentials: 'include', headers: { Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}` } });
    if (response.ok) setUsers((current) => current.filter((user) => user._id !== id));
    else setMessage((await response.json()).message || 'Unable to delete user.');
  }

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(`${API_BASE}/users`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}` }, body: JSON.stringify(form) });
    if (response.ok) {
      const data = await response.json();
      setUsers((current) => [data.user, ...current]);
      setForm({ fullName: '', email: '', password: '', role: 'student' });
      setShowForm(false);
      setMessage('User created.');
    } else setMessage((await response.json()).message || 'Unable to create user.');
  }

  async function importAdmissionCsv(event?: React.FormEvent) {
    event?.preventDefault();
    const nextCsv = csvText.trim();
    if (!nextCsv) {
      setMessage('Select a CSV file first.');
      return;
    }

    setIsImportingCsv(true);
    try {
      const response = await fetch(`${API_BASE}/users/admissions/import`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}`,
        },
        body: JSON.stringify({ csv: nextCsv }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || 'Unable to import CSV.');
        return;
      }

      setMessage(data.message || 'Admission list updated successfully.');
      setShowCsvImport(false);
    } finally {
      setIsImportingCsv(false);
    }
  }

  async function handleCsvFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    setCsvText(content);
    setCsvFileName(file.name);
    setMessage('CSV loaded. Saving admissions list...');
    await importAdmissionCsv();
  }

  async function importLecturerCsv(event?: React.FormEvent) {
    event?.preventDefault();
    if (!lecturerCsvText.trim()) {
      setMessage('Add or select a lecturer CSV first.');
      return;
    }

    setIsImportingLecturers(true);
    try {
      const response = await fetch(`${API_BASE}/users/lecturers/import`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}`,
        },
        body: JSON.stringify({ csv: lecturerCsvText.trim() }),
      });
      const data = await response.json();
      if (!response.ok && response.status !== 207) {
        setMessage(data.duplicates?.length
          ? `${data.message} ${data.duplicates.join(', ')}`
          : data.message || 'Unable to import lecturer accounts.');
        return;
      }

      if (data.users?.length) setUsers((current) => [...data.users, ...current]);
      setLecturerSetupLinks(data.setupLinks || []);
      const failed = data.errors?.length || 0;
      const setupMessage = data.setupLinks?.length ? ` ${data.setupLinks.length} password setup link(s) need to be delivered securely; they expire in 15 minutes.` : ' Password setup emails were sent.';
      setMessage(`${data.created || 0} lecturer account${data.created === 1 ? '' : 's'} created.${setupMessage}${failed ? ` ${failed} row(s) need attention: ${data.errors.map((item: { row: number; email?: string; message: string }) => `row ${item.row} ${item.email || ''} ${item.message}`).join('; ')}` : ''}`);
      if (!failed) setShowLecturerImport(false);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to import lecturer accounts.');
    } finally {
      setIsImportingLecturers(false);
    }
  }

  async function handleLecturerCsvFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLecturerCsvText(await file.text());
    setLecturerCsvFileName(file.name);
  }

  return (
    <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="muted-kicker">People operations</p><h2 className="mt-2 text-2xl font-bold text-[#11222d]">User directory</h2><p className="mt-2 text-sm text-slate-500">Manage accounts, roles, and access status.</p></div><div className="flex flex-wrap items-center gap-3"><span className="rounded-2xl bg-[#e5f1ed] px-4 py-3 text-sm font-bold text-[#0d5a4d]">{users.length} users</span><button onClick={() => setShowForm((visible) => !visible)} className="rounded-lg bg-[#0d5a4d] px-4 py-2 text-sm font-semibold text-white whitespace-nowrap">Add user</button><button onClick={() => setShowLecturerImport((visible) => !visible)} className="rounded-lg border border-[#0d5a4d] bg-white px-4 py-2 text-sm font-semibold text-[#0d5a4d] whitespace-nowrap">Upload lecturer CSV</button><button onClick={() => setShowCsvImport((visible) => !visible)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 whitespace-nowrap">Upload admission CSV</button></div></div>
      {showForm && <form onSubmit={createUser} className="mt-6 grid gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 md:grid-cols-4">
        {(['fullName', 'email', 'password'] as const).map((field) => <input key={field} required value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={field} type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />)}
        <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">{['student', 'lecturer', 'department_admin', 'academic_officer', 'finance_officer', 'student_affairs', 'hod', 'pro_vc', 'vc'].map((role) => <option key={role}>{role}</option>)}</select>
        <button className="w-full rounded-lg bg-[#0d5a4d] px-4 py-2 text-sm font-semibold text-white md:col-span-4">Save user</button>
      </form>}
      {showLecturerImport && <form onSubmit={importLecturerCsv} className="mt-6 rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <h3 className="text-base font-bold text-[#11222d]">Import lecturer accounts</h3>
        <p className="mt-1 text-sm text-slate-500">Required columns: fullName and email. department is optional. Each lecturer receives a 15-minute password setup link by email.</p>
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
          <input type="file" accept=".csv,text/csv" onChange={handleLecturerCsvFileChange} className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#0d5a4d] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
          {lecturerCsvFileName && <span className="text-xs text-slate-500">Selected file: {lecturerCsvFileName}</span>}
        </div>
        <textarea aria-label="Lecturer CSV contents" value={lecturerCsvText} onChange={(event) => setLecturerCsvText(event.target.value)} rows={7} className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm" />
        <div className="mt-3 flex justify-end">
          <button type="submit" disabled={isImportingLecturers} className="rounded-lg bg-[#0d5a4d] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {isImportingLecturers ? 'Importing...' : 'Create lecturer accounts'}
          </button>
        </div>
      </form>}
      {lecturerSetupLinks.length > 0 && <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="font-bold text-[#7a5a22]">Password setup links</h3>
        <p className="mt-1 text-sm text-[#7a5a22]">Share each link with its lecturer using a secure channel. Links expire 15 minutes after import.</p>
        <div className="mt-3 space-y-3">
          {lecturerSetupLinks.map((item) => <div key={item.email} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="min-w-40 text-sm font-semibold text-[#11222d]">{item.email}</label>
            <input readOnly aria-label={`Setup link for ${item.email}`} value={item.url} className="input-field min-w-0 flex-1 bg-white text-xs" />
            <button type="button" onClick={() => navigator.clipboard.writeText(item.url).then(() => setMessage(`Setup link copied for ${item.email}.`))} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-[#7a5a22]">Copy link</button>
          </div>)}
        </div>
      </section>}
      {showCsvImport && <form onSubmit={importAdmissionCsv} className="mt-6 rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Admission CSV</label>
        <div className="mb-3 flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
          <input type="file" accept=".csv,text/csv" onChange={handleCsvFileChange} className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#0d5a4d] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
          {csvFileName && <span className="text-xs text-slate-500">Selected file: {csvFileName}</span>}
        </div>
        <textarea value={csvText} onChange={(event) => setCsvText(event.target.value)} rows={8} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="fullName,programme,department,level,email" />
        <div className="mt-3 flex justify-end">
          <button type="submit" disabled={isImportingCsv} className="rounded-lg bg-[#0d5a4d] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {isImportingCsv ? 'Saving...' : 'Save admission list'}
          </button>
        </div>
      </form>}
      {message && <div className="mt-3 text-sm text-slate-500">{message}</div>}
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" className="input-field mt-5" />
      <div className="mt-6 space-y-3">
        {users.filter((user) => `${user.fullName} ${user.email}`.toLowerCase().includes(query.toLowerCase())).length === 0 ? <p className="text-slate-500">No matching users available.</p> : users.filter((user) => `${user.fullName} ${user.email}`.toLowerCase().includes(query.toLowerCase())).map((user) => (
          <div key={user._id} className="flex flex-col gap-4 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold text-[#11222d]">{user.fullName}</div>
              <div className="text-sm text-slate-500">{user.email}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <select value={user.role} onChange={(event) => updateUser(user._id, { role: event.target.value })} className="w-full min-w-[150px] rounded-lg border border-slate-200 px-2 py-2 text-sm sm:w-auto">
                {['student', 'lecturer', 'department_admin', 'academic_officer', 'finance_officer', 'student_affairs', 'system_admin', 'super_admin', 'hod', 'pro_vc', 'vc'].map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
              <select value={user.status} onChange={(event) => updateUser(user._id, { status: event.target.value })} className="w-full min-w-[120px] rounded-lg border border-slate-200 px-2 py-2 text-sm sm:w-auto">
                {['active', 'inactive', 'suspended'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button onClick={() => deleteUser(user._id)} className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 sm:w-auto">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
type User = { _id: string; fullName: string; email: string; role: string; status: string };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'student' });
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

  return (
    <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="muted-kicker">People operations</p><h2 className="mt-2 text-2xl font-bold text-[#11222d]">User directory</h2><p className="mt-2 text-sm text-slate-500">Manage accounts, roles, and access status.</p></div><div className="flex flex-wrap items-center gap-3"><span className="rounded-2xl bg-[#e5f1ed] px-4 py-3 text-sm font-bold text-[#0d5a4d]">{users.length} users</span><button onClick={() => setShowForm((visible) => !visible)} className="rounded-lg bg-[#0d5a4d] px-4 py-2 text-sm font-semibold text-white whitespace-nowrap">Add user</button></div></div>
      {showForm && <form onSubmit={createUser} className="mt-6 grid gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 md:grid-cols-4">
        {(['fullName', 'email', 'password'] as const).map((field) => <input key={field} required value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={field} type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />)}
        <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">{['student', 'lecturer', 'department_admin', 'academic_officer', 'finance_officer', 'student_affairs'].map((role) => <option key={role}>{role}</option>)}</select>
        <button className="w-full rounded-lg bg-[#0d5a4d] px-4 py-2 text-sm font-semibold text-white md:col-span-4">Save user</button>
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
                {['student', 'lecturer', 'department_admin', 'academic_officer', 'finance_officer', 'student_affairs', 'system_admin', 'super_admin'].map((role) => <option key={role} value={role}>{role}</option>)}
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

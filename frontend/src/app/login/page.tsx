"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardPath, type Role } from '@/lib/auth';
import { fetchCsrfToken } from '@/lib/csrf';
import PasswordInput from '@/components/PasswordInput';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LoginPage() {
  const router = useRouter();
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [claimForm, setClaimForm] = useState({ fullName: '', programme: '', department: '', level: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const identifier = loginForm.identifier.trim();
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(`${API_BASE}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        credentials: 'include',
        body: JSON.stringify(
          identifier.includes('@')
            ? { email: identifier, password: loginForm.password }
            : { studentId: identifier, password: loginForm.password }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const user = data.user;
      localStorage.setItem('portal_user', JSON.stringify(user));
      localStorage.removeItem('portal_token');
      router.push(getDashboardPath((user.role as Role) || 'student'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimAccount(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setClaiming(true);

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(`${API_BASE}/v1/auth/claim-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        credentials: 'include',
        body: JSON.stringify(claimForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to create your account');
      }

      setSuccess(`Account created successfully. Your student ID is ${data.studentId}. You can now sign in with it.`);
      setLoginForm({ identifier: data.studentId, password: claimForm.password });
      setClaimForm({ fullName: '', programme: '', department: '', level: '', password: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setClaiming(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-8 lg:px-12">
      <div className="login-frame grid w-full max-w-6xl overflow-hidden rounded-[10px] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="login-identity relative flex min-h-[240px] flex-col justify-between overflow-hidden p-5 sm:min-h-[360px] sm:p-10 lg:min-h-[560px] lg:p-12">
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full border-[38px] border-[#d28e58]/35" />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/20 text-lg font-black text-black">RUCST</div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black">Established 1986</p>
                  <h1 className="mt-1 text-lg font-bold tracking-tight">Regent University College of Science and Technology</h1>
                </div>
              </div>
              <span className="text-3xl text-black">✦</span>
            </div>
            <div className="login-rule mt-8" />
          </div>

          <div className="relative z-10 max-w-md py-12">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-black">Campus portal</p>
            <h2 className="mt-5 text-4xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-5xl">Knowledge. Character. Progress.</h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-black">One secure place for the academic life of Regent University College of Science and Technology.</p>
          </div>

          <div className="relative z-10 flex items-end justify-between gap-5 border-t border-black/20 pt-5 text-xs text-black">
            <span>Student information system</span>
            <span className="text-right uppercase tracking-[0.18em]">RUCST / 01</span>
          </div>
        </div>

        <div className="flex items-center bg-[#f7f4ee] p-7 sm:p-10 lg:p-16">
          <div className="w-full max-w-md">
            <div className="mb-9">
              <p className="muted-kicker">Portal access</p>
              <h3 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-black sm:text-4xl">Welcome back.</h3>
              <p className="mt-3 text-sm leading-6 text-black">Sign in with your institutional account to continue.</p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-black">Student ID or Email</label>
              <input
                type="text"
                value={loginForm.identifier}
                onChange={(event) => setLoginForm({ ...loginForm, identifier: event.target.value })}
                className="input-field"
                placeholder="10290001 or admin@rucst.edu.gh"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black">Password</label>
              <PasswordInput
                value={loginForm.password}
                onChange={(password) => setLoginForm({ ...loginForm, password })}
                className="input-field"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex justify-end"><Link href="/forgot-password" className="text-sm font-semibold text-black underline-offset-4 hover:underline">Forgot password?</Link></div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-black">{error}</div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{success}</div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="primary-button w-full rounded-md px-5 py-3.5 text-base font-semibold shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-[#d9d4ca] bg-white/50 p-4">
            <h4 className="text-base font-semibold text-black">Create student account</h4>
            <p className="mt-2 text-sm leading-6 text-black">Enter your full name exactly as it appears on the admitted student list to generate your student ID and create your password.</p>

            <form onSubmit={handleClaimAccount} className="mt-4 space-y-3">
              <input
                type="text"
                value={claimForm.fullName}
                onChange={(event) => setClaimForm({ ...claimForm, fullName: event.target.value })}
                className="input-field"
                placeholder="Full name"
                required
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={claimForm.programme}
                  onChange={(event) => setClaimForm({ ...claimForm, programme: event.target.value })}
                  className="input-field"
                  placeholder="Programme"
                />
                <input
                  type="text"
                  value={claimForm.department}
                  onChange={(event) => setClaimForm({ ...claimForm, department: event.target.value })}
                  className="input-field"
                  placeholder="Department"
                />
              </div>

              <input
                type="text"
                value={claimForm.level}
                onChange={(event) => setClaimForm({ ...claimForm, level: event.target.value })}
                className="input-field"
                placeholder="Level"
              />

              <PasswordInput
                value={claimForm.password}
                onChange={(password) => setClaimForm({ ...claimForm, password })}
                className="input-field"
                placeholder="Create password"
                minLength={8}
                autoComplete="new-password"
                required
              />

              <button
                type="submit"
                disabled={claiming}
                className="primary-button w-full rounded-md px-5 py-3.5 text-base font-semibold shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {claiming ? 'Verifying admission...' : 'Generate student ID'}
              </button>
            </form>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}

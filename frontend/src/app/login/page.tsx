"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardPath, type Role } from '@/lib/auth';
import { fetchCsrfToken } from '@/lib/csrf';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(`${API_BASE}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        credentials: 'include',
        body: JSON.stringify(form),
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

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-8 lg:px-12">
      <div className="login-frame grid w-full max-w-6xl overflow-hidden rounded-[10px] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="login-identity relative flex min-h-[240px] flex-col justify-between overflow-hidden p-5 sm:min-h-[360px] sm:p-10 lg:min-h-[560px] lg:p-12">
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full border-[38px] border-[#d28e58]/35" />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/20 text-lg font-black text-black">BCC</div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black">Established 1986</p>
                  <h1 className="mt-1 text-lg font-bold tracking-tight">Bunso Cocoa College</h1>
                </div>
              </div>
              <span className="text-3xl text-black">✦</span>
            </div>
            <div className="login-rule mt-8" />
          </div>

          <div className="relative z-10 max-w-md py-12">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-black">Campus portal</p>
            <h2 className="mt-5 text-4xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-5xl">Knowledge. Character. Progress.</h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-black">One secure place for the academic life of Bunso Cocoa College.</p>
          </div>

          <div className="relative z-10 flex items-end justify-between gap-5 border-t border-black/20 pt-5 text-xs text-black">
            <span>Student information system</span>
            <span className="text-right uppercase tracking-[0.18em]">BCC / 01</span>
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
              <label className="mb-2 block text-sm font-medium text-black">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="input-field"
                placeholder="name@bunsococoa.edu.gh"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-black">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="input-field"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex justify-end"><Link href="/forgot-password" className="text-sm font-semibold text-black underline-offset-4 hover:underline">Forgot password?</Link></div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-black">{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="primary-button w-full rounded-md px-5 py-3.5 text-base font-semibold shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-7 flex items-center justify-between border-t border-[#d9d4ca] pt-5 text-sm text-black">
            <span>Need an account?</span>
            <Link href="/register" className="font-semibold text-black transition hover:text-black">
              Create account
            </Link>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}

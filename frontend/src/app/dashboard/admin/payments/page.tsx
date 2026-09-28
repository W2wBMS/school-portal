"use client";

import { useEffect, useMemo, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type PaymentRow = {
  _id: string;
  reference: string;
  studentReference?: string;
  paymentMethod?: string;
  amount: number;
  status: string;
  createdAt: string;
  verificationNote?: string;
  studentId?: { fullName?: string; email?: string; studentId?: string };
  feeLedgerId?: { invoiceNumber?: string; semester?: string; balance?: number };
};

const authHeaders = (contentType = false) => ({
  ...(contentType ? { 'Content-Type': 'application/json' } : {}),
  Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}`,
});

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [filter, setFilter] = useState('pending');
  const [query, setQuery] = useState('');
  const [rejectingReference, setRejectingReference] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyReference, setBusyReference] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadPayments() {
    try {
      const response = await fetch(`${API_BASE}/v1/payments/review`, { credentials: 'include', headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load payment submissions.');
      setPayments(data.payments || []);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load payment submissions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function reviewPayment(reference: string, decision: 'approve' | 'reject', note = '') {
    setBusyReference(reference);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/v1/payments/${encodeURIComponent(reference)}/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({ decision, note }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to update payment.');
      setPayments((current) => current.map((item) => item.reference === reference ? { ...item, status: data.payment.status, verificationNote: data.payment.verificationNote } : item));
      setMessage(decision === 'approve' ? 'Payment verified and applied to its invoice.' : 'Payment rejected and the student has been notified.');
      setRejectingReference('');
      setRejectionNote('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to update payment.');
    } finally {
      setBusyReference('');
    }
  }

  const pendingCount = payments.filter((payment) => payment.status === 'pending').length;
  const visiblePayments = useMemo(() => payments.filter((payment) => {
    const matchesStatus = filter === 'all' || payment.status === filter;
    const searchable = `${payment.reference} ${payment.studentReference || ''} ${payment.studentId?.fullName || ''} ${payment.studentId?.studentId || ''} ${payment.feeLedgerId?.invoiceNumber || ''}`.toLowerCase();
    return matchesStatus && searchable.includes(query.trim().toLowerCase());
  }), [payments, filter, query]);

  return (
    <div className="space-y-6 rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="muted-kicker">Finance operations</p>
          <h2 className="mt-2 text-2xl font-bold text-[#11222d]">Payment verification</h2>
          <p className="mt-2 text-sm text-slate-500">Review submitted transaction references before applying funds to invoices.</p>
        </div>
        <div className="rounded-xl bg-[#fff8e9] px-4 py-3"><span className="text-xs text-[#8a6a2f]">Awaiting review</span><strong className="ml-3 text-xl text-[#8a6a2f]">{pendingCount}</strong></div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter payments by status">
          {['pending', 'successful', 'failed', 'all'].map((status) => (
            <button key={status} onClick={() => setFilter(status)} aria-pressed={filter === status} className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize ${filter === status ? 'bg-[#0d5a4d] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
              {status === 'pending' ? `Pending (${pendingCount})` : status === 'successful' ? 'Verified' : status === 'failed' ? 'Rejected' : 'All'}
            </button>
          ))}
        </div>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student, invoice or reference" className="input-field w-full sm:max-w-sm" />
      </div>

      <section className="space-y-3" aria-label="Payment submissions">
        {loading ? <p className="rounded-xl bg-white p-5 text-sm text-slate-500">Loading submissions...</p> : visiblePayments.length === 0 ? <p className="rounded-xl bg-white p-5 text-sm text-slate-500">No payment submissions match this view.</p> : visiblePayments.map((payment) => (
          <article key={payment._id} className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-[#11222d]">{payment.studentId?.fullName || 'Student'}</h3><span className="rounded-full bg-[#f1f5f3] px-2 py-1 text-xs text-slate-600">{payment.studentId?.studentId || 'No student ID'}</span></div>
                <p className="mt-1 text-sm text-slate-500">{payment.studentId?.email || ''}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${payment.status === 'successful' ? 'bg-emerald-50 text-emerald-700' : payment.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{payment.status === 'successful' ? 'Verified' : payment.status === 'failed' ? 'Rejected' : 'Pending review'}</span>
            </div>

            <dl className="mt-4 grid gap-x-6 gap-y-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-xs text-slate-500">Invoice</dt><dd className="mt-1 font-semibold text-[#11222d]">{payment.feeLedgerId?.invoiceNumber || 'Legacy payment'}</dd><dd className="text-xs text-slate-500">{payment.feeLedgerId?.semester || ''}</dd></div>
              <div><dt className="text-xs text-slate-500">Amount</dt><dd className="mt-1 font-bold text-[#0d5a4d]">GH¢ {Number(payment.amount).toFixed(2)}</dd></div>
              <div><dt className="text-xs text-slate-500">Payment method</dt><dd className="mt-1 capitalize text-[#11222d]">{payment.paymentMethod?.replace('_', ' ') || 'Not recorded'}</dd></div>
              <div><dt className="text-xs text-slate-500">Submitted</dt><dd className="mt-1 text-[#11222d]">{new Date(payment.createdAt).toLocaleString()}</dd></div>
              <div><dt className="text-xs text-slate-500">Student transaction / receipt reference</dt><dd className="mt-1 break-all font-semibold text-[#11222d]">{payment.studentReference || 'Not provided'}</dd></div>
              <div><dt className="text-xs text-slate-500">Portal reference</dt><dd className="mt-1 break-all text-[#11222d]">{payment.reference}</dd></div>
              {payment.verificationNote && <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Staff note</dt><dd className="mt-1 text-[#11222d]">{payment.verificationNote}</dd></div>}
            </dl>

            {payment.status === 'pending' && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <button disabled={busyReference === payment.reference} onClick={() => reviewPayment(payment.reference, 'approve')} className="rounded-lg bg-[#0d5a4d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Verify and apply</button>
                {rejectingReference === payment.reference ? (
                  <form onSubmit={(event) => { event.preventDefault(); reviewPayment(payment.reference, 'reject', rejectionNote); }} className="flex w-full flex-col gap-2 sm:flex-row">
                    <input required maxLength={500} value={rejectionNote} onChange={(event) => setRejectionNote(event.target.value)} placeholder="Reason for rejecting" className="input-field min-w-0 flex-1" />
                    <button disabled={busyReference === payment.reference} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700">Confirm rejection</button>
                    <button type="button" onClick={() => { setRejectingReference(''); setRejectionNote(''); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
                  </form>
                ) : <button onClick={() => setRejectingReference(payment.reference)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700">Reject</button>}
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
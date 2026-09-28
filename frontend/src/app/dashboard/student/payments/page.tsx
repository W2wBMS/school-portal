"use client";

import { useEffect, useRef, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type Fee = {
  _id: string;
  invoiceNumber: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: string;
  semester: string;
};

type Payment = {
  _id: string;
  reference: string;
  studentReference?: string;
  paymentMethod?: string;
  status: string;
  amount: number;
  feeLedgerId?: { invoiceNumber?: string } | string;
  createdAt?: string;
  verificationNote?: string;
};

type Notice = { _id: string; title: string; message: string; readAt?: string; createdAt?: string };

function authHeaders(contentType = false) {
  return {
    ...(contentType ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}`,
  };
}

export default function PaymentsPage() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedFeeId, setSelectedFeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [studentReference, setStudentReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const requestKey = useRef<string | null>(null);

  const outstanding = fees.reduce((sum, fee) => sum + Number(fee.balance || 0), 0);
  const totalPaid = fees.reduce((sum, fee) => sum + Number(fee.amountPaid || 0), 0);
  const selectedFee = fees.find((fee) => fee._id === selectedFeeId);
  const paymentNotices = notices.filter((notice) => notice.title.toLowerCase().includes('payment'));

  useEffect(() => {
    async function loadFinanceData() {
      try {
        const headers = authHeaders();
        const [feesResponse, paymentsResponse, noticesResponse] = await Promise.all([
          fetch(`${API_BASE}/v1/fees`, { credentials: 'include', headers }),
          fetch(`${API_BASE}/v1/payments`, { credentials: 'include', headers }),
          fetch(`${API_BASE}/v1/notifications`, { credentials: 'include', headers }),
        ]);
        if (!feesResponse.ok || !paymentsResponse.ok || !noticesResponse.ok) throw new Error('Unable to load your finance records. Refresh and try again.');
        const [feeData, paymentData, noticeData] = await Promise.all([feesResponse.json(), paymentsResponse.json(), noticesResponse.json()]);
        const loadedFees = feeData.fees || [];
        setFees(loadedFees);
        setPayments(paymentData.payments || []);
        setNotices(noticeData.notifications || []);
        const firstUnpaid = loadedFees.find((fee: Fee) => Number(fee.balance) > 0);
        if (firstUnpaid) {
          setSelectedFeeId(firstUnpaid._id);
          setAmount(String(firstUnpaid.balance));
        }
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to load your finance records.');
      } finally {
        setLoading(false);
      }
    }

    loadFinanceData();
  }, []);

  function selectInvoice(invoiceId: string) {
    setSelectedFeeId(invoiceId);
    const fee = fees.find((row) => row._id === invoiceId);
    setAmount(fee ? String(fee.balance) : '');
  }

  async function submitPayment(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!selectedFee || Number(amount) <= 0 || Number(amount) > selectedFee.balance) {
      setError('Enter an amount greater than zero and no higher than the selected invoice balance.');
      return;
    }

    setSubmitting(true);
    try {
      requestKey.current ||= crypto.randomUUID();
      const response = await fetch(`${API_BASE}/v1/payments/initialize`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({
          feeLedgerId: selectedFee._id,
          amount: Number(amount),
          studentReference: studentReference.trim(),
          paymentMethod,
          idempotencyKey: requestKey.current,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to submit payment for verification.');
      setReference(data.reference);
      setPayments((current) => [data.payment, ...current.filter((item) => item._id !== data.payment._id)]);
      setMessage(`Submitted for staff verification. Your portal reference is ${data.reference}.`);
      setStudentReference('');
      requestKey.current = null;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to submit payment for verification.');
    } finally {
      setSubmitting(false);
    }
  }

  async function checkStatus(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_BASE}/v1/payments/${encodeURIComponent(reference.trim())}`, { credentials: 'include', headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Payment not found.');
      setPayments((current) => [data.payment, ...current.filter((item) => item._id !== data.payment._id)]);
      setMessage(`Payment ${data.payment.status}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to check payment status.');
    }
  }

  async function markNoticeRead(notice: Notice) {
    try {
      const response = await fetch(`${API_BASE}/v1/notifications/${notice._id}/read`, { method: 'PATCH', credentials: 'include', headers: authHeaders() });
      if (!response.ok) return;
      setNotices((current) => current.map((item) => item._id === notice._id ? { ...item, readAt: new Date().toISOString() } : item));
    } catch {
      setError('Unable to update notification.');
    }
  }

  return (
    <div className="space-y-6 rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="muted-kicker">Finance</p>
          <h2 className="mt-2 text-2xl font-bold text-[#11222d]">Fees and payments</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">Report a payment you have already made and follow its staff verification status.</p>
        </div>
        <a href="/dashboard/student/fees" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#11222d]">Open fee statement</a>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200"><span className="text-sm text-slate-500">Total fees paid</span><strong className="mt-1 block text-xl text-[#0d5a4d]">GH¢ {totalPaid.toFixed(2)}</strong></div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200"><span className="text-sm text-slate-500">Outstanding balance</span><strong className="mt-1 block text-xl text-[#8a6a2f]">GH¢ {outstanding.toFixed(2)}</strong></div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200"><span className="text-sm text-slate-500">Awaiting review</span><strong className="mt-1 block text-xl text-[#38576a]">{payments.filter((item) => item.status === 'pending').length}</strong></div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <h3 className="text-lg font-bold text-[#11222d]">Report a payment</h3>
          <p className="mt-1 text-sm text-slate-500">Submit only after paying through an approved university channel. Finance staff will verify the transaction reference.</p>
          <form onSubmit={submitPayment} className="mt-5 space-y-4">
            <div>
              <label htmlFor="invoice" className="mb-1 block text-sm font-medium text-slate-700">Invoice</label>
              <select id="invoice" required value={selectedFeeId} onChange={(event) => selectInvoice(event.target.value)} className="input-field w-full">
                <option value="">Select an outstanding invoice</option>
                {fees.filter((fee) => Number(fee.balance) > 0).map((fee) => <option key={fee._id} value={fee._id}>{fee.invoiceNumber} · {fee.semester} · GH¢ {Number(fee.balance).toFixed(2)} due</option>)}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="amount" className="mb-1 block text-sm font-medium text-slate-700">Amount (GH¢)</label>
                <input id="amount" required min="0.01" max={selectedFee?.balance} step="0.01" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className="input-field w-full" />
              </div>
              <div>
                <label htmlFor="method" className="mb-1 block text-sm font-medium text-slate-700">Payment method</label>
                <select id="method" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="input-field w-full">
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="mobile_money">Mobile money</option>
                  <option value="cash">Cash at finance office</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="transaction-reference" className="mb-1 block text-sm font-medium text-slate-700">Bank / transaction / receipt reference</label>
              <input id="transaction-reference" required maxLength={100} value={studentReference} onChange={(event) => setStudentReference(event.target.value)} placeholder="Reference shown on your receipt" className="input-field w-full" />
            </div>
            {selectedFee && <p className="rounded-lg bg-[#f5faf7] px-3 py-2 text-sm text-[#38576a]">Remaining on this invoice: GH¢ {Number(selectedFee.balance).toFixed(2)}</p>}
            <button disabled={submitting || !selectedFee} className="w-full rounded-lg bg-[#0d5a4d] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit for verification'}</button>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-[#11222d]">Payment history</h3>
            <form onSubmit={checkStatus} className="flex gap-2">
              <input required aria-label="Portal payment reference" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Portal reference" className="input-field min-w-0" />
              <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#11222d]">Check</button>
            </form>
          </div>
          <div className="mt-4 space-y-3">
            {loading ? <p className="text-sm text-slate-500">Loading payment history...</p> : payments.length === 0 ? <p className="text-sm text-slate-500">No payment submissions yet.</p> : payments.map((item) => {
              const invoiceName = typeof item.feeLedgerId === 'object' ? item.feeLedgerId?.invoiceNumber : undefined;
              return (
                <article key={item._id} className="rounded-xl bg-[#f8fafc] p-4 ring-1 ring-slate-200">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><div className="font-semibold text-[#11222d]">{invoiceName || item.reference}</div><div className="mt-1 text-xs text-slate-500">Portal ref: {item.reference}</div><div className="text-xs text-slate-500">Submitted ref: {item.studentReference || 'Not provided'} · {item.paymentMethod?.replace('_', ' ') || 'Legacy payment'}</div></div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${item.status === 'successful' ? 'bg-emerald-50 text-emerald-700' : item.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{item.status === 'pending' ? 'Awaiting review' : item.status}</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm"><span className="text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Payment'}</span><strong className="text-[#0d5a4d]">GH¢ {Number(item.amount).toFixed(2)}</strong></div>
                  {item.verificationNote && <p className="mt-2 text-sm text-slate-600">Staff note: {item.verificationNote}</p>}
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h3 className="text-lg font-bold text-[#11222d]">Payment notifications</h3>
        <div className="mt-4 space-y-2">
          {paymentNotices.length === 0 ? <p className="text-sm text-slate-500">Payment updates will appear here.</p> : paymentNotices.slice(0, 8).map((notice) => (
            <div key={notice._id} className={`flex flex-wrap items-start justify-between gap-3 rounded-lg p-3 ${notice.readAt ? 'bg-[#f8fafc]' : 'bg-[#f5faf7] ring-1 ring-[#dfe7e1]'}`}>
              <div><strong className="text-sm text-[#11222d]">{notice.title}</strong><p className="mt-1 text-sm text-slate-600">{notice.message}</p><span className="text-xs text-slate-400">{notice.createdAt ? new Date(notice.createdAt).toLocaleString() : ''}</span></div>
              {!notice.readAt && <button onClick={() => markNoticeRead(notice)} className="text-sm font-semibold text-[#0d5a4d]">Mark read</button>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

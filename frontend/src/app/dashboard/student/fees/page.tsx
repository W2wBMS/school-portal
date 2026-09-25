"use client";

import { useEffect, useState } from 'react';
import { fetchStudentOverview, type FeeLedgerRow } from '@/lib/portal';

export default function StudentFeesPage() {
  const [fees, setFees] = useState<FeeLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const overview = await fetchStudentOverview();
        setFees(overview.feeLedger || []);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Unable to load fee statement');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="rounded-[28px] bg-[#f8fafc] p-6 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="muted-kicker">Finance</p><h2 className="mt-2 text-2xl font-bold text-[#11222d]">Fee statement</h2><p className="mt-2 text-sm text-slate-500">Review invoices, payments, and current balances.</p></div><div className="rounded-2xl bg-[#fff8e9] px-4 py-3 text-right"><span className="block text-xs text-[#8a6a2f]">Outstanding</span><strong className="text-2xl text-[#8a6a2f]">GH¢ {fees.reduce((sum, fee) => sum + Number(fee.balance || 0), 0).toFixed(2)}</strong></div></div>
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="mt-5 text-sm font-semibold text-[#0d5a4d]">Loading fee statement...</div>}
      <div className="mt-6 space-y-3">
        {fees.length === 0 ? <p className="text-slate-500">No fee records available.</p> : fees.map((row, index) => (
          <div key={`${row.invoiceNumber}-${index}`} className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <div>
              <div className="font-semibold text-[#11222d]">{row.invoiceNumber}</div>
              <div className="text-sm text-slate-500">{row.semester}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-[#0d5a4d]">GH¢ {row.balance.toFixed(2)}</div>
              <div className="text-sm text-slate-500 capitalize">{row.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

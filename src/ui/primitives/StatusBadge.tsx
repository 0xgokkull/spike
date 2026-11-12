import React from 'react';
import type { CaseStatus } from '@/domain/types';

const STATUS_CONFIG: Record<CaseStatus, { color: string; dot: string; label: string }> = {
  new: { color: 'bg-blue-50 text-blue-700 border-blue-200/70', dot: 'bg-blue-500', label: 'New' },
  triaged: { color: 'bg-purple-50 text-purple-700 border-purple-200/70', dot: 'bg-purple-500', label: 'Triaged' },
  action_ready: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200/70', dot: 'bg-indigo-500', label: 'Ready' },
  awaiting_approval: { color: 'bg-amber-50 text-amber-800 border-amber-200/80', dot: 'bg-amber-500 animate-pulse', label: 'Needs Approval' },
  executed: { color: 'bg-teal-50 text-teal-700 border-teal-200/70', dot: 'bg-teal-500', label: 'Executed' },
  waiting_on_paypal: { color: 'bg-sky-50 text-sky-800 border-sky-200/70', dot: 'bg-sky-500', label: 'Waiting on PayPal' },
  resolved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200/70', dot: 'bg-emerald-500', label: 'Resolved' },
  snoozed: { color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400', label: 'Snoozed' },
  closed: { color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', label: 'Closed' },
  exec_failed: { color: 'bg-rose-50 text-rose-800 border-rose-200 font-semibold', dot: 'bg-rose-500', label: 'Failed' },
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  const config = STATUS_CONFIG[status] || { color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400', label: status };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border shadow-xs ${config.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}


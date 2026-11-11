import React from 'react';
import type { CaseStatus } from '@/domain/types';

const STATUS_COLORS: Record<CaseStatus, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  triaged: 'bg-purple-100 text-purple-800 border-purple-200',
  action_ready: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  awaiting_approval: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
  executed: 'bg-teal-100 text-teal-800 border-teal-200',
  waiting_on_paypal: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  snoozed: 'bg-gray-100 text-gray-700 border-gray-300',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
  exec_failed: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  new: 'New',
  triaged: 'Triaged',
  action_ready: 'Ready',
  awaiting_approval: 'Needs Approval',
  executed: 'Executed',
  waiting_on_paypal: 'Waiting on PayPal',
  resolved: 'Resolved',
  snoozed: 'Snoozed',
  closed: 'Closed',
  exec_failed: 'Failed',
};

export function StatusBadge({ status }: { status: CaseStatus }) {
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}
    >
      {label}
    </span>
  );
}


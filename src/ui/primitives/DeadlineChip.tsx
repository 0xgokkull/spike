import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface DeadlineChipProps {
  deadlineAt: string | null;
  className?: string;
}

export function DeadlineChip({ deadlineAt, className = '' }: DeadlineChipProps) {
  if (!deadlineAt) {
    return <span className={`text-slate-400 text-xs font-normal ${className}`}>No deadline</span>;
  }

  const deadline = new Date(deadlineAt);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) {
    return (
      <span
        suppressHydrationWarning
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs ${className}`}
      >
        <AlertTriangle className="h-3 w-3 text-rose-600" />
        <span>Overdue</span>
      </span>
    );
  }

  if (diffHours <= 24) {
    return (
      <span
        suppressHydrationWarning
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs ${className}`}
      >
        <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
        <span>Due Today ({diffHours}h)</span>
      </span>
    );
  }

  if (diffDays <= 3) {
    return (
      <span
        suppressHydrationWarning
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50/60 text-amber-800 border border-amber-200/60 ${className}`}
      >
        <Clock className="h-3 w-3 text-amber-600" />
        <span>Due in {diffDays}d</span>
      </span>
    );
  }

  return (
    <span
      suppressHydrationWarning
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80 ${className}`}
    >
      <Clock className="h-3 w-3 text-slate-400" />
      <span>Due in {diffDays}d</span>
    </span>
  );
}

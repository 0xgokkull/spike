import React from 'react';

interface DeadlineChipProps {
  deadlineAt: string | null;
  className?: string;
}

export function DeadlineChip({ deadlineAt, className = '' }: DeadlineChipProps) {
  if (!deadlineAt) {
    return <span className={`text-gray-400 text-xs ${className}`}>No deadline</span>;
  }

  const deadline = new Date(deadlineAt);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-600 text-white ${className}`}
      >
        Overdue
      </span>
    );
  }

  if (diffHours <= 24) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-500 text-white ${className}`}
      >
        Due Today ({diffHours}h)
      </span>
    );
  }

  if (diffDays <= 3) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 ${className}`}
      >
        Due in {diffDays}d
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
    >
      Due in {diffDays}d
    </span>
  );
}

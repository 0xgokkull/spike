import React from 'react';
import type { ExecutionMode } from '@/domain/types';
import { Zap, UserCheck } from 'lucide-react';

export function ModeBadge({ mode }: { mode: ExecutionMode }) {
  if (mode === 'auto') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
        <Zap className="h-3 w-3 text-emerald-600 fill-emerald-500" />
        <span>Auto</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs">
      <UserCheck className="h-3 w-3 text-amber-600" />
      <span>Approval Required</span>
    </span>
  );
}


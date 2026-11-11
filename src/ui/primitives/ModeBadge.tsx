import React from 'react';
import type { ExecutionMode } from '@/domain/types';

export function ModeBadge({ mode }: { mode: ExecutionMode }) {
  if (mode === 'auto') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600 text-white shadow-sm">
        ⚡ Auto
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-600 text-white shadow-sm">
      👤 Approval Required
    </span>
  );
}


'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/ui/primitives/Button';
import { StatusBadge } from '@/ui/primitives/StatusBadge';
import { Money } from '@/ui/primitives/Money';
import { ShieldAlert, CheckCircle2, Lock, ArrowLeft } from 'lucide-react';
import type { CaseStatus } from '@/domain/types';

export interface BlockerCase {
  id: string;
  reason: string;
  status: string;
  amountCents: number;
}

export interface DayCloseGateProps {
  blockers: BlockerCase[];
  totalUnacknowledged: number;
  acknowledgedCount: number;
  onClose: () => Promise<void>;
  isClosing?: boolean;
}

export function DayCloseGate({
  blockers,
  totalUnacknowledged,
  acknowledgedCount,
  onClose,
  isClosing = false,
}: DayCloseGateProps) {
  const hasBlockers = blockers.length > 0;
  const hasUnack = acknowledgedCount < totalUnacknowledged;
  const canClose = !hasBlockers && !hasUnack;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Daily Ledger Checkpoint</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verification gate for daily dispute and refund ledger closing.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Queue
        </Link>
      </div>

      {/* Blocker Alert */}
      {hasBlockers ? (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
            <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>Gate Blocked: {blockers.length} actionable case(s) still require decision</span>
          </div>
          <p className="text-xs text-rose-700">
            Day Close requires all active cases to be resolved, executed, or snoozed to a future date.
          </p>
          <div className="space-y-1.5 pt-1">
            {blockers.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between bg-white px-3 py-2 rounded border border-rose-100 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-800">
                    #{b.id.slice(0, 8)}
                  </span>
                  <StatusBadge status={b.status as CaseStatus} />
                  <span className="text-slate-500 text-[11px] truncate max-w-xs">{b.reason}</span>
                </div>
                <Money cents={b.amountCents} className="font-semibold text-slate-900" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-emerald-900">Zero Blocking Cases</h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              All cases in today's triage queue have been resolved, executed, or snoozed.
            </p>
          </div>
        </div>
      )}

      {/* Gate Summary & Close Button */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          <span>Autonomous Acknowledgment: </span>
          <span className="font-semibold text-slate-700">
            {acknowledgedCount} / {totalUnacknowledged} acknowledged
          </span>
        </div>

        <Button
          variant="primary"
          onClick={onClose}
          disabled={!canClose || isClosing}
          className="flex items-center gap-2 text-xs py-2 px-5 bg-blue-600 hover:bg-blue-700 font-semibold"
        >
          <Lock className="h-3.5 w-3.5" />
          {isClosing ? 'Closing Day...' : 'Close Day & Lock Ledger'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { DayCloseGate } from '@/ui/components/DayCloseGate';
import { AckList } from '@/ui/components/AckList';
import { DayCloseGrid, type DayCloseActionItem } from '@/ui/components/DayCloseGrid';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface DayCloseApiResponse {
  canClose: boolean;
  blockers: Array<{
    id: string;
    reason: string;
    status: string;
    amountCents: number;
  }>;
  unacknowledged: Array<{
    id: string;
    caseId: string;
    type: string;
    amountCents?: number;
    createdAt: string;
  }>;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json().catch(() => null);
};

export default function DayClosePage() {
  const { data, error, isLoading, mutate } = useSWR<DayCloseApiResponse>(
    '/api/day/close',
    fetcher
  );

  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [isClosing, setIsClosing] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const handleToggleAck = (id: string) => {
    setAcknowledgedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAckAll = () => {
    if (!data?.unacknowledged) return;
    const allIds = data.unacknowledged.map((u) => u.id);
    if (data.unacknowledged.every((u) => acknowledgedIds.includes(u.id))) {
      setAcknowledgedIds([]);
    } else {
      setAcknowledgedIds(allIds);
    }
  };

  const handleCloseDay = async () => {
    setIsClosing(true);
    setCloseError(null);

    try {
      const res = await fetch('/api/day/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledgedActionIds: acknowledgedIds }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to close day: status ${res.status}`);
      }

      setCloseSuccess(true);
      await mutate();
    } catch (err: any) {
      setCloseError(err.message || 'Failed to close day');
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
        <span className="text-xs">Loading Day Close status...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-xs border border-rose-200">
          Failed to load Day Close status.
        </div>
      </div>
    );
  }

  if (closeSuccess) {
    return (
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center space-y-4 shadow-sm">
          <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-emerald-900">Day Successfully Closed!</h2>
          <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
            All resolved cases have been permanently locked and archived. All automatic actions are acknowledged and the daily reconciliation ledger is finalized.
          </p>
          <div className="pt-3">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
            >
              Return to Spike Queue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const actionsList: DayCloseActionItem[] = (data.unacknowledged || []).map((u) => ({
    id: u.id,
    caseId: u.caseId,
    type: u.type,
    mode: 'auto',
    amountCents: u.amountCents,
    status: 'COMPLETED',
    acknowledgedAt: acknowledgedIds.includes(u.id) ? new Date().toISOString() : null,
    createdAt: u.createdAt,
  }));

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F7FA] py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/90">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-slate-300 active:scale-95 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
            <span>Back to Dispute Queue</span>
          </Link>
          <span className="text-xs font-mono text-slate-400">
            Daily Reconciliation Ledger
          </span>
        </div>

        {closeError && (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-xs border border-rose-200 animate-fade-in">
            {closeError}
          </div>
        )}

        {/* 1. Day Close Gate */}
        <DayCloseGate
          blockers={data.blockers}
          totalUnacknowledged={data.unacknowledged.length}
          acknowledgedCount={acknowledgedIds.length}
          onClose={handleCloseDay}
          isClosing={isClosing}
        />

        {/* 2. Unacknowledged Auto Actions List */}
        <AckList
          items={data.unacknowledged}
          acknowledgedIds={acknowledgedIds}
          onToggle={handleToggleAck}
          onAckAll={handleAckAll}
        />

        {/* 3. Executed Actions Ledger Table */}
        <DayCloseGrid items={actionsList} />
      </div>
    </div>
  );
}

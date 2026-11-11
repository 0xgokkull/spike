'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import type { CaseListItem } from '@/domain/types';
import { SyncBar } from '@/ui/components/SyncBar';
import { QueueGrid } from '@/ui/components/QueueGrid';
import { CaseDrawer } from '@/ui/components/CaseDrawer';
import { DemoControls } from '@/ui/components/DemoControls';
import { Money } from '@/ui/primitives/Money';
import { Layers, AlertTriangle, ShieldCheck, Clock, CheckCircle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function QueuePage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeBucket, setActiveBucket] = useState<'all' | 'actionable' | 'waiting' | 'snoozed' | 'resolved'>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: cases = [], mutate, isValidating } = useSWR<CaseListItem[]>(
    activeBucket === 'all' ? '/api/cases' : `/api/cases?bucket=${activeBucket}`,
    fetcher
  );

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
      await mutate();
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Derived summaries
  const totalCases = cases.length;
  const actionableCount = cases.filter(
    (c) => c.status === 'awaiting_approval' || c.status === 'action_ready' || c.status === 'new'
  ).length;
  const totalAmountAtRiskCents = cases.reduce((acc, c) => acc + c.amountCents, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden">
      {/* 1. Demo Controls Topbar */}
      <DemoControls
        onAdvanceDay={() => mutate()}
        onReset={() => mutate()}
      />

      {/* 2. Sync Status Bar */}
      <SyncBar
        lastSyncAt={new Date().toISOString()}
        paypalMode="sandbox"
        onSync={handleSync}
        isSyncing={isSyncing || isValidating}
      />

      {/* 3. Queue Controls & Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveBucket('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeBucket === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            All Cases ({totalCases})
          </button>
          <button
            onClick={() => setActiveBucket('actionable')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeBucket === 'actionable'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Actionable ({actionableCount})
          </button>
          <button
            onClick={() => setActiveBucket('waiting')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeBucket === 'waiting'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Waiting on PayPal
          </button>
          <button
            onClick={() => setActiveBucket('snoozed')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeBucket === 'snoozed'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Snoozed
          </button>
          <button
            onClick={() => setActiveBucket('resolved')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeBucket === 'resolved'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Resolved
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-slate-500">
            Total at risk:{' '}
            <Money cents={totalAmountAtRiskCents} className="font-bold text-slate-800 text-sm" />
          </div>
        </div>
      </div>

      {/* 4. AG Grid Table Area */}
      <div className="flex-1 relative overflow-hidden">
        <QueueGrid
          items={cases}
          onSelect={(id) => setSelectedCaseId(id)}
          selectedId={selectedCaseId}
        />

        {/* 5. Slide-over Case Drawer */}
        <CaseDrawer
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onCaseUpdated={() => mutate()}
        />
      </div>
    </div>
  );
}

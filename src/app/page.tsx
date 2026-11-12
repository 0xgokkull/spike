'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import type { CaseListItem } from '@/domain/types';
import { SyncBar } from '@/ui/components/SyncBar';
import { QueueGrid } from '@/ui/components/QueueGrid';
import { CaseDrawer } from '@/ui/components/CaseDrawer';
import { PurchaseModal } from '@/ui/components/PurchaseModal';
import { Money } from '@/ui/primitives/Money';
import { Layers, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function QueuePage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeBucket, setActiveBucket] = useState<'all' | 'actionable' | 'waiting' | 'snoozed' | 'resolved'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const { data: cases = [], mutate, isValidating, isLoading } = useSWR<CaseListItem[]>(
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
  const waitingCount = cases.filter((c) => c.status === 'waiting_on_paypal').length;
  const snoozedCount = cases.filter((c) => c.status === 'snoozed').length;
  const resolvedCount = cases.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const totalAmountAtRiskCents = cases.reduce((acc, c) => acc + c.amountCents, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* 1. Unified Control Bar: Live Connection & Actions */}
      <SyncBar
        lastSyncAt={new Date().toISOString()}
        paypalMode="sandbox"
        onSync={handleSync}
        isSyncing={isSyncing || isValidating}
        onOpenPurchase={() => setIsPurchaseModalOpen(true)}
        onAdvanceDay={() => mutate()}
        onReset={() => mutate()}
      />

      {/* 2. Compact Financial Overview Metrics Strip */}
      <div className="px-6 py-3 bg-white border-b border-slate-200/80 flex-shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/60 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Total Cases</span>
              <div className="h-6 w-6 rounded-md bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
                <Layers className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
              {totalCases}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">Active dispute queue</span>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200/90 bg-gradient-to-b from-white to-amber-50/30 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between text-amber-800 mb-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-amber-800 uppercase">Actionable</span>
              <div className="h-6 w-6 rounded-md bg-amber-100/80 border border-amber-300/60 flex items-center justify-center text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-900 tabular-nums tracking-tight">
              {actionableCount}
            </div>
            <span className="text-[11px] text-amber-700/80 font-medium mt-0.5 block">Needs review or decision</span>
          </div>

          <div className="p-3.5 rounded-xl border border-indigo-200/80 bg-gradient-to-b from-white to-indigo-50/30 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-slate-600 uppercase">Amount at Risk</span>
              <div className="h-6 w-6 rounded-md bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
              <Money cents={totalAmountAtRiskCents} />
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">Guarded capital exposure</span>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/30 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between text-emerald-800 mb-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-emerald-800 uppercase">Resolved</span>
              <div className="h-6 w-6 rounded-md bg-emerald-100/80 border border-emerald-300/60 flex items-center justify-center text-emerald-700">
                <CheckCircle className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-950 tabular-nums tracking-tight">
              {resolvedCount}
            </div>
            <span className="text-[11px] text-emerald-700/80 font-medium mt-0.5 block">Closed & ledger locked</span>
          </div>
        </div>
      </div>

      {/* 4. Filter Tabs & Status Sub-header */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 select-none">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100/90 rounded-lg border border-slate-200/70">
          <button
            onClick={() => setActiveBucket('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
              activeBucket === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>All Cases</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
              {totalCases}
            </span>
          </button>
          <button
            onClick={() => setActiveBucket('actionable')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
              activeBucket === 'actionable'
                ? 'bg-white text-amber-900 shadow-xs border border-amber-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Actionable</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono">
              {actionableCount}
            </span>
          </button>
          <button
            onClick={() => setActiveBucket('waiting')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
              activeBucket === 'waiting'
                ? 'bg-white text-blue-900 shadow-xs border border-blue-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Waiting on PayPal</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-mono">
              {waitingCount}
            </span>
          </button>
          <button
            onClick={() => setActiveBucket('snoozed')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
              activeBucket === 'snoozed'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Snoozed</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
              {snoozedCount}
            </span>
          </button>
          <button
            onClick={() => setActiveBucket('resolved')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
              activeBucket === 'resolved'
                ? 'bg-white text-emerald-900 shadow-xs border border-emerald-200/80 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Resolved</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono">
              {resolvedCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-slate-500 font-medium">
            Showing <span className="font-semibold text-slate-800">{cases.length}</span> cases
          </div>
        </div>
      </div>

      {/* 4. AG Grid Table Area */}
      <div className="flex-1 relative overflow-hidden">
        <QueueGrid
          items={cases}
          onSelect={(id) => setSelectedCaseId(id)}
          selectedId={selectedCaseId}
          isLoading={isLoading}
        />

        {/* 5. Slide-over Case Drawer */}
        <CaseDrawer
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onCaseUpdated={() => mutate()}
        />

        {/* 6. Purchase Scenario Modal */}
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          onPurchased={(caseId) => {
            mutate();
            setSelectedCaseId(caseId);
          }}
        />
      </div>
    </div>
  );
}

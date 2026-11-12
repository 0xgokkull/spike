'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import type { CaseListItem } from '@/domain/types';
import { SyncBar } from '@/ui/components/SyncBar';
import { QueueGrid } from '@/ui/components/QueueGrid';
import { CaseDrawer } from '@/ui/components/CaseDrawer';
import { PurchaseModal } from '@/ui/components/PurchaseModal';
import { Money } from '@/ui/primitives/Money';
import { Layers, AlertTriangle, CheckCircle, Scale, ShieldCheck, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function QueuePage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeBucket, setActiveBucket] = useState<'all' | 'actionable' | 'waiting' | 'snoozed' | 'resolved'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [returnBanner, setReturnBanner] = useState<{ type: 'loading' | 'success' | 'error'; message: string } | null>(null);

  // Always fetch full cases list so overall business KPI cards and tab badges stay accurate
  const { data: allCases = [], mutate, isValidating, isLoading } = useSWR<CaseListItem[]>(
    '/api/cases',
    fetcher
  );

  // Auto-capture when returning from PayPal Sandbox redirect
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const payerId = urlParams.get('PayerID');
    const scenario = (urlParams.get('scenario') || 'keyboard_approval') as any;

    if (token && payerId) {
      window.history.replaceState({}, '', window.location.pathname);
      setReturnBanner({ type: 'loading', message: `Verifying & capturing PayPal payment (${token})...` });

      fetch('/api/demo/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'capture',
          scenario,
          orderId: token,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.caseId) {
            setReturnBanner({
              type: 'success',
              message: `Payment captured successfully! New case for "${data.item}" ingested with AI policy recommendation.`,
            });
            mutate();
            setSelectedCaseId(data.caseId);
            setTimeout(() => setReturnBanner(null), 8000);
          } else {
            setReturnBanner({
              type: 'error',
              message: data.message || data.error || 'Failed to capture PayPal payment',
            });
          }
        })
        .catch((err) => {
          setReturnBanner({
            type: 'error',
            message: err.message || 'Error capturing PayPal payment',
          });
        });
    }
  }, [mutate]);

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

  // Today ISO date for snooze calculations
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Global KPI Metrics across all cases
  const totalCases = allCases.length;
  const actionableCount = allCases.filter(
    (c) => c.status === 'awaiting_approval' || c.status === 'action_ready' || c.status === 'new'
  ).length;
  const waitingCount = allCases.filter((c) => c.status === 'waiting_on_paypal').length;
  const snoozedCount = allCases.filter(
    (c) => c.status === 'snoozed' && (!c.snoozedUntil || c.snoozedUntil > today)
  ).length;
  const resolvedCount = allCases.filter(
    (c) => c.status === 'resolved' || c.status === 'closed'
  ).length;
  const totalAmountAtRiskCents = allCases.reduce((acc, c) => acc + c.amountCents, 0);

  // Instant in-memory filtering for selected tab
  const displayedCases = useMemo(() => {
    switch (activeBucket) {
      case 'actionable':
        return allCases.filter(
          (c) => c.status === 'awaiting_approval' || c.status === 'action_ready' || c.status === 'new'
        );
      case 'waiting':
        return allCases.filter((c) => c.status === 'waiting_on_paypal');
      case 'snoozed':
        return allCases.filter(
          (c) => c.status === 'snoozed' && (!c.snoozedUntil || c.snoozedUntil > today)
        );
      case 'resolved':
        return allCases.filter((c) => c.status === 'resolved' || c.status === 'closed');
      case 'all':
      default:
        return allCases;
    }
  }, [allCases, activeBucket, today]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#F5F7FA] py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. Header with PayPal Portal Context & Quick Actions */}
        <SyncBar
          lastSyncAt={new Date().toISOString()}
          paypalMode="sandbox"
          onSync={handleSync}
          isSyncing={isSyncing || isValidating}
          onOpenPurchase={() => setIsPurchaseModalOpen(true)}
          onAdvanceDay={() => mutate()}
          onReset={() => mutate()}
        />

        {/* PayPal Return Auto-Capture Banner */}
        {returnBanner && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between transition-all shadow-xs ${
              returnBanner.type === 'loading'
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : returnBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {returnBanner.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />}
              {returnBanner.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />}
              {returnBanner.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
              <span className="text-sm font-medium">{returnBanner.message}</span>
            </div>
            <button
              onClick={() => setReturnBanner(null)}
              className="text-xs opacity-60 hover:opacity-100 px-2 py-1 font-semibold rounded hover:bg-black/5"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2. Executive Overview Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Queue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Total Cases
              </span>
              <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
              {totalCases}
            </div>
            <span className="text-xs text-slate-400 font-medium mt-1 block">
              Active in resolution queue
            </span>
          </div>

          {/* Card 2: Action Required */}
          <div className="bg-white rounded-2xl p-5 border border-amber-200/90 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between text-amber-800 mb-2">
              <span className="text-[11px] font-bold tracking-wider text-amber-800 uppercase">
                Action Required
              </span>
              <div className="h-7 w-7 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-900 tabular-nums tracking-tight">
              {actionableCount}
            </div>
            <span className="text-xs text-amber-700/80 font-medium mt-1 block">
              Pending review or approval
            </span>
          </div>

          {/* Card 3: Amount at Risk */}
          <div className="bg-white rounded-2xl p-5 border border-indigo-200/80 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between text-indigo-900 mb-2">
              <span className="text-[11px] font-bold tracking-wider text-indigo-800 uppercase">
                Amount at Risk
              </span>
              <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
                <Scale className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
              <Money cents={totalAmountAtRiskCents} />
            </div>
            <span className="text-xs text-slate-400 font-medium mt-1 block">
              Guarded disputed capital
            </span>
          </div>

          {/* Card 4: Resolved */}
          <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
                Resolved
              </span>
              <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-950 tabular-nums tracking-tight">
              {resolvedCount}
            </div>
            <span className="text-xs text-emerald-700/80 font-medium mt-1 block">
              Closed & ledger settled
            </span>
          </div>
        </div>

        {/* 3. Main Card: Structured Dispute Management Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          {/* Card Filter Tabs & Context Strip */}
          <div className="px-5 py-3 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-white select-none">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/70">
              <button
                onClick={() => setActiveBucket('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  activeBucket === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>All Cases</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700 font-mono">
                  {totalCases}
                </span>
              </button>
              <button
                onClick={() => setActiveBucket('actionable')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  activeBucket === 'actionable'
                    ? 'bg-white text-amber-900 shadow-2xs font-bold'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  activeBucket === 'waiting'
                    ? 'bg-white text-blue-900 shadow-2xs font-bold'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  activeBucket === 'snoozed'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  activeBucket === 'resolved'
                    ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Resolved</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                  {resolvedCount}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="font-medium">
                Showing <strong className="text-slate-800 font-bold">{displayedCases.length}</strong> items
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400 font-mono text-[11px]">
                Auto-Refund Cap: $25.00
              </span>
            </div>
          </div>

          {/* Table Container with Dedicated Dimension */}
          <div className="w-full">
            <QueueGrid
              items={displayedCases}
              onSelect={(id) => setSelectedCaseId(id)}
              selectedId={selectedCaseId}
              isLoading={isLoading}
            />
          </div>

          {/* Card Footer: Supervisory Invariants */}
          <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 select-none">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                <strong>Supervised Autonomy Active:</strong> Deterministic gate enforces auto refunds up to $25. Contests & high-value claims require approval.
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              Policy Engine: P-1 to P-5 Active
            </span>
          </div>
        </div>
      </div>

      {/* Slide-over Case Drawer */}
      <CaseDrawer
        caseId={selectedCaseId}
        onClose={() => setSelectedCaseId(null)}
        onCaseUpdated={() => mutate()}
      />

      {/* Purchase Scenario Modal */}
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onPurchased={(caseId) => {
          mutate();
          setSelectedCaseId(caseId);
        }}
      />
    </div>
  );
}

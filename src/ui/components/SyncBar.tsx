'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, ShoppingBag, FastForward, RotateCcw, ShieldCheck } from 'lucide-react';
import { SimulatedLabel } from '@/ui/primitives/SimulatedLabel';
import { Button } from '@/ui/primitives/Button';

export interface SyncBarProps {
  lastSyncAt?: string | null;
  paypalMode?: 'sandbox' | 'fake';
  onSync: () => Promise<void>;
  isSyncing?: boolean;
  onOpenPurchase?: () => void;
  onAdvanceDay?: () => void;
  onReset?: () => void;
}

export function SyncBar({
  lastSyncAt,
  paypalMode = 'fake',
  onSync,
  isSyncing = false,
  onOpenPurchase,
  onAdvanceDay,
  onReset,
}: SyncBarProps) {
  const [mounted, setMounted] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedTime = mounted && lastSyncAt
    ? new Date(lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : lastSyncAt ? 'Recently' : 'Never';

  const handleAdvance = async () => {
    setIsAdvancing(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/demo/advance-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Advance failed');
      setStatusMsg(`Advanced to ${data.today} (+${data.offsetDays}d)`);
      if (onAdvanceDay) onAdvanceDay();
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset demo state to clean initial state?')) return;
    setIsResetting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setStatusMsg('State reset successfully');
      if (onReset) onReset();
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none pb-1">
      {/* Left: PayPal Portal Title & Status Badges */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Resolution Center
          </h1>
          {paypalMode === 'sandbox' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Sandbox</span>
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">In-Memory</span>
              <SimulatedLabel tooltip="Simulated mode active: API actions run against local simulator" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Supervised dispute intake & customer refund resolution</span>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              Synced:{' '}
              <span suppressHydrationWarning className="font-mono text-slate-700 font-medium">
                {formattedTime}
              </span>
            </span>
          </div>

          {statusMsg && (
            <>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-[11px] font-mono text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span>{statusMsg}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions (Make Purchase, Sync, Advance Day, Reset) */}
      <div className="flex items-center gap-2 flex-wrap">
        {onOpenPurchase && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenPurchase}
            className="flex items-center gap-1.5 text-xs bg-[#0070BA] hover:bg-[#005EA6] active:scale-[0.98] text-white shadow-xs transition-all duration-150 py-2 px-3.5 rounded-lg font-semibold"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>+ Make Purchase (Demo)</span>
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 text-xs bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200/90 shadow-2xs transition-all duration-150 py-2 px-3 rounded-lg font-medium"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
        </Button>

        <div className="flex items-center rounded-lg border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAdvance}
            disabled={isAdvancing || isResetting}
            className="bg-white hover:bg-slate-50 active:bg-slate-100 border-none text-slate-700 text-xs py-2 px-2.5 flex items-center gap-1.5 rounded-none font-medium"
            title="Advance system clock by 1 day"
          >
            <FastForward className={`h-3 w-3 ${isAdvancing ? 'animate-spin text-slate-500' : 'text-slate-500'}`} />
            <span>{isAdvancing ? '+1d...' : '+1 Day'}</span>
          </Button>

          <div className="h-4 w-px bg-slate-200" />

          <Button
            variant="secondary"
            size="sm"
            onClick={handleReset}
            disabled={isAdvancing || isResetting}
            className="bg-white hover:bg-slate-50 active:bg-slate-100 border-none text-slate-400 hover:text-slate-700 text-xs py-2 px-2 flex items-center rounded-none"
            title="Reset demo clock state"
          >
            <RotateCcw className={`h-3 w-3 ${isResetting ? 'animate-spin text-slate-400' : 'text-slate-400'}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}

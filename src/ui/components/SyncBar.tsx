'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { SimulatedLabel } from '@/ui/primitives/SimulatedLabel';
import { Button } from '@/ui/primitives/Button';

export interface SyncBarProps {
  lastSyncAt?: string | null;
  paypalMode?: 'sandbox' | 'fake';
  onSync: () => Promise<void>;
  isSyncing?: boolean;
}

export function SyncBar({
  lastSyncAt,
  paypalMode = 'fake',
  onSync,
  isSyncing = false,
}: SyncBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedTime = mounted && lastSyncAt
    ? new Date(lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : lastSyncAt ? 'Recently' : 'Never';

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-3 border-b border-slate-200/80 shadow-2xs select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-medium text-slate-500">PayPal Source:</span>
          {paypalMode === 'sandbox' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
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

        <span className="text-slate-200 hidden sm:inline">|</span>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>Last synced: <span suppressHydrationWarning className="font-mono text-slate-700 font-medium">{formattedTime}</span></span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 text-xs bg-slate-900 text-white hover:bg-slate-800 border-transparent shadow-xs transition-all duration-150"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-blue-300' : 'text-slate-300'}`} />
          <span>{isSyncing ? 'Syncing PayPal...' : 'Sync now'}</span>
        </Button>
      </div>
    </div>
  );
}

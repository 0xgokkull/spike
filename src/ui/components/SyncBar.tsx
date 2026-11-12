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
    <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-5 py-3.5 border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">PayPal Source:</span>
          {paypalMode === 'sandbox' ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sandbox
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">In-Memory</span>
              <SimulatedLabel tooltip="Simulated mode active: API actions run against local simulator" />
            </div>
          )}
        </div>

        <span className="text-slate-300">|</span>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
          <span>Last synced: <span suppressHydrationWarning className="font-medium text-slate-700">{formattedTime}</span></span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
          {isSyncing ? 'Syncing...' : 'Sync now'}
        </Button>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { FastForward, RotateCcw, Calendar, Clock } from 'lucide-react';
import { Button } from '@/ui/primitives/Button';

export interface DemoControlsProps {
  onAdvanceDay?: () => void;
  onReset?: () => void;
}

export function DemoControls({ onAdvanceDay, onReset }: DemoControlsProps) {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

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
    if (!confirm('Reset demo state to initial seed data?')) return;
    setIsResetting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/demo/reset', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reset failed');
      setStatusMsg('Demo state reset successfully');
      if (onReset) onReset();
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border-b border-slate-200/80 px-6 py-2 text-xs select-none">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAdvance}
          disabled={isAdvancing || isResetting}
          className="bg-white hover:bg-slate-50 active:bg-slate-100 border-slate-300 text-slate-800 text-[11px] py-1 px-2.5 flex items-center gap-1.5 shadow-xs transition-all duration-150"
        >
          <FastForward className={`h-3 w-3 ${isAdvancing ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
          <span>{isAdvancing ? 'Advancing...' : 'Advance Day (+1d)'}</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
          disabled={isAdvancing || isResetting}
          className="bg-white hover:bg-slate-50 active:bg-slate-100 border-slate-300/80 text-slate-700 text-[11px] py-1 px-2.5 flex items-center gap-1.5 shadow-xs transition-all duration-150"
        >
          <RotateCcw className={`h-3 w-3 ${isResetting ? 'animate-spin text-slate-500' : 'text-slate-500'}`} />
          <span>{isResetting ? 'Resetting...' : 'Reset Demo State'}</span>
        </Button>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-900 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200/80 animate-fade-in">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
          <span>{statusMsg}</span>
        </div>
      )}
    </div>
  );
}

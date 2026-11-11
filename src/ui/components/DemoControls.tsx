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
    <div className="flex items-center gap-3 bg-amber-50/80 border-b border-amber-200/80 px-5 py-2 text-xs">
      <div className="flex items-center gap-1.5 font-bold text-amber-900">
        <Clock className="h-3.5 w-3.5 text-amber-700" />
        <span>Demo Simulator Controls</span>
      </div>

      <span className="text-amber-300">|</span>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleAdvance}
          disabled={isAdvancing || isResetting}
          className="bg-white hover:bg-amber-100/70 border-amber-300 text-amber-900 text-[11px] py-1 px-2.5 flex items-center gap-1"
        >
          <FastForward className="h-3 w-3" />
          {isAdvancing ? 'Advancing...' : 'Advance Day (+1d)'}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
          disabled={isAdvancing || isResetting}
          className="bg-white hover:bg-amber-100/70 border-amber-300 text-amber-900 text-[11px] py-1 px-2.5 flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          {isResetting ? 'Resetting...' : 'Reset Demo State'}
        </Button>
      </div>

      {statusMsg && (
        <span className="ml-auto text-[11px] font-mono text-amber-800 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200">
          {statusMsg}
        </span>
      )}
    </div>
  );
}

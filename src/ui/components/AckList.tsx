'use client';

import React from 'react';
import { CheckSquare, Square, Zap, CheckCircle2 } from 'lucide-react';
import { Money } from '@/ui/primitives/Money';

export interface UnacknowledgedAction {
  id: string;
  caseId: string;
  type: string;
  amountCents?: number;
  createdAt: string;
}

export interface AckListProps {
  items: UnacknowledgedAction[];
  acknowledgedIds: string[];
  onToggle: (id: string) => void;
  onAckAll: () => void;
}

export function AckList({
  items,
  acknowledgedIds,
  onToggle,
  onAckAll,
}: AckListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <div>
          <h4 className="text-xs font-bold text-emerald-900">All Auto Actions Acknowledged</h4>
          <p className="text-xs text-emerald-700 mt-0.5">
            No pending autonomous actions require acknowledgment.
          </p>
        </div>
      </div>
    );
  }

  const allSelected = items.every((i) => acknowledgedIds.includes(i.id));

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Unacknowledged Autonomous Actions ({items.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={onAckAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          {allSelected ? 'Deselect All' : 'Acknowledge All'}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        The supervisor must review and acknowledge all autonomous actions before closing the daily ledger.
      </p>

      <div className="space-y-2">
        {items.map((item) => {
          const isChecked = acknowledgedIds.includes(item.id);
          const timeStr = new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                isChecked
                  ? 'bg-blue-50/50 border-blue-200 text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                {isChecked ? (
                  <CheckSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-slate-400 flex-shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs capitalize">
                      Auto {item.type.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Case #{item.caseId.slice(0, 8)}
                    </span>
                  </div>
                  <span suppressHydrationWarning className="text-[10px] text-slate-400">{timeStr}</span>
                </div>
              </div>

              {item.amountCents !== undefined && (
                <Money cents={item.amountCents} className="text-xs font-bold text-slate-800" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

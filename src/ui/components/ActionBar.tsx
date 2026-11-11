'use client';

import React, { useState } from 'react';
import type { CaseDetail } from '@/domain/types';
import { Button } from '@/ui/primitives/Button';
import { CheckCircle2, Edit3, Clock, AlertCircle } from 'lucide-react';
import { fromCents, toCents, formatMoney } from '@/lib/money';

export interface ActionBarProps {
  detail: CaseDetail;
  onDecide: (decision: {
    decision: 'approve' | 'edit' | 'snooze';
    editedRefundAmountCents?: number;
    editedNarrative?: string;
    snoozeUntil?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function ActionBar({ detail, onDecide, isSubmitting = false }: ActionBarProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSnoozeDialog, setShowSnoozeDialog] = useState(false);

  // Edit form state
  const initialAmount = detail.recommendation?.refundAmountCents
    ? fromCents(detail.recommendation.refundAmountCents)
    : '';
  const [editAmount, setEditAmount] = useState(initialAmount);
  const [editNarrative, setEditNarrative] = useState(
    detail.recommendation?.evidenceNarrative || detail.recommendation?.rationale || ''
  );
  const [editError, setEditError] = useState('');

  // Snooze form state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const [snoozeDate, setSnoozeDate] = useState(tomorrowStr);
  const [snoozeError, setSnoozeError] = useState('');

  const canApprove = detail.availableDecisions.includes('approve');
  const canEdit = detail.availableDecisions.includes('edit');
  const canSnooze = detail.availableDecisions.includes('snooze');

  const approveDisabledReason = detail.disabledReasons?.approve;
  const editDisabledReason = detail.disabledReasons?.edit;
  const snoozeDisabledReason = detail.disabledReasons?.snooze;

  const handleApprove = async () => {
    await onDecide({ decision: 'approve' });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    let refundAmountCents: number | undefined = undefined;
    if (detail.recommendation?.action === 'refund' || editAmount.trim()) {
      try {
        refundAmountCents = toCents(editAmount);
        if (refundAmountCents <= 0) {
          setEditError('Refund amount must be greater than $0.00');
          return;
        }
        if (refundAmountCents > detail.amountCents) {
          setEditError(`Amount cannot exceed order total of ${formatMoney(detail.amountCents)}`);
          return;
        }
      } catch {
        setEditError('Invalid dollar amount format (e.g. 10.00)');
        return;
      }
    }

    try {
      await onDecide({
        decision: 'edit',
        editedRefundAmountCents: refundAmountCents,
        editedNarrative: editNarrative.trim() || undefined,
      });
      setShowEditDialog(false);
    } catch (err: any) {
      setEditError(err.message || 'Failed to apply edit decision');
    }
  };

  const handleSnoozeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSnoozeError('');

    if (!snoozeDate) {
      setSnoozeError('A valid future snooze date is required');
      return;
    }

    try {
      await onDecide({
        decision: 'snooze',
        snoozeUntil: snoozeDate,
      });
      setShowSnoozeDialog(false);
    } catch (err: any) {
      setSnoozeError(err.message || 'Failed to snooze case');
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        {/* 1. Approve Button */}
        <div className="flex-1" title={!canApprove ? approveDisabledReason : undefined}>
          <Button
            variant="primary"
            className="w-full flex items-center justify-center gap-1.5 font-semibold text-xs py-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleApprove}
            disabled={!canApprove || isSubmitting}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSubmitting ? 'Processing...' : 'Approve Recommendation'}
          </Button>
        </div>

        {/* 2. Edit Button */}
        <div title={!canEdit ? editDisabledReason : undefined}>
          <Button
            variant="secondary"
            className="flex items-center gap-1.5 text-xs py-2 px-3 text-slate-700"
            onClick={() => setShowEditDialog(true)}
            disabled={!canEdit || isSubmitting}
          >
            <Edit3 className="h-3.5 w-3.5 text-slate-500" />
            Edit
          </Button>
        </div>

        {/* 3. Snooze Button */}
        <div title={!canSnooze ? snoozeDisabledReason : undefined}>
          <Button
            variant="outline"
            className="flex items-center gap-1.5 text-xs py-2 px-3 text-slate-600"
            onClick={() => setShowSnoozeDialog(true)}
            disabled={!canSnooze || isSubmitting}
          >
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            Snooze
          </Button>
        </div>
      </div>

      {/* Disabled reason hints if case is not actionable */}
      {!canApprove && approveDisabledReason && (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
          <span>{approveDisabledReason}</span>
        </div>
      )}

      {/* Edit Dialog Modal */}
      {showEditDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">Edit Proposed Action</h3>
              <button
                type="button"
                onClick={() => setShowEditDialog(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              {detail.recommendation?.action === 'refund' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Refund Amount ($ USD)
                  </label>
                  <input
                    type="text"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="10.00"
                    className="w-full px-3 py-1.5 text-xs font-mono border rounded border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Order max refundable: {formatMoney(detail.amountCents)}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evidence Narrative / Seller Note
                </label>
                <textarea
                  rows={4}
                  value={editNarrative}
                  onChange={(e) => setEditNarrative(e.target.value)}
                  placeholder="Explain reason for manual adjustment..."
                  className="w-full px-3 py-1.5 text-xs border rounded border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {editError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save & Execute'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Snooze Dialog Modal */}
      {showSnoozeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">Snooze Case</h3>
              <button
                type="button"
                onClick={() => setShowSnoozeDialog(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSnoozeSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Snooze Until Date
                </label>
                <input
                  type="date"
                  value={snoozeDate}
                  min={tomorrowStr}
                  onChange={(e) => setSnoozeDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border rounded border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quick choices */}
              <div className="flex gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    setSnoozeDate(d.toISOString().slice(0, 10));
                  }}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px]"
                >
                  +1d
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 3);
                    setSnoozeDate(d.toISOString().slice(0, 10));
                  }}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px]"
                >
                  +3d
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    setSnoozeDate(d.toISOString().slice(0, 10));
                  }}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px]"
                >
                  +7d
                </button>
              </div>

              {snoozeError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2 rounded border border-rose-200">
                  {snoozeError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSnoozeDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Snoozing...' : 'Confirm Snooze'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

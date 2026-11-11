'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import type { CaseDetail } from '@/domain/types';
import { StatusBadge } from '@/ui/primitives/StatusBadge';
import { ModeBadge } from '@/ui/primitives/ModeBadge';
import { DeadlineChip } from '@/ui/primitives/DeadlineChip';
import { SimulatedLabel } from '@/ui/primitives/SimulatedLabel';
import { Money } from '@/ui/primitives/Money';
import { ProvenancePanel } from './ProvenancePanel';
import { EventTimeline } from './EventTimeline';
import { ActionBar } from './ActionBar';
import { X, Sparkles, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { formatMoney } from '@/lib/money';

export interface CaseDrawerProps {
  caseId: string | null;
  onClose: () => void;
  onCaseUpdated?: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CaseDrawer({ caseId, onClose, onCaseUpdated }: CaseDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: detail, error, isLoading, mutate } = useSWR<CaseDetail>(
    caseId ? `/api/cases/${caseId}` : null,
    fetcher
  );

  if (!caseId) return null;

  const handleDecide = async (decision: {
    decision: 'approve' | 'edit' | 'snooze';
    editedRefundAmountCents?: number;
    editedNarrative?: string;
    snoozeUntil?: string;
  }) => {
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/cases/${caseId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decision),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to submit decision: status ${res.status}`);
      }

      await mutate();
      if (onCaseUpdated) {
        onCaseUpdated();
      }
    } catch (err: any) {
      setActionError(err.message || 'Decision failed to apply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl bg-white border-l border-slate-200 shadow-2xl flex flex-col">
      {/* 1. Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-bold text-slate-800">
            Case #{caseId.slice(0, 8)}
          </span>
          {detail?.source && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold uppercase">
              {detail.source.replace('_', ' ')}
            </span>
          )}
          {detail?.simulated && <SimulatedLabel />}
          {detail?.status && <StatusBadge status={detail.status} />}
          {detail?.deadlineAt && <DeadlineChip deadlineAt={detail.deadlineAt} />}
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
          title="Close drawer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 2. Drawer Body (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-xs">Loading case details...</span>
          </div>
        ) : error || !detail ? (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-xs border border-rose-200">
            Failed to load case detail.
          </div>
        ) : (
          <>
            {actionError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Buyer Message (Untrusted Plain Text) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                  <span>Buyer Message</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                  Untrusted Text
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-text">
                {detail.buyerMessage || '(No message content provided by buyer)'}
              </div>
            </div>

            {/* Recommendation Card */}
            {detail.recommendation && (
              <div className="bg-indigo-50/50 border border-indigo-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-900">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>Agent Recommendation</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-normal bg-indigo-100 text-indigo-700">
                      {detail.recommendation.origin === 'llm' ? 'AI Generated' : 'Deterministic Fallback'}
                    </span>
                  </div>
                  <ModeBadge mode={detail.recommendation.mode} />
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="font-bold text-slate-900 text-sm capitalize">
                    {detail.recommendation.action.replace('_', ' ')}
                  </span>
                  {detail.recommendation.refundAmountCents && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Proposed Refund</span>
                      <Money
                        cents={detail.recommendation.refundAmountCents}
                        className="text-base font-bold text-indigo-900"
                      />
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-indigo-100">
                  {detail.recommendation.rationale}
                </p>
              </div>
            )}

            {/* Provenance Panel */}
            {detail.provenance && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Audit Provenance
                </h4>
                <ProvenancePanel provenance={detail.provenance} />
              </div>
            )}

            {/* Event Timeline */}
            <div className="pt-2 border-t border-slate-200">
              <EventTimeline events={detail.events} />
            </div>
          </>
        )}
      </div>

      {/* 3. Sticky Action Bar Footer */}
      {detail && (
        <ActionBar
          detail={detail}
          onDecide={handleDecide}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

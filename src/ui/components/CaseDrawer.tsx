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
import { X, Sparkles, MessageSquare, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
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

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
    <>
      {/* Backdrop with blur and click to dismiss */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-200"
      />

      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-xl bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slide-in-right">
        {/* 1. Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all mr-1.5 active:scale-95"
              title="Return to Dispute Queue (Esc)"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
              <span>Back to Queue</span>
            </button>
            <span className="font-mono text-sm font-bold text-slate-900">
              Case #{caseId.slice(0, 8)}
            </span>
            {detail?.source && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                {detail.source.replace('_', ' ')}
              </span>
            )}
            {detail?.simulated && <SimulatedLabel />}
            {detail?.status && <StatusBadge status={detail.status} />}
            {detail?.deadlineAt && <DeadlineChip deadlineAt={detail.deadlineAt} />}
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 2. Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg animate-fade-in">
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
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide font-mono">
                    Untrusted Narrative
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-text">
                  {detail.buyerMessage || '(No message content provided by buyer)'}
                </div>
              </div>

              {/* Recommendation Card */}
              {detail.recommendation && (
                <div className="bg-gradient-to-br from-indigo-50/60 via-white to-blue-50/30 border border-indigo-100/90 rounded-xl p-4 space-y-3 shadow-xs">
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
                        <span className="text-[10px] text-slate-400 block font-medium">Proposed Refund</span>
                        <Money
                          cents={detail.recommendation.refundAmountCents}
                          className="text-base font-bold text-indigo-950"
                        />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-lg border border-indigo-100/80 shadow-2xs">
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
              <div className="pt-2 border-t border-slate-200/80">
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
    </>
  );
}

'use client';

import React from 'react';
import type { Actor } from '@/domain/types';
import {
  History,
  Bot,
  User,
  Globe,
  Server,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Sparkles,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { formatMoney } from '@/lib/money';

interface EventItem {
  id: number;
  type: string;
  actor: Actor;
  payload: unknown;
  at: string;
}

export interface EventTimelineProps {
  events: EventItem[];
}

const ACTOR_CONFIG: Record<Actor, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  system: {
    label: 'Spike System',
    icon: <Server className="h-3 w-3 text-slate-500" />,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
  },
  agent: {
    label: 'Spike AI Agent',
    icon: <Bot className="h-3 w-3 text-purple-600" />,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
  },
  agent_auto: {
    label: 'Spike Autonomous Agent',
    icon: <Zap className="h-3 w-3 text-emerald-600" />,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  },
  seller: {
    label: 'Merchant Admin',
    icon: <User className="h-3 w-3 text-blue-600" />,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
  },
  paypal: {
    label: 'PayPal Sandbox Webhook',
    icon: <Globe className="h-3 w-3 text-amber-600" />,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
  },
};

function formatStatus(status: string) {
  if (!status) return 'NEW';
  return status.replace(/_/g, ' ').toUpperCase();
}

function getEventTitle(type: string, payload: any): string {
  switch (type) {
    case 'case.created':
      return 'Case Ingested into Queue';
    case 'agent.recommended':
      return payload?.action
        ? `AI Recommendation: Propose ${payload.action.replace(/_/g, ' ').toUpperCase()}`
        : 'AI Recommendation Generated';
    case 'action.started':
      return payload?.type
        ? `Initiated PayPal Action: ${payload.type.toUpperCase()}`
        : 'PayPal Action Started';
    case 'action.succeeded':
      return 'PayPal Action Executed Successfully';
    case 'action.failed':
      return 'PayPal API Execution Failed';
    case 'case.transitioned': {
      const to = payload?.to ? formatStatus(payload.to) : 'UPDATED';
      return `Status Transitioned to ${to}`;
    }
    default:
      return type.replace(/\./g, ' • ').toUpperCase();
  }
}

function renderPayloadSummary(type: string, payload: any) {
  if (!payload || typeof payload !== 'object') return null;

  switch (type) {
    case 'case.transitioned': {
      const from = Array.isArray(payload.from) ? payload.from.join(', ') : payload.from;
      const to = payload.to;
      const isFailed = to === 'exec_failed';
      const isResolved = to === 'resolved' || to === 'closed';

      return (
        <div className="space-y-2 mt-1">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              {formatStatus(from || 'new')}
            </span>
            <ArrowRight className="h-3 w-3 text-slate-400" />
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                isFailed
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : isResolved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-blue-50 text-blue-700 border-blue-300'
              }`}
            >
              {formatStatus(to || 'unknown')}
            </span>

            {payload.outcome && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-medium">
                Outcome: {payload.outcome}
              </span>
            )}
          </div>

          {payload.error && (
            <div className="p-2.5 bg-rose-50/80 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
                <span>Transition Error</span>
              </div>
              <p className="text-[11px] font-sans leading-relaxed text-rose-700">
                {payload.error}
              </p>
            </div>
          )}
        </div>
      );
    }

    case 'agent.recommended': {
      return (
        <div className="mt-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-600 font-medium">Proposed Action:</span>
            <span className="font-bold text-slate-900 capitalize bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md text-xs">
              {payload.action?.replace(/_/g, ' ') || 'Review'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
              Mode: {payload.mode === 'auto' ? 'Autonomous Execution' : 'Merchant Approval Required'}
            </span>
          </div>

          {payload.rationale && (
            <p className="text-xs text-slate-700 bg-purple-50/30 p-2.5 rounded-lg border border-purple-100 leading-relaxed font-sans">
              &ldquo;{payload.rationale}&rdquo;
            </p>
          )}
        </div>
      );
    }

    case 'action.started': {
      return (
        <div className="mt-1 text-xs text-blue-800 bg-blue-50/60 p-2.5 rounded-lg border border-blue-200/80 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-blue-600 animate-spin flex-shrink-0" />
          <span>
            Dispatched action to PayPal API:{' '}
            <strong className="uppercase font-mono font-bold text-blue-900">
              {payload.type}
            </strong>
          </span>
        </div>
      );
    }

    case 'action.succeeded': {
      return (
        <div className="mt-1 space-y-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-semibold text-emerald-950 block">
                PayPal action executed successfully
              </span>
              <span className="text-[11px] text-emerald-700">
                The settlement was confirmed with PayPal Sandbox and the ledger is locked.
              </span>
            </div>
          </div>

          {payload.refs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {payload.refs.refundId && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">PayPal Refund ID</span>
                  <span className="font-bold text-slate-900">{payload.refs.refundId}</span>
                </div>
              )}
              {payload.refs.disputeId && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Dispute ID</span>
                  <span className="font-bold text-slate-900">{payload.refs.disputeId}</span>
                </div>
              )}
              {payload.refs.status && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Settlement Status</span>
                  <span className="font-bold text-emerald-700 uppercase">{payload.refs.status}</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    case 'action.failed': {
      const errMsg = payload.error || 'PayPal execution failed unexpectedly';
      return (
        <div className="mt-1 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-rose-950">
            <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>PayPal Execution Failed</span>
          </div>
          <p className="text-xs font-sans text-rose-900 leading-relaxed">
            {errMsg}
          </p>
          <div className="text-[11px] text-rose-700/90 pt-1 border-t border-rose-200/60 font-medium">
            Action required: Check the case details or issue a direct refund to resolve the customer dispute.
          </div>
        </div>
      );
    }

    case 'case.created': {
      return (
        <div className="mt-1 text-xs text-slate-700 space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
          <p className="font-medium text-slate-900">
            Dispute received and registered into the supervised intake queue.
          </p>
          {payload.amountCents && (
            <p className="text-slate-600 text-[11px]">
              Dispute Amount:{' '}
              <span className="font-bold text-slate-900">
                {formatMoney(payload.amountCents)}
              </span>
            </p>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

export function EventTimeline({ events }: EventTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-xs text-slate-400 italic py-3 text-center bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
        No recorded events for this case.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-blue-600" />
          <span>Audit Event Timeline</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 font-normal">
          {events.length} {events.length === 1 ? 'event' : 'events'} recorded
        </span>
      </div>

      <div className="relative border-l-2 border-slate-200 ml-3 space-y-5 py-2">
        {events.map((e) => {
          const cfg = ACTOR_CONFIG[e.actor] || ACTOR_CONFIG.system;
          const dateStr = new Date(e.at).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          const title = getEventTitle(e.type, e.payload);

          return (
            <div key={e.id} className="relative pl-6 group">
              {/* Timeline marker dot */}
              <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-2xs group-hover:scale-110 transition-transform" />

              {/* Event Header: Actor Badge & Timestamp */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.badgeClass}`}>
                    {cfg.icon}
                    <span>{cfg.label}</span>
                  </span>
                </div>
                <span suppressHydrationWarning className="text-[10px] text-slate-400 font-mono">
                  {dateStr}
                </span>
              </div>

              {/* Event Card (Clean & Human-Readable) */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs hover:border-slate-300 transition-colors space-y-2">
                <div className="text-xs font-bold text-slate-900 tracking-tight">
                  {title}
                </div>

                {/* Formatted payload summary */}
                {renderPayloadSummary(e.type, e.payload)}

                {/* Developer Technical Payload (Strictly Collapsible, Zero Clutter) */}
                {Boolean(e.payload && typeof e.payload === 'object' && Object.keys(e.payload as object).length > 0) && (
                  <details className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 group/payload">
                    <summary className="cursor-pointer hover:text-slate-600 select-none font-medium flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>Technical payload (JSON)</span>
                    </summary>
                    <pre className="mt-2 p-2 rounded-lg bg-slate-900 text-slate-200 text-[10px] font-mono overflow-x-auto max-h-40 leading-relaxed select-text">
                      {JSON.stringify(e.payload, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

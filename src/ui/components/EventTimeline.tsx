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

const ACTOR_CONFIG: Record<Actor, { label: string; icon: React.ReactNode; color: string }> = {
  system: {
    label: 'System',
    icon: <Server className="h-3.5 w-3.5 text-slate-500" />,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  agent: {
    label: 'Spike AI Agent',
    icon: <Bot className="h-3.5 w-3.5 text-purple-600" />,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  agent_auto: {
    label: 'Spike Autonomous Agent',
    icon: <Zap className="h-3.5 w-3.5 text-emerald-600" />,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  seller: {
    label: 'Merchant (Admin)',
    icon: <User className="h-3.5 w-3.5 text-blue-600" />,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  paypal: {
    label: 'PayPal Sandbox Webhook',
    icon: <Globe className="h-3.5 w-3.5 text-amber-600" />,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').toUpperCase();
}

function renderPayloadSummary(type: string, payload: any) {
  if (!payload || typeof payload !== 'object') return null;

  switch (type) {
    case 'case.transitioned': {
      const from = Array.isArray(payload.from) ? payload.from.join(', ') : payload.from;
      const to = payload.to;
      const isFailed = to === 'exec_failed';
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {formatStatus(from || 'new')}
            </span>
            <ArrowRight className="h-3 w-3 text-slate-400" />
            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                isFailed
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {formatStatus(to || 'unknown')}
            </span>
            {payload.outcome && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                Outcome: {payload.outcome}
              </span>
            )}
          </div>
          {payload.error && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{payload.error}</span>
            </div>
          )}
        </div>
      );
    }

    case 'agent.recommended': {
      return (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-600">Proposed Action:</span>
          <span className="font-semibold text-slate-900 capitalize bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-[11px]">
            {payload.action}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            Mode: {payload.mode}
          </span>
        </div>
      );
    }

    case 'action.started': {
      return (
        <div className="text-xs text-slate-700 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-blue-500 animate-spin" />
          <span>
            Executing PayPal action: <strong className="uppercase font-mono">{payload.type}</strong>
          </span>
        </div>
      );
    }

    case 'action.succeeded': {
      return (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>PayPal action executed successfully</span>
          </div>
          {payload.refs && (
            <div className="flex items-center gap-2 flex-wrap font-mono text-[10px] text-slate-600 bg-emerald-50/50 p-1.5 rounded border border-emerald-100">
              {payload.refs.refundId && <span>Refund ID: {payload.refs.refundId}</span>}
              {payload.refs.disputeId && <span>Dispute: {payload.refs.disputeId}</span>}
              {payload.refs.status && <span>Status: {payload.refs.status}</span>}
            </div>
          )}
        </div>
      );
    }

    case 'action.failed': {
      return (
        <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            <span>PayPal execution failed</span>
          </div>
          {payload.error && <p className="text-[11px] font-mono">{payload.error}</p>}
        </div>
      );
    }

    case 'case.created': {
      return (
        <div className="text-xs text-slate-700 space-y-0.5">
          <p className="font-medium">Case received and queued for automated intake</p>
          {payload.amountCents && (
            <p className="text-slate-500 text-[11px]">
              Dispute Amount: <span className="font-semibold text-slate-800">{formatMoney(payload.amountCents)}</span>
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
      <div className="text-xs text-slate-400 italic py-2">
        No recorded events for this case.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider">
        <History className="h-3.5 w-3.5 text-slate-500" />
        <span>Audit Event Timeline</span>
      </div>

      <div className="relative border-l border-slate-200 ml-2.5 space-y-4 py-1">
        {events.map((e) => {
          const cfg = ACTOR_CONFIG[e.actor] || ACTOR_CONFIG.system;
          const dateStr = new Date(e.at).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <div key={e.id} className="relative pl-5 group">
              {/* Timeline marker dot */}
              <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow-2xs group-hover:scale-110 transition-transform" />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.color}`}>
                    {cfg.icon}
                    <span>{cfg.label}</span>
                  </span>
                </div>
                <span suppressHydrationWarning className="text-[10px] text-slate-400 font-mono">
                  {dateStr}
                </span>
              </div>

              {/* Human-Readable Event Content */}
              <div className="mt-2 bg-white rounded-lg border border-slate-200/80 p-2.5 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                  <span className="capitalize">{e.type.replace(/\./g, ' • ')}</span>
                </div>

                {renderPayloadSummary(e.type, e.payload)}

                {/* Collapsible Technical Details (No raw JSON clutter by default!) */}
                {Boolean(e.payload && typeof e.payload === 'object' && Object.keys(e.payload as object).length > 0) && (
                  <details className="pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                    <summary className="cursor-pointer hover:text-slate-600 select-none">
                      Technical payload
                    </summary>
                    <pre className="mt-1 p-1.5 rounded bg-slate-50 border border-slate-100 text-[10px] text-slate-600 font-mono overflow-x-auto max-h-32">
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

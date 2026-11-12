import React from 'react';
import type { Actor } from '@/domain/types';
import { History, Bot, User, Globe, Server } from 'lucide-react';

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

const ACTOR_ICONS: Record<Actor, React.ReactNode> = {
  system: <Server className="h-3.5 w-3.5 text-slate-500" />,
  agent: <Bot className="h-3.5 w-3.5 text-purple-600" />,
  agent_auto: <Bot className="h-3.5 w-3.5 text-emerald-600" />,
  seller: <User className="h-3.5 w-3.5 text-blue-600" />,
  paypal: <Globe className="h-3.5 w-3.5 text-amber-600" />,
};

const ACTOR_LABELS: Record<Actor, string> = {
  system: 'System',
  agent: 'AI Agent',
  agent_auto: 'Agent (Auto)',
  seller: 'Seller (Manual)',
  paypal: 'PayPal Webhook',
};

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
          const dateStr = new Date(e.at).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <div key={e.id} className="relative pl-5 group">
              {/* Timeline dot */}
              <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white bg-slate-400 group-hover:bg-blue-500 transition-colors" />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {ACTOR_ICONS[e.actor] || ACTOR_ICONS.system}
                  <span className="text-xs font-semibold text-slate-800">
                    {ACTOR_LABELS[e.actor] || e.actor}
                  </span>
                </div>
                <span suppressHydrationWarning className="text-[10px] text-slate-400 font-mono">{dateStr}</span>
              </div>

              <div className="mt-1 text-xs text-slate-600">
                <span className="font-mono text-[11px] font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                  {e.type}
                </span>
              </div>

              {e.payload && typeof e.payload === 'object' && Object.keys(e.payload).length > 0 ? (
                <pre className="mt-1.5 p-2 rounded bg-slate-50 border border-slate-100 text-[10px] text-slate-600 font-mono overflow-x-auto">
                  {JSON.stringify(e.payload, null, 2)}
                </pre>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

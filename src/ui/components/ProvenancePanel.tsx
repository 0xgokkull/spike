import React from 'react';
import type { Provenance } from '@/domain/types';
import { EvidenceChecklist } from './EvidenceChecklist';
import { ModeBadge } from '@/ui/primitives/ModeBadge';
import { Money } from '@/ui/primitives/Money';
import { ShieldCheck, Package, ExternalLink, Cpu } from 'lucide-react';

export interface ProvenancePanelProps {
  provenance: Provenance;
}

export function ProvenancePanel({ provenance }: ProvenancePanelProps) {
  const { policyClause, order, tracking, evidence, paypalAction, execution } = provenance;

  return (
    <div className="space-y-4 text-xs text-slate-700">
      {/* 1. Policy Clause Match */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm space-y-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>Policy Rule Citation</span>
          <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
            {policyClause.id}
          </span>
        </div>
        <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-100">
          "{policyClause.text}"
        </p>
      </div>

      {/* 2. Order & Tracking DB Records */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm space-y-2.5">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Package className="h-4 w-4 text-slate-600" />
          <span>Fulfillment & Carrier Facts</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-slate-50 p-2 rounded">
            <span className="text-slate-400 block text-[10px]">Order Item</span>
            <span className="font-medium text-slate-800 truncate block">{order.item}</span>
          </div>
          <div className="bg-slate-50 p-2 rounded">
            <span className="text-slate-400 block text-[10px]">Order Total</span>
            <Money cents={order.amountCents} className="text-slate-900 font-semibold" />
          </div>
          <div className="bg-slate-50 p-2 rounded">
            <span className="text-slate-400 block text-[10px]">Carrier / Tracking</span>
            <span className="font-mono font-medium text-slate-800 block truncate">
              {tracking.carrier || 'No carrier'} • {tracking.number || 'No tracking'}
            </span>
          </div>
          <div className="bg-slate-50 p-2 rounded">
            <span className="text-slate-400 block text-[10px]">Carrier Status</span>
            <span className="font-semibold capitalize text-slate-800 block">
              {tracking.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Evidence Checklist */}
      <EvidenceChecklist
        required={evidence.required}
        present={evidence.present}
        missing={evidence.missing}
        score={evidence.score}
      />

      {/* 4. PayPal API Call Specification */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm space-y-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <ExternalLink className="h-4 w-4 text-slate-600" />
          <span>Target PayPal API Call</span>
        </div>
        <div className="font-mono text-[11px] bg-slate-900 text-slate-200 p-2.5 rounded space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
              {paypalAction.method}
            </span>
            <span className="truncate text-slate-300">{paypalAction.endpoint}</span>
          </div>
          {paypalAction.amountCents !== undefined && (
            <div className="text-emerald-400 text-[10px] pt-1">
              Amount: <Money cents={paypalAction.amountCents} className="text-emerald-300" />
            </div>
          )}
        </div>
      </div>

      {/* 5. Autonomy Gate Evaluation */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Cpu className="h-4 w-4 text-purple-600" />
            <span>Deterministic Gate</span>
          </div>
          <ModeBadge mode={execution.mode} />
        </div>
        <ul className="space-y-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
          {execution.reasons.map((r, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

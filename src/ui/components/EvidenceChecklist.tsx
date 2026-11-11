import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface EvidenceChecklistProps {
  required: string[];
  present: string[];
  missing: string[];
  score: string;
}

const EVIDENCE_LABELS: Record<string, string> = {
  carrier: 'Valid Shipping Carrier',
  trackingNumber: 'Tracking Number',
  deliveryStatus: 'Delivery Status',
  deliveredAt: 'Delivery Timestamp',
  deliveryReceiptPdf: 'Signed Delivery Receipt (PDF)',
};

export function EvidenceChecklist({
  required,
  present,
  missing,
  score,
}: EvidenceChecklistProps) {
  const isComplete = missing.length === 0;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Evidence Completeness
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
            isComplete
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}
        >
          {score}
        </span>
      </div>

      <div className="space-y-1.5">
        {required.map((item) => {
          const isPresent = present.includes(item);
          const label = EVIDENCE_LABELS[item] || item;

          return (
            <div
              key={item}
              className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white border border-slate-100"
            >
              <span className="text-slate-700 font-medium">{label}</span>
              {isPresent ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-500 font-semibold">
                  <XCircle className="h-3.5 w-3.5" />
                  Missing
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!isComplete && (
        <div className="flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>Contest action requires 100% evidence completeness. Missing items will block submission.</span>
        </div>
      )}
    </div>
  );
}

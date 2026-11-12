'use client';

import React, { useState } from 'react';
import { ShoppingBag, X, Zap, ShieldAlert, UserCheck, MessageSquare, Loader2, Check } from 'lucide-react';
import { Button } from '@/ui/primitives/Button';

export interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchased: (caseId: string) => void;
}

interface ScenarioConfig {
  id: 'earbuds_auto' | 'watch_contest' | 'keyboard_approval' | 'backpack_snooze';
  title: string;
  price: string;
  reason: string;
  badge: string;
  badgeColor: string;
  carrier: string;
  tracking: string;
  claim: string;
  expectedOutcome: string;
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'earbuds_auto',
    title: 'Wireless Noise-Canceling Earbuds',
    price: '$20.00',
    reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
    badge: 'Under $25 Cap • Auto-Triage',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    carrier: 'USPS',
    tracking: 'In Transit • Not Delivered',
    claim: 'Tracking has been stuck for 5 days and parcel never arrived.',
    expectedOutcome: 'Autonomous Refund or Seller Reply based on live tracking',
  },
  {
    id: 'watch_contest',
    title: 'Vintage Mechanical Watch',
    price: '$120.00',
    reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
    badge: 'Contest with Delivery Proof',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    carrier: 'FedEx',
    tracking: 'Delivered (Proof of Delivery on file)',
    claim: 'Checked porch and mailbox, watch is missing. Wants full refund.',
    expectedOutcome: 'AI recommends Contest with 100% evidence & PDF package',
  },
  {
    id: 'keyboard_approval',
    title: 'Custom Mechanical Keyboard',
    price: '$85.00',
    reason: 'MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED',
    badge: 'Over $25 Cap • Seller Approval',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    carrier: 'UPS',
    tracking: 'Delivered 2 days ago',
    claim: 'Keyboard arrived with two sticky keys. Requesting return/refund.',
    expectedOutcome: 'Autonomy gate requires merchant approval for refund',
  },
  {
    id: 'backpack_snooze',
    title: 'Leather Travel Backpack',
    price: '$45.00',
    reason: 'OTHER (Customer Inquiry)',
    badge: 'Buyer Inquiry • Snooze/Reply',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    carrier: 'USPS',
    tracking: 'In Transit • Shipped yesterday',
    claim: 'Traveling tomorrow evening, needs urgent delivery confirmation.',
    expectedOutcome: 'AI drafts polite update message and recommends snooze',
  },
];

export function PurchaseModal({ isOpen, onClose, onPurchased }: PurchaseModalProps) {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePurchase = async (scenarioId: string) => {
    setLoadingScenario(scenarioId);
    setError(null);

    try {
      const res = await fetch('/api/demo/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Purchase failed to simulate');
      }

      onPurchased(data.caseId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create purchase');
    } finally {
      setLoadingScenario(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <ShoppingBag className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Customer Storefront Demo</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate a customer purchase and dispute scenario to showcase live AI triage on Spike.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Scenarios Grid */}
        <div className="p-6 overflow-y-auto space-y-3.5">
          {SCENARIOS.map((item) => {
            const isLoading = loadingScenario === item.id;
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200/90 hover:border-blue-400/80 bg-white hover:bg-slate-50/50 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-900 tracking-tight">
                      {item.title}
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-700">
                      {item.price}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
                    <span>Carrier: {item.carrier}</span>
                    <span>•</span>
                    <span className="text-slate-600 font-medium">{item.tracking}</span>
                  </div>

                  <p className="text-xs text-slate-600 italic bg-slate-50/80 px-2.5 py-1.5 rounded border border-slate-100">
                    &ldquo;{item.claim}&rdquo;
                  </p>

                  <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1 mt-1">
                    <Zap className="h-3 w-3 text-blue-500" />
                    <span>{item.expectedOutcome}</span>
                  </div>
                </div>

                <div className="flex-shrink-0 sm:self-center">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlePurchase(item.id)}
                    disabled={loadingScenario !== null}
                    className="w-full sm:w-auto text-xs py-2 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Triaging AI...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Buy & Triage</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Clicking an item simulates purchase, files claim, and runs Groq AI evaluation.</span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}


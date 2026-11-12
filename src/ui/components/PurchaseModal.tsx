'use client';

import React, { useState } from 'react';
import { ShoppingBag, X, Zap, Loader2, ExternalLink, Check, Copy, ArrowLeft, ShieldCheck } from 'lucide-react';
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
    badge: 'Under $25 Cap • Auto-Refund',
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

interface PendingOrder {
  orderId: string;
  approveLink?: string;
  item: string;
  amount: string;
  scenario: string;
  buyerEmail?: string;
  buyerPassword?: string;
}

export function PurchaseModal({ isOpen, onClose, onPurchased }: PurchaseModalProps) {
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, field: 'email' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateOrder = async (scenarioId: string) => {
    setLoadingScenario(scenarioId);
    setError(null);

    try {
      const res = await fetch('/api/demo/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', scenario: scenarioId }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || data.message || 'Failed to initialize PayPal order');
      }

      setPendingOrder({
        orderId: data.orderId,
        approveLink: data.approveLink,
        item: data.item,
        amount: data.amount,
        scenario: data.scenario,
        buyerEmail: data.buyerEmail,
        buyerPassword: data.buyerPassword,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to connect to PayPal Sandbox');
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleCaptureOrder = async () => {
    if (!pendingOrder) return;
    setIsCapturing(true);
    setError(null);

    try {
      const res = await fetch('/api/demo/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'capture',
          scenario: pendingOrder.scenario,
          orderId: pendingOrder.orderId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || 'Capture failed');
      }

      onPurchased(data.caseId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment not yet approved on PayPal. Please click the payment link first.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleInstantPurchase = async (scenarioId: string) => {
    setLoadingScenario(scenarioId);
    setError(null);

    try {
      const res = await fetch('/api/demo/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'instant', scenario: scenarioId }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || 'Instant purchase failed');
      }

      onPurchased(data.caseId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to simulate purchase');
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
              <h2 className="text-sm font-bold text-slate-900">
                {pendingOrder ? 'Complete PayPal Sandbox Payment' : 'Live Storefront Purchase (Demo)'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {pendingOrder
                  ? 'Original order created on PayPal Sandbox. Pay with sandbox buyer account.'
                  : 'Make an original PayPal sandbox purchase to test live dispute triage and real refund deductions.'}
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

        {/* Step 2: Pending Order View */}
        {pendingOrder ? (
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Order Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  PayPal Sandbox Order
                </span>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  #{pendingOrder.orderId}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-semibold text-slate-900">{pendingOrder.item}</span>
                <span className="font-mono font-bold text-base text-slate-900">${pendingOrder.amount} USD</span>
              </div>
            </div>

            {/* Buyer Sandbox Credentials Box */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <ShieldCheck className="h-4 w-4 text-amber-700" />
                <span>Sandbox Buyer Account Credentials (Use on PayPal Login)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {/* Email */}
                <div className="p-2.5 rounded bg-white border border-amber-200/80 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <span className="text-[10px] text-slate-400 block uppercase">Email</span>
                    <span className="text-slate-800 font-semibold truncate block">
                      {pendingOrder.buyerEmail || 'sb-zuuk553858995@personal.example.com'}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(
                        pendingOrder.buyerEmail || 'sb-zuuk553858995@personal.example.com',
                        'email'
                      )
                    }
                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                    title="Copy Email"
                  >
                    {copiedField === 'email' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Password */}
                <div className="p-2.5 rounded bg-white border border-amber-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Password</span>
                    <span className="text-slate-600 font-mono tracking-widest block select-none">
                      ••••••••••••
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(pendingOrder.buyerPassword || ':R9i^Ak,', 'password')
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-sans font-medium transition-colors"
                    title="Copy Password"
                  >
                    {copiedField === 'password' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              {pendingOrder.approveLink && (
                <a
                  href={pendingOrder.approveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#0070BA] hover:bg-[#003087] text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>1. Open PayPal Sandbox & Pay Now (Opens New Tab)</span>
                </a>
              )}

              <Button
                variant="primary"
                onClick={handleCaptureOrder}
                disabled={isCapturing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying & Capturing PayPal Funds...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>2. I Paid on PayPal — Capture & Ingest Case</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setPendingOrder(null)}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to item catalog</span>
              </button>
            </div>
          </div>
        ) : (
          /* Step 1: Catalog List */
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

                  <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCreateOrder(item.id)}
                      disabled={loadingScenario !== null}
                      className="w-full sm:w-auto text-xs py-2 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Connecting PayPal...</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Original Purchase</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInstantPurchase(item.id)}
                      disabled={loadingScenario !== null}
                      title="Direct one-click intake for recording"
                      className="w-full sm:w-auto text-xs py-2 px-2.5 text-slate-600 hover:text-slate-900 whitespace-nowrap"
                    >
                      <span>Instant 1-Click</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Connected to Live PayPal Sandbox ({'https://api-m.sandbox.paypal.com'}).</span>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProvenancePanel } from '@/ui/components/ProvenancePanel';
import { ActionBar } from '@/ui/components/ActionBar';
import type { CaseDetail, Provenance } from '@/domain/types';

describe('ProvenancePanel Component', () => {
  const mockProvenance: Provenance = {
    policyClause: {
      id: 'P-INR-1',
      text: 'If tracking shows in transit over 14 days, refund buyer in full.',
    },
    order: {
      id: 'ord_123',
      item: 'Leather Jacket',
      amountCents: 4500,
      currency: 'USD',
    },
    tracking: {
      carrier: 'USPS',
      number: '9400111899223100000000',
      status: 'in_transit',
      deliveredAt: null,
    },
    evidence: {
      required: ['carrier', 'trackingNumber', 'deliveryStatus'],
      present: ['carrier', 'trackingNumber', 'deliveryStatus'],
      missing: [],
      score: '100%',
    },
    paypalAction: {
      label: 'Refund Buyer',
      method: 'POST',
      endpoint: '/v2/payments/captures/cap_123/refund',
      amountCents: 4500,
    },
    execution: {
      mode: 'auto',
      reasons: ['Amount <= cap $50.00', 'Eligible INR reason', 'Tracking not delivered'],
    },
  };

  it('renders policy clause citation and text', () => {
    render(<ProvenancePanel provenance={mockProvenance} />);
    expect(screen.getByText('P-INR-1')).toBeDefined();
    expect(screen.getByText(/"If tracking shows in transit over 14 days, refund buyer in full."/)).toBeDefined();
  });

  it('renders order facts and carrier tracking information', () => {
    render(<ProvenancePanel provenance={mockProvenance} />);
    expect(screen.getByText('Leather Jacket')).toBeDefined();
    expect(screen.getAllByText('$45.00').length).toBeGreaterThan(0);
    expect(screen.getByText(/USPS • 9400111899223100000000/)).toBeDefined();
  });

  it('renders evidence completeness score and verified checkmarks', () => {
    render(<ProvenancePanel provenance={mockProvenance} />);
    expect(screen.getByText('100%')).toBeDefined();
    const verifiedTags = screen.getAllByText('Verified');
    expect(verifiedTags.length).toBe(3);
  });
});

describe('ActionBar Component', () => {
  const mockDetail: CaseDetail = {
    id: 'case_1',
    source: 'dispute',
    status: 'awaiting_approval',
    reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
    amountCents: 4500,
    currency: 'USD',
    deadlineAt: '2026-11-20T00:00:00.000Z',
    snoozedUntil: null,
    simulated: false,
    order: {
      id: 'ord_1',
      item: 'Shoes',
      amountCents: 4500,
      currency: 'USD',
      carrier: 'UPS',
      trackingNumber: '1Z9999999999999999',
      trackingStatus: 'delivered',
    },
    buyerMessage: 'Did not get item',
    recommendation: {
      id: 'rec_1',
      action: 'contest',
      policyClauseId: 'P-INR-1',
      rationale: 'Item was delivered with tracking proof.',
      mode: 'approval',
      gateReasons: ['Contest action requires seller approval'],
      origin: 'llm',
    },
    provenance: null,
    events: [],
    availableDecisions: ['approve', 'edit', 'snooze'],
    disabledReasons: {},
  };

  it('renders buttons in enabled state when decisions are available', () => {
    const onDecide = vi.fn();
    render(<ActionBar detail={mockDetail} onDecide={onDecide} />);

    const approveBtn = screen.getByRole('button', { name: /approve recommendation/i });
    const editBtn = screen.getByRole('button', { name: /edit/i });
    const snoozeBtn = screen.getByRole('button', { name: /snooze/i });

    expect(approveBtn.hasAttribute('disabled')).toBe(false);
    expect(editBtn.hasAttribute('disabled')).toBe(false);
    expect(snoozeBtn.hasAttribute('disabled')).toBe(false);
  });

  it('triggers onDecide with approve decision when clicked', () => {
    const onDecide = vi.fn();
    render(<ActionBar detail={mockDetail} onDecide={onDecide} />);

    const approveBtn = screen.getByRole('button', { name: /approve recommendation/i });
    fireEvent.click(approveBtn);

    expect(onDecide).toHaveBeenCalledWith({ decision: 'approve' });
  });

  it('disables approve button when not in availableDecisions and displays disabled reason', () => {
    const disabledDetail: CaseDetail = {
      ...mockDetail,
      status: 'resolved',
      availableDecisions: [],
      disabledReasons: {
        approve: 'Case already resolved',
      },
    };

    const onDecide = vi.fn();
    render(<ActionBar detail={disabledDetail} onDecide={onDecide} />);

    const approveBtn = screen.getByRole('button', { name: /approve recommendation/i });
    expect(approveBtn.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Case already resolved')).toBeDefined();
  });
});

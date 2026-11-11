// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DayCloseGate } from '@/ui/components/DayCloseGate';

describe('DayCloseGate Component', () => {
  it('enables close button when there are zero blockers and all auto actions are acknowledged', () => {
    const onClose = vi.fn();
    render(
      <DayCloseGate
        blockers={[]}
        totalUnacknowledged={2}
        acknowledgedCount={2}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close day & lock ledger/i });
    expect(closeBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('disables close button and shows blocker alert when active cases remain', () => {
    const onClose = vi.fn();
    const mockBlockers = [
      {
        id: 'case_blocker_1',
        reason: 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED',
        status: 'awaiting_approval',
        amountCents: 3500,
      },
    ];

    render(
      <DayCloseGate
        blockers={mockBlockers}
        totalUnacknowledged={0}
        acknowledgedCount={0}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close day & lock ledger/i });
    expect(closeBtn.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText(/Gate Blocked: 1 actionable case\(s\) still require decision/i)).toBeDefined();
    expect(screen.getByText(/#case_blo/i)).toBeDefined();
  });

  it('disables close button when unacknowledged actions are pending', () => {
    const onClose = vi.fn();
    render(
      <DayCloseGate
        blockers={[]}
        totalUnacknowledged={3}
        acknowledgedCount={1}
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close day & lock ledger/i });
    expect(closeBtn.hasAttribute('disabled')).toBe(true);
  });
});

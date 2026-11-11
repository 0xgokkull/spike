import { describe, it, expect, beforeEach } from 'vitest';
import { clock } from '@/lib/clock';

describe('simulated clock', () => {
  beforeEach(() => {
    clock.setOffsetDays(0);
  });

  it('reports current date by default', () => {
    expect(clock.getOffsetDays()).toBe(0);
    const now = clock.now();
    const today = clock.todayIso();
    expect(today).toBe(now.toISOString().split('T')[0]);
  });

  it('advances date when offset is set', () => {
    const start = clock.now().getTime();
    clock.setOffsetDays(3);
    const advanced = clock.now().getTime();
    const diffDays = Math.round((advanced - start) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(3);
    expect(clock.getOffsetDays()).toBe(3);
  });
});


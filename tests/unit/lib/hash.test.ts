import { describe, it, expect } from 'vitest';
import { idempotencyKey } from '@/lib/hash';

describe('idempotencyKey', () => {
  it('generates consistent sha256 hex string for same inputs', () => {
    const key1 = idempotencyKey(['case-1', 'refund', 1000]);
    const key2 = idempotencyKey(['case-1', 'refund', 1000]);
    expect(key1).toBe(key2);
    expect(key1).toHaveLength(64);
  });

  it('generates distinct keys for different inputs', () => {
    const key1 = idempotencyKey(['case-1', 'refund', 1000]);
    const key2 = idempotencyKey(['case-1', 'refund', 1001]);
    expect(key1).not.toBe(key2);
  });

  it('handles null and undefined gracefully', () => {
    const key = idempotencyKey(['case-1', null, undefined]);
    expect(key).toHaveLength(64);
  });
});


import { createHash } from 'node:crypto';

export function idempotencyKey(parts: (string | number | boolean | null | undefined)[]): string {
  const normalized = parts.map((p) => (p === null || p === undefined ? '' : String(p))).join('|');
  return createHash('sha256').update(normalized).digest('hex');
}


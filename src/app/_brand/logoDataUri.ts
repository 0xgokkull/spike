import { logoSvg } from '@/ui/brand/logo';

// Server-only helper for next/og image routes (uses Node's Buffer).
export function logoDataUri(opts?: { tile?: boolean }): string {
  return `data:image/svg+xml;base64,${Buffer.from(logoSvg(opts)).toString('base64')}`;
}

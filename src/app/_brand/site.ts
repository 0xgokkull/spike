export const SITE = {
  name: 'Spike',
  title: 'Spike | Supervised Autonomy for PayPal Disputes',
  tagline: 'Supervised autonomy for PayPal refunds and disputes',
  description:
    'Spike is an AI operations desk for PayPal sellers. It triages refund requests and disputes against your store policy, acts on its own within limits you set, and asks before anything material.',
  keywords: [
    'PayPal',
    'disputes',
    'refunds',
    'chargebacks',
    'AI agent',
    'supervised autonomy',
    'e-commerce',
    'seller tools',
    'resolution center',
  ],
  ink: '#3A3A3A',
  paper: '#EDEDEB',
} as const;

export function siteUrl(): URL {
  const raw = process.env.APP_BASE_URL || 'http://localhost:3001';
  try {
    return new URL(raw);
  } catch {
    return new URL('http://localhost:3000');
  }
}

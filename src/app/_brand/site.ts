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
  let raw = process.env.APP_BASE_URL;
  if (!raw || (raw.includes('localhost') && (process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL))) {
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      raw = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else if (process.env.VERCEL_URL) {
      raw = `https://${process.env.VERCEL_URL}`;
    } else {
      raw = 'http://localhost:3001';
    }
  }
  try {
    return new URL(raw);
  } catch {
    return new URL('http://localhost:3001');
  }
}

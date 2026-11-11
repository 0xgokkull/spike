import { env } from '@/lib/env';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export const PAYPAL_SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';

interface TokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;

export async function getPayPalToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = env.PAYPAL_CLIENT_ID;
  const clientSecret = env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new AppError('PAYPAL_ERROR', 'Missing PayPal credentials in sandbox mode');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${PAYPAL_SANDBOX_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const errorText = await res.text();
    logger.error('Failed to get PayPal OAuth token', { status: res.status, errorText });
    throw new AppError('PAYPAL_ERROR', `PayPal authentication failed (${res.status})`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

export async function paypalRequest<T = any>(
  endpoint: string,
  options: RequestInit & { requestId?: string } = {}
): Promise<{ status: number; data: T }> {
  const token = await getPayPalToken();
  const url = endpoint.startsWith('http') ? endpoint : `${PAYPAL_SANDBOX_BASE}${endpoint}`;

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.requestId) {
    headers.set('PayPal-Request-Id', options.requestId);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err: any) {
    logger.error('PayPal network request failed', { url, error: err.message });
    throw new AppError('PAYPAL_ERROR', `Network error contacting PayPal: ${err.message}`);
  }

  const contentType = res.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    logger.error('PayPal API error', {
      url,
      status: res.status,
      debugId: res.headers.get('paypal-debug-id'),
      data,
    });
    throw new AppError('PAYPAL_ERROR', `PayPal API call failed (${res.status})`, {
      status: res.status,
      debugId: res.headers.get('paypal-debug-id'),
      details: data,
    });
  }

  return { status: res.status, data };
}

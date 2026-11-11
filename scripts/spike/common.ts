import * as fs from 'node:fs';
import * as path from 'node:path';

export const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getAccessToken(): Promise<{ token: string; scope: string; app_id: string }> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in environment');
  }

  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return { token: cachedToken, scope: '', app_id: '' };
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get OAuth token (${res.status}): ${text}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number; scope: string; app_id: string };
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in - 60) * 1000;

  return { token: data.access_token, scope: data.scope, app_id: data.app_id };
}

export async function paypalFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; headers: Headers; data: any }> {
  const { token } = await getAccessToken();
  const url = endpoint.startsWith('http') ? endpoint : `${PAYPAL_API_BASE}${endpoint}`;

  const headers = new Headers(options.headers);
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, headers: res.headers, data };
}

export function saveFixture(filename: string, data: any) {
  const dir = path.resolve('tests/fixtures/paypal');
  fs.mkdirSync(dir, { recursive: true });
  const sanitized = JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (['access_token', 'client_secret', 'client_id'].includes(key)) {
        return '[REDACTED]';
      }
      return value;
    })
  );
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(sanitized, null, 2) + '\n');
  console.log(`Saved fixture: tests/fixtures/paypal/${filename}`);
}


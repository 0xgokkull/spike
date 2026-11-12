import { paypalRequest } from './http';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/errors';

export interface CreateOrderParams {
  item: string;
  amount: string; // e.g. "20.00"
  currency?: string;
  referenceId: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CreateOrderResult {
  orderId: string;
  approveLink?: string;
  status: string;
}

export interface CaptureOrderResult {
  orderId: string;
  captureId?: string;
  status: string;
  amount?: string;
  currency?: string;
}

export async function createPayPalOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const currency = params.currency || 'USD';
  const defaultBaseUrl = env.APP_BASE_URL || 'http://localhost:3001';
  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: params.referenceId,
        description: params.item,
        amount: {
          currency_code: currency,
          value: params.amount,
        },
      },
    ],
    application_context: {
      return_url: params.returnUrl || `${defaultBaseUrl}/`,
      cancel_url: params.cancelUrl || `${defaultBaseUrl}/`,
      user_action: 'PAY_NOW',
    },
  };

  logger.info(`Creating PayPal Sandbox order for ${params.item} (${params.amount} ${currency})...`);
  const res = await paypalRequest('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.status !== 201 && res.status !== 200) {
    throw new AppError('PAYPAL_ERROR', `Failed to create PayPal order (${res.status}): ${JSON.stringify(res.data)}`);
  }

  const approveLink = res.data.links?.find((l: any) => l.rel === 'approve' || l.rel === 'payer-action')?.href;
  return {
    orderId: res.data.id,
    approveLink,
    status: res.data.status,
  };
}

export async function getPayPalOrder(orderId: string): Promise<{
  id: string;
  status: string;
  captureId?: string;
}> {
  const res = await paypalRequest(`/v2/checkout/orders/${orderId}`);
  const capture = res.data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    id: res.data.id,
    status: res.data.status,
    captureId: capture?.id,
  };
}

export async function capturePayPalOrder(orderId: string): Promise<CaptureOrderResult> {
  logger.info(`Capturing PayPal Sandbox order ${orderId}...`);
  const res = await paypalRequest(`/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  if (res.status !== 201 && res.status !== 200) {
    throw new AppError('PAYPAL_ERROR', `Failed to capture PayPal order (${res.status}): ${JSON.stringify(res.data)}`);
  }

  const capture = res.data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    orderId: res.data.id,
    captureId: capture?.id,
    status: res.data.status,
    amount: capture?.amount?.value,
    currency: capture?.amount?.currency_code,
  };
}

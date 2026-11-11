import * as fs from 'node:fs';
import * as path from 'node:path';
import { paypalFetch, saveFixture } from './common.ts';

export async function refundCapture(
  captureId: string,
  amount: string,
  currency: string = 'USD',
  requestId: string,
  note: string = 'Spike test refund'
) {
  const body = {
    amount: {
      value: amount,
      currency_code: currency,
    },
    note_to_payer: note,
  };

  const res = await paypalFetch(`/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      'PayPal-Request-Id': requestId,
    },
    body: JSON.stringify(body),
  });

  return { status: res.status, data: res.data };
}

export async function getRefund(refundId: string) {
  const res = await paypalFetch(`/v2/payments/refunds/${refundId}`);
  return { status: res.status, data: res.data };
}

async function main() {
  const filePath = path.resolve('scripts/sandbox-orders.json');
  if (!fs.existsSync(filePath)) {
    console.error('No sandbox orders found.');
    process.exit(1);
  }

  const orders = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const refundOrder = orders.find((o: any) => o.referenceId === 'ORD-REFUND-1' || o.captureId);

  if (!refundOrder?.captureId) {
    console.error('Refund order has not been captured yet. Complete Step C first.');
    process.exit(1);
  }

  const captureId = refundOrder.captureId;
  const requestId = `spike-req-${Date.now()}`;
  console.log(`\n--- Step H: Refund Capture with Idempotency ---`);
  console.log(`Capture ID: ${captureId}`);
  console.log(`Idempotency Request ID: ${requestId}`);

  console.log('\n1. Issuing first refund call...');
  const first = await refundCapture(captureId, '15.00', 'USD', requestId, 'Partial refund test 1');
  console.log(`First refund status: ${first.status}`);
  if (first.status !== 201 && first.status !== 200) {
    console.error('First refund failed:', first.data);
    process.exit(1);
  }
  const refundId = first.data.id;
  console.log(`Refund created! ID: ${refundId}, status: ${first.data.status}`);
  saveFixture('spike-h-refund-first.json', first.data);

  console.log('\n2. Testing idempotency: Repeating the exact same refund call with same PayPal-Request-Id...');
  const second = await refundCapture(captureId, '15.00', 'USD', requestId, 'Partial refund test 1');
  console.log(`Second refund status: ${second.status}`);
  console.log(`Second refund ID returned: ${second.data.id}`);

  const isIdempotent = second.data.id === refundId;
  console.log(`Idempotency check passed? ${isIdempotent ? 'YES' : 'NO'}`);
  saveFixture('spike-h-refund-idempotent.json', second.data);

  console.log('\n3. Retrieving refund details via GET /v2/payments/refunds/{id}...');
  const retrieved = await getRefund(refundId);
  console.log(`Retrieval status: ${retrieved.status}, Refund Status: ${retrieved.data.status}`);
  saveFixture('spike-h-refund-retrieved.json', retrieved.data);

  console.log('\nStep H completed successfully!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Step H failed:', err.message);
    process.exit(1);
  });
}


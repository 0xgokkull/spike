import * as fs from 'node:fs';
import * as path from 'node:path';
import { paypalFetch, saveFixture } from './common.ts';

export async function createDisputeAPI(captureId: string, amount: string, reason: string = 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED') {
  const payload = {
    disputed_transactions: [
      {
        seller_transaction_id: captureId,
      },
    ],
    reason,
    dispute_amount: {
      currency_code: 'USD',
      value: amount,
    },
  };

  const res = await paypalFetch('/v1/customer/disputes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { status: res.status, data: res.data };
}

async function main() {
  console.log('--- Step D: Create Dispute ---');
  const filePath = path.resolve('scripts/sandbox-orders.json');
  if (!fs.existsSync(filePath)) {
    console.error('No sandbox orders found.');
    process.exit(1);
  }

  const orders = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const disputeOrder = orders.find((o: any) => o.referenceId === 'ORD-DISPUTE-1' || o.item?.includes('Dispute'));

  if (!disputeOrder?.captureId) {
    console.error('Dispute order has not been captured yet. Complete Step C first.');
    process.exit(1);
  }

  const captureId = disputeOrder.captureId;
  console.log(`Attempting Route A (API creation) using Capture ID: ${captureId}...`);

  try {
    const res = await createDisputeAPI(captureId, disputeOrder.amount, 'MERCHANDISE_OR_SERVICE_NOT_RECEIVED');
    console.log(`Route A API status: ${res.status}`);
    if (res.status === 201 || res.status === 200) {
      console.log('Dispute created via API successfully!');
      console.log('Dispute ID:', res.data.dispute_id || res.data.id);
      disputeOrder.disputeId = res.data.dispute_id || res.data.id;
      fs.writeFileSync(filePath, JSON.stringify(orders, null, 2) + '\n');
      saveFixture('spike-d-dispute-created.json', res.data);
      return;
    } else {
      console.log('Route A API returned status:', res.status, res.data);
      saveFixture('spike-d-api-attempt.json', res.data);
    }
  } catch (err: any) {
    console.log('Route A API error:', err.message);
  }

  console.log('\n--- Route B (Buyer Wallet Fallback) ---');
  console.log('If Route A is restricted, open a dispute as the sandbox buyer in the sandbox wallet:');
  console.log('1. Go to https://www.sandbox.paypal.com and log in with your sandbox buyer credentials.');
  console.log(`2. Locate transaction for Capture ID: ${captureId}`);
  console.log('3. Click "Report a problem" -> "I didn\'t receive an item I purchased"');
  console.log('4. Once created, run scripts/spike/e-fetch.ts to retrieve it.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Step D failed:', err.message);
    process.exit(1);
  });
}

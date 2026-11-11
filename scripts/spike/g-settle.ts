import * as fs from 'node:fs';
import * as path from 'node:path';
import { paypalFetch, saveFixture } from './common.ts';
import { getDispute } from './e-fetch.ts';

export async function settleDisputeSandbox(disputeId: string, outcome: 'seller' | 'buyer' = 'seller') {
  const adjudicationOutcome = outcome === 'seller' ? 'RESOLVED_SELLER_FAVOUR' : 'RESOLVED_BUYER_FAVOUR';
  console.log(`Attempting sandbox adjudication with ${adjudicationOutcome}...`);

  let res = await paypalFetch(`/v1/customer/disputes/${disputeId}/adjudicate`, {
    method: 'POST',
    body: JSON.stringify({
      adjudication_outcome: adjudicationOutcome,
    }),
  });

  if (res.status === 404 || res.status === 400) {
    console.log(`POST /adjudicate returned ${res.status}. Trying alternative outcome format...`);
    res = await paypalFetch(`/v1/customer/disputes/${disputeId}/adjudicate`, {
      method: 'POST',
      body: JSON.stringify({
        outcome: outcome === 'seller' ? 'SELLER_FAVOUR' : 'BUYER_FAVOUR',
      }),
    });
  }

  return { status: res.status, data: res.data };
}

async function main() {
  console.log('--- Step G: Settle Dispute in Sandbox ---');
  const filePath = path.resolve('scripts/sandbox-orders.json');
  let disputeId = process.argv[2];

  if (!disputeId && fs.existsSync(filePath)) {
    const orders = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const disputeOrder = orders.find((o: any) => o.disputeId);
    disputeId = disputeOrder?.disputeId;
  }

  if (!disputeId) {
    console.error('No dispute ID found. Pass as argument: g-settle.ts <disputeId>');
    process.exit(1);
  }

  console.log(`Settling dispute: ${disputeId}...`);
  const settleRes = await settleDisputeSandbox(disputeId, 'seller');
  console.log(`Settle response status: ${settleRes.status}`, settleRes.data);
  saveFixture('spike-g-settle-response.json', settleRes.data || { status: settleRes.status });

  console.log('\nFetching dispute to verify state change...');
  const detailRes = await getDispute(disputeId);
  console.log(`New dispute status: ${detailRes.data.status}`);
  console.log(`Dispute outcome/lifecycle stage: ${detailRes.data.dispute_outcome?.outcome_code || detailRes.data.status}`);
  saveFixture('spike-g-dispute-settled.json', detailRes.data);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Step G failed:', err.message);
    process.exit(1);
  });
}

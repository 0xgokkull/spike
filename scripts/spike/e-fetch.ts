import * as fs from 'node:fs';
import * as path from 'node:path';
import { paypalFetch, saveFixture } from './common.ts';

export async function listDisputes() {
  const res = await paypalFetch('/v1/customer/disputes');
  return { status: res.status, data: res.data };
}

export async function getDispute(disputeId: string) {
  const res = await paypalFetch(`/v1/customer/disputes/${disputeId}`);
  return { status: res.status, data: res.data };
}

async function main() {
  console.log('--- Step E: Fetch Dispute as Merchant ---');
  const filePath = path.resolve('scripts/sandbox-orders.json');
  let disputeId: string | null = null;

  if (fs.existsSync(filePath)) {
    const orders = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const disputeOrder = orders.find((o: any) => o.disputeId);
    if (disputeOrder) {
      disputeId = disputeOrder.disputeId;
    }
  }

  console.log('Listing disputes from /v1/customer/disputes...');
  const listRes = await listDisputes();
  console.log(`List disputes status: ${listRes.status}`);

  if (listRes.status !== 200) {
    console.error('Failed to list disputes:', listRes.data);
    process.exit(1);
  }

  saveFixture('spike-e-disputes-list.json', listRes.data);
  const items = listRes.data.items || [];
  console.log(`Found ${items.length} disputes.`);

  if (!disputeId && items.length > 0) {
    disputeId = items[0].dispute_id;
  }

  if (!disputeId) {
    console.log('No disputes found yet on the sandbox account. Please create or open one (Step D).');
    return;
  }

  console.log(`\nFetching detail for dispute: ${disputeId}...`);
  const detailRes = await getDispute(disputeId);
  console.log(`Detail status: ${detailRes.status}`);

  if (detailRes.status !== 200) {
    console.error('Failed to get dispute detail:', detailRes.data);
    process.exit(1);
  }

  const dispute = detailRes.data;
  saveFixture('spike-e-dispute-detail.json', dispute);

  console.log('\n--- Dispute Details & Facts ---');
  console.log('Status:', dispute.status);
  console.log('Reason:', dispute.reason);
  console.log('Seller Response Due Date field:', dispute.seller_response_due_date || dispute.response_due_date || dispute.due_date || '(none found)');
  console.log('Available HATEOAS links:');
  (dispute.links || []).forEach((l: any) => console.log(`  - rel: "${l.rel}", method: ${l.method}, href: ${l.href}`));

  const hasWaitingStatus = dispute.status === 'WAITING_FOR_SELLER_RESPONSE';
  const hasEvidenceLink = (dispute.links || []).some((l: any) => l.rel === 'provide-evidence');
  const hasAcceptClaimLink = (dispute.links || []).some((l: any) => l.rel === 'accept-claim');

  console.log(`\nChecks:`);
  console.log(`- Status is WAITING_FOR_SELLER_RESPONSE: ${hasWaitingStatus ? 'PASS' : 'FAIL (' + dispute.status + ')'}`);
  console.log(`- "provide-evidence" link present: ${hasEvidenceLink ? 'PASS' : 'FAIL'}`);
  console.log(`- "accept-claim" link present: ${hasAcceptClaimLink ? 'PASS' : 'FAIL'}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Step E failed:', err.message);
    process.exit(1);
  });
}


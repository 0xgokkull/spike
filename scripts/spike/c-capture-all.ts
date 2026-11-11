import * as fs from 'node:fs';
import * as path from 'node:path';
import { getOrder, captureOrder } from './c-order.ts';
import { saveFixture } from './common.ts';

async function main() {
  const filePath = path.resolve('scripts/sandbox-orders.json');
  if (!fs.existsSync(filePath)) {
    console.error('No scripts/sandbox-orders.json found. Run c-order.ts first.');
    process.exit(1);
  }

  const orders = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updatedOrders = [];

  for (const order of orders) {
    console.log(`\nChecking order ${order.orderId} (${order.item})...`);
    if (order.captureId) {
      console.log(`Already captured: ${order.captureId}`);
      updatedOrders.push(order);
      continue;
    }

    const current = await getOrder(order.orderId);
    console.log(`Current status: ${current.status}`);

    if (current.status === 'APPROVED') {
      console.log(`Capturing order ${order.orderId}...`);
      const captured = await captureOrder(order.orderId);
      console.log(`Successfully captured! Capture ID: ${captured.captureId}`);
      order.status = 'COMPLETED';
      order.captureId = captured.captureId;
      order.transactionId = captured.captureId;
      saveFixture(`spike-c-captured-${order.orderId}.json`, captured.fullData);
    } else if (current.status === 'COMPLETED') {
      const captureId = current.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      order.status = 'COMPLETED';
      order.captureId = captureId;
      console.log(`Already completed! Capture ID: ${captureId}`);
    } else {
      console.log(`Order is not yet approved by buyer. (Status: ${current.status})`);
      console.log(`Approval link: ${order.approveLink}`);
    }
    updatedOrders.push(order);
  }

  fs.writeFileSync(filePath, JSON.stringify(updatedOrders, null, 2) + '\n');
  const allCaptured = updatedOrders.every((o) => o.captureId);
  if (allCaptured) {
    console.log('\nAll orders captured successfully!');
  } else {
    console.log('\nSome orders are still waiting for buyer approval.');
  }
}

main().catch((err) => {
  console.error('Capture check failed:', err.message);
  process.exit(1);
});

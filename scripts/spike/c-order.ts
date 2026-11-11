import * as fs from 'node:fs';
import * as path from 'node:path';
import { paypalFetch, saveFixture } from './common.ts';

interface OrderItemConfig {
  item: string;
  amount: string;
  referenceId: string;
}

export async function createOrder(item: string, amount: string, referenceId: string) {
  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: referenceId,
        description: item,
        amount: {
          currency_code: 'USD',
          value: amount,
        },
      },
    ],
    application_context: {
      return_url: 'https://example.com/return',
      cancel_url: 'https://example.com/cancel',
      user_action: 'PAY_NOW',
    },
  };

  const res = await paypalFetch('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.status !== 201) {
    throw new Error(`Create order failed (${res.status}): ${JSON.stringify(res.data)}`);
  }

  const approveLink = res.data.links.find((l: any) => l.rel === 'approve' || l.rel === 'payer-action')?.href;
  return {
    orderId: res.data.id,
    status: res.data.status,
    approveLink,
    item,
    amount,
    referenceId,
  };
}

export async function captureOrder(orderId: string) {
  const res = await paypalFetch(`/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`Capture order failed (${res.status}): ${JSON.stringify(res.data)}`);
  }

  const capture = res.data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    orderId: res.data.id,
    status: res.data.status,
    captureId: capture?.id,
    amount: capture?.amount?.value,
    currency: capture?.amount?.currency_code,
    fullData: res.data,
  };
}

export async function getOrder(orderId: string) {
  const res = await paypalFetch(`/v2/checkout/orders/${orderId}`);
  if (res.status !== 200) {
    throw new Error(`Get order failed (${res.status}): ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'create';

  if (command === 'capture') {
    const orderId = args[1];
    if (!orderId) {
      console.error('Usage: c-order.ts capture <orderId>');
      process.exit(1);
    }
    console.log(`Capturing order ${orderId}...`);
    const result = await captureOrder(orderId);
    console.log('Order successfully captured!');
    console.log('Capture ID:', result.captureId);
    saveFixture(`spike-c-capture-${orderId}.json`, result.fullData);
    return;
  }

  console.log('--- Step C: Create Orders for Spike ---');
  const orderConfigs: OrderItemConfig[] = [
    { item: 'Vintage Mechanical Watch (for Dispute)', amount: '120.00', referenceId: 'ORD-DISPUTE-1' },
    { item: 'Wireless Headphones (for Refund)', amount: '45.00', referenceId: 'ORD-REFUND-1' },
  ];

  const createdOrders = [];
  for (const cfg of orderConfigs) {
    console.log(`\nCreating order: ${cfg.item} ($${cfg.amount})...`);
    const created = await createOrder(cfg.item, cfg.amount, cfg.referenceId);
    console.log(`Created Order ID: ${created.orderId}`);
    console.log(`Buyer Approval URL: ${created.approveLink}`);
    createdOrders.push(created);
  }

  const ordersFilePath = path.resolve('scripts/sandbox-orders.json');
  fs.writeFileSync(ordersFilePath, JSON.stringify(createdOrders, null, 2) + '\n');
  console.log(`\nSaved pending orders to ${ordersFilePath}`);
  saveFixture('spike-c-orders-created.json', createdOrders);

  console.log('\n======================================================');
  console.log('ACTION REQUIRED: Approve the orders in sandbox buyer account:');
  for (const o of createdOrders) {
    console.log(`\n[${o.item}] ($${o.amount})`);
    console.log(`Order ID: ${o.orderId}`);
    console.log(`Approval Link: ${o.approveLink}`);
  }
  console.log('======================================================\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Step C failed:', err.message);
    process.exit(1);
  });
}


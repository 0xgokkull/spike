import { paypalFetch } from './common';

async function main() {
  console.log('--- Testing PayPal Sandbox Direct Order Capture with Sandbox Test Card ---');

  const reqId = `req-card-${Date.now()}`;
  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: `test-card-${Date.now()}`,
        description: 'Test Watch Purchase',
        amount: {
          currency_code: 'USD',
          value: '50.00',
        },
      },
    ],
    payment_source: {
      card: {
        number: '4111111111111111',
        expiry: '2028-12',
        security_code: '123',
        name: 'Sandbox Buyer',
        billing_address: {
          address_line_1: '123 Main St',
          admin_area_2: 'San Jose',
          admin_area_1: 'CA',
          postal_code: '95131',
          country_code: 'US',
        },
      },
    },
  };

  console.log(`Sending POST /v2/checkout/orders with PayPal-Request-Id: ${reqId}...`);
  const res = await paypalFetch('/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'PayPal-Request-Id': reqId,
    },
    body: JSON.stringify(payload),
  });

  console.log(`Response status: ${res.status}`);
  console.log('Response data:', JSON.stringify(res.data, null, 2));
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

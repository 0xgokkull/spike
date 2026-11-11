import * as fs from 'node:fs';
import * as path from 'node:path';
import { getAccessToken, PAYPAL_API_BASE, saveFixture } from './common.ts';

const MINIMAL_PDF = Buffer.from(
`%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources <<>>>> endobj
4 0 obj <</Length 55>> stream
BT /F1 18 Tf 50 100 Td (Delivery Receipt - Delivered) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer <</Size 5 /Root 1 0 R>>
startxref
322
%%EOF
`
);

export async function provideEvidence(
  disputeId: string,
  evidenceInput: any,
  fileBuffer?: Buffer,
  fileName: string = 'delivery_receipt.pdf'
) {
  const { token } = await getAccessToken();
  const formData = new FormData();

  formData.append(
    'input',
    new Blob([JSON.stringify(evidenceInput)], { type: 'application/json' }),
    'input.json'
  );

  if (fileBuffer) {
    formData.append(
      'file',
      new Blob([fileBuffer], { type: 'application/pdf' }),
      fileName
    );
  }

  const res = await fetch(`${PAYPAL_API_BASE}/v1/customer/disputes/${disputeId}/provide-evidence`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
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

async function main() {
  console.log('--- Step F: Provide Evidence (Multipart Form) ---');
  const filePath = path.resolve('scripts/sandbox-orders.json');
  let disputeId = process.argv[2];

  if (!disputeId && fs.existsSync(filePath)) {
    const orders = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const disputeOrder = orders.find((o: any) => o.disputeId);
    disputeId = disputeOrder?.disputeId;
  }

  if (!disputeId) {
    console.error('No dispute ID found. Pass as argument: f-evidence.ts <disputeId>');
    process.exit(1);
  }

  console.log(`Providing evidence for dispute: ${disputeId}...`);
  const evidenceInput = {
    evidences: [
      {
        evidence_type: 'PROOF_OF_DELIVERY',
        evidence_info: {
          tracking_info: [
            {
              carrier_name: 'FEDEX',
              tracking_number: '987654321098',
            },
          ],
        },
        notes: 'Item was shipped via FedEx and confirmed delivered to buyer address.',
      },
    ],
  };

  const res = await provideEvidence(disputeId, evidenceInput, MINIMAL_PDF, 'delivery_receipt.pdf');
  console.log(`Provide evidence response status: ${res.status}`);

  if (res.status === 200 || res.status === 204) {
    console.log('Evidence submitted successfully!');
    saveFixture('spike-f-evidence-submitted.json', res.data || { ok: true, status: res.status });
  } else {
    console.error('Provide evidence failed:', res.data);
    saveFixture('spike-f-evidence-error.json', res.data);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('Step F failed:', err.message);
    process.exit(1);
  });
}


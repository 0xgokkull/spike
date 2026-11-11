import { renderDeliveryReceipt } from '@/lib/pdf';
import type { EvidenceItem, EvidenceFile } from '@/integrations/paypal/port';

export interface EvidencePackageInput {
  order: {
    id: string;
    item: string;
    carrier?: string | null;
    tracking_number?: string | null;
    delivered_at?: Date | string | null;
  };
  narrative?: string | null;
}

export async function buildEvidencePackage(
  input: EvidencePackageInput
): Promise<{ evidences: EvidenceItem[]; files: EvidenceFile[] }> {
  const pdfBuffer = await renderDeliveryReceipt({
    id: input.order.id,
    item: input.order.item,
    carrier: input.order.carrier,
    trackingNumber: input.order.tracking_number,
    deliveredAt: input.order.delivered_at,
  });

  const evidences: EvidenceItem[] = [
    {
      evidenceType: 'PROOF_OF_DELIVERY',
      carrierName: input.order.carrier || undefined,
      trackingNumber: input.order.tracking_number || undefined,
      notes: input.narrative || 'Proof of delivery confirmed by carrier tracking.',
    },
  ];

  const files: EvidenceFile[] = [
    {
      name: `delivery_receipt_${input.order.id.slice(0, 8)}.pdf`,
      buffer: pdfBuffer,
      contentType: 'application/pdf',
    },
  ];

  return { evidences, files };
}

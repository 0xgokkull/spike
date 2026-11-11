import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface DeliveryReceiptOrderFacts {
  id: string;
  item: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  deliveredAt?: string | Date | null;
}

export async function renderDeliveryReceipt(order: DeliveryReceiptOrderFacts): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([500, 300]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  // Header
  page.drawText('PROOF OF DELIVERY RECEIPT', {
    x: 50,
    y: height - 50,
    size: 16,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });

  page.drawLine({
    start: { x: 50, y: height - 60 },
    end: { x: width - 50, y: height - 60 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  // Body facts
  const details = [
    `Order Reference: ${order.id}`,
    `Item Description: ${order.item}`,
    `Shipping Carrier: ${order.carrier || 'Not specified'}`,
    `Tracking Number: ${order.trackingNumber || 'Not specified'}`,
    `Delivery Status: DELIVERED`,
    `Delivered At: ${order.deliveredAt ? new Date(order.deliveredAt).toUTCString() : 'Confirmed Delivered'}`,
  ];

  let y = height - 90;
  for (const line of details) {
    page.drawText(line, {
      x: 50,
      y,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 25;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}


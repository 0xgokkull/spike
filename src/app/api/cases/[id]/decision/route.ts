import { z } from 'zod';
import { handler } from '@/lib/route';
import { decideCase } from '@/services/decideCase';
import { getDb } from '@/db/client';
import { createPayPal } from '@/integrations/paypal';
import { DecisionTypeSchema } from '@/domain/types';

const DecisionSchema = z.object({
  decision: DecisionTypeSchema,
  edits: z
    .object({
      amountCents: z.number().optional(),
      narrative: z.string().optional(),
    })
    .optional(),
  until: z.string().optional(),
});

export const POST = handler({
  inputSchema: DecisionSchema,
  run: async (input, req) => {
    const db = getDb();
    const paypal = createPayPal();
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.indexOf('cases') + 1];

    return decideCase(db, paypal, {
      caseId: id,
      decision: input.decision,
      edits: input.edits,
      until: input.until,
    });
  },
});


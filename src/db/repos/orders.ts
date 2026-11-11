import { eq } from 'drizzle-orm';
import { orders } from '../schema';
import type { DbClient } from '../client';
import type { TrackingStatus } from '@/domain/types';

export interface CreateOrderInput {
  id?: string;
  item: string;
  amount_cents: number;
  currency?: string;
  paypal_order_id?: string | null;
  paypal_capture_id?: string | null;
  paypal_transaction_id?: string | null;
  refunded_cents?: number;
  carrier?: string | null;
  tracking_number?: string | null;
  tracking_status?: TrackingStatus;
  shipped_at?: Date | null;
  delivered_at?: Date | null;
}

export const ordersRepo = {
  async create(db: DbClient, input: CreateOrderInput) {
    const [created] = await db
      .insert(orders)
      .values({
        ...input,
        currency: input.currency ?? 'USD',
        refunded_cents: input.refunded_cents ?? 0,
        tracking_status: input.tracking_status ?? 'none',
      })
      .returning();
    return created;
  },

  async findById(db: DbClient, id: string) {
    const [found] = await db.select().from(orders).where(eq(orders.id, id));
    return found ?? null;
  },

  async update(db: DbClient, id: string, input: Partial<CreateOrderInput>) {
    const [updated] = await db.update(orders).set(input).where(eq(orders.id, id)).returning();
    return updated ?? null;
  },
};

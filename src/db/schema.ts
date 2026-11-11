import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  bigserial,
} from 'drizzle-orm/pg-core';
import type {
  CaseSource,
  CaseStatus,
  Reason,
  TrackingStatus,
  CaseOutcome,
  ActionType,
  Actor,
  ExecutionMode,
  PolicyRules,
  Provenance,
} from '@/domain/types';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  item: text('item').notNull(),
  amount_cents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  paypal_order_id: text('paypal_order_id'),
  paypal_capture_id: text('paypal_capture_id'),
  paypal_transaction_id: text('paypal_transaction_id'),
  refunded_cents: integer('refunded_cents').notNull().default(0),
  carrier: text('carrier'),
  tracking_number: text('tracking_number'),
  tracking_status: text('tracking_status').$type<TrackingStatus>().notNull().default('none'),
  shipped_at: timestamp('shipped_at', { withTimezone: true }),
  delivered_at: timestamp('delivered_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cases = pgTable('cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: text('source').$type<CaseSource>().notNull(),
  paypal_dispute_id: text('paypal_dispute_id').unique(),
  order_id: uuid('order_id').notNull().references(() => orders.id),
  reason: text('reason').$type<Reason>().notNull(),
  buyer_message: text('buyer_message').notNull(),
  amount_cents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  deadline_at: timestamp('deadline_at', { withTimezone: true }),
  status: text('status').$type<CaseStatus>().notNull().default('new'),
  snoozed_until: date('snoozed_until'),
  outcome: text('outcome').$type<CaseOutcome>(),
  available_actions: jsonb('available_actions').$type<ActionType[]>().notNull().default([]),
  simulated: boolean('simulated').notNull().default(false),
  version: integer('version').notNull().default(1),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const policies = pgTable('policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: integer('version').notNull().default(1),
  text: text('text').notNull(),
  rules: jsonb('rules').$type<PolicyRules>().notNull(),
  active: boolean('active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const recommendations = pgTable('recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  case_id: uuid('case_id').notNull().references(() => cases.id),
  action: text('action').$type<ActionType>().notNull(),
  refund_amount_cents: integer('refund_amount_cents'),
  policy_clause_id: text('policy_clause_id').notNull(),
  rationale: text('rationale').notNull(),
  evidence_narrative: text('evidence_narrative'),
  tracking_message_draft: text('tracking_message_draft'),
  provenance: jsonb('provenance').$type<Provenance>().notNull(),
  mode: text('mode').$type<ExecutionMode>().notNull(),
  gate_reasons: jsonb('gate_reasons').$type<string[]>().notNull().default([]),
  origin: text('origin').$type<'llm' | 'fallback'>().notNull(),
  validation: jsonb('validation').notNull().default({}),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const actions = pgTable('actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  case_id: uuid('case_id').notNull().references(() => cases.id),
  recommendation_id: uuid('recommendation_id').references(() => recommendations.id),
  type: text('type').$type<ActionType>().notNull(),
  input: jsonb('input').notNull(),
  idempotency_key: text('idempotency_key').notNull().unique(),
  status: text('status').$type<'pending' | 'succeeded' | 'failed'>().notNull().default('pending'),
  actor: text('actor').$type<'agent_auto' | 'seller'>().notNull(),
  request: jsonb('request'),
  response: jsonb('response'),
  error: jsonb('error'),
  paypal_refs: jsonb('paypal_refs').$type<Record<string, string>>().notNull().default({}),
  simulated: boolean('simulated').notNull().default(false),
  acknowledged_at: timestamp('acknowledged_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable('events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  case_id: uuid('case_id').references(() => cases.id),
  type: text('type').notNull(),
  actor: text('actor').$type<Actor>().notNull(),
  payload: jsonb('payload').notNull().default({}),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

export const day_closes = pgTable('day_closes', {
  id: uuid('id').primaryKey().defaultRandom(),
  day: date('day').notNull().unique(),
  summary: jsonb('summary').notNull(),
  closed_at: timestamp('closed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const webhook_deliveries = pgTable('webhook_deliveries', {
  event_id: text('event_id').primaryKey(),
  event_type: text('event_type').notNull(),
  verified: boolean('verified').notNull().default(false),
  payload: jsonb('payload').notNull(),
  received_at: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  processed_at: timestamp('processed_at', { withTimezone: true }),
});

export const app_state = pgTable('app_state', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
});

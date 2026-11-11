CREATE TABLE "actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"recommendation_id" uuid,
	"type" text NOT NULL,
	"input" jsonb NOT NULL,
	"idempotency_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"actor" text NOT NULL,
	"request" jsonb,
	"response" jsonb,
	"error" jsonb,
	"paypal_refs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"simulated" boolean DEFAULT false NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "actions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "app_state" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"paypal_dispute_id" text,
	"order_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"buyer_message" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"deadline_at" timestamp with time zone,
	"status" text DEFAULT 'new' NOT NULL,
	"snoozed_until" date,
	"outcome" text,
	"available_actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"simulated" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cases_paypal_dispute_id_unique" UNIQUE("paypal_dispute_id")
);
--> statement-breakpoint
CREATE TABLE "day_closes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" date NOT NULL,
	"summary" jsonb NOT NULL,
	"closed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "day_closes_day_unique" UNIQUE("day")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"case_id" uuid,
	"type" text NOT NULL,
	"actor" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"paypal_order_id" text,
	"paypal_capture_id" text,
	"paypal_transaction_id" text,
	"refunded_cents" integer DEFAULT 0 NOT NULL,
	"carrier" text,
	"tracking_number" text,
	"tracking_status" text DEFAULT 'none' NOT NULL,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"text" text NOT NULL,
	"rules" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"action" text NOT NULL,
	"refund_amount_cents" integer,
	"policy_clause_id" text NOT NULL,
	"rationale" text NOT NULL,
	"evidence_narrative" text,
	"tracking_message_draft" text,
	"provenance" jsonb NOT NULL,
	"mode" text NOT NULL,
	"gate_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"origin" text NOT NULL,
	"validation" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"event_id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_recommendation_id_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."recommendations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;
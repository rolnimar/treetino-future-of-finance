CREATE TABLE "demo_payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "wallet" text NOT NULL,
  "site_id" integer NOT NULL,
  "amount_cents" integer NOT NULL CHECK (amount_cents BETWEEN 2000 AND 500000),
  "status" text DEFAULT 'pending' NOT NULL CHECK ("status" IN ('pending', 'completed')),
  "transaction_id" text UNIQUE,
  "created_at" bigint NOT NULL,
  "completed_at" bigint,
  "payment_amounts" jsonb,
  "fiat_currency" text DEFAULT 'USD' NOT NULL CHECK ("fiat_currency" = 'USD'),
  "usdc_allocation" jsonb
);

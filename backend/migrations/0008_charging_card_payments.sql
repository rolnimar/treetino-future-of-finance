ALTER TABLE "demo_payments" ADD COLUMN "charging_session_id" uuid REFERENCES "usage_sessions"("id");
--> statement-breakpoint
ALTER TABLE "demo_payments" ADD COLUMN "settled_at" bigint;
--> statement-breakpoint
CREATE INDEX "demo_payments_charging_session" ON "demo_payments"("charging_session_id");
--> statement-breakpoint
ALTER TABLE "usage_sessions" ADD COLUMN "payment_method" text;
--> statement-breakpoint
UPDATE "usage_sessions" SET "payment_method" = 'usdc' WHERE "status" = 'paid';

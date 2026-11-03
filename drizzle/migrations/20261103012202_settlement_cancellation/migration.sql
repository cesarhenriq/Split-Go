ALTER TABLE "settlements" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "cancelled_by" uuid;--> statement-breakpoint
UPDATE "settlements" SET "cancelled_at" = "updated_at", "cancelled_by" = "paid_by" WHERE "status" = 'CANCELLED' AND "cancelled_at" IS NULL;--> statement-breakpoint
CREATE INDEX "settlements_cancelled_by_idx" ON "settlements" ("cancelled_by");--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_cancelled_by_users_fk" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_cancelled_consistency_check" CHECK (("status" = 'CANCELLED' AND "cancelled_at" IS NOT NULL AND "cancelled_by" IS NOT NULL) OR ("status" <> 'CANCELLED' AND "cancelled_at" IS NULL AND "cancelled_by" IS NULL));--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_cancelled_after_paid_check" CHECK ("cancelled_at" IS NULL OR "cancelled_at" >= "paid_at");
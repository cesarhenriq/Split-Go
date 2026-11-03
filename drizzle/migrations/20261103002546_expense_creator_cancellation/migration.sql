ALTER TABLE "expenses" ADD COLUMN "created_by" uuid;--> statement-breakpoint
UPDATE "expenses" SET "created_by" = "paid_by" WHERE "created_by" IS NULL;--> statement-breakpoint
ALTER TABLE "expenses" ALTER COLUMN "created_by" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "cancelled_by" uuid;--> statement-breakpoint
CREATE INDEX "expenses_created_by_idx" ON "expenses" ("created_by");--> statement-breakpoint
CREATE INDEX "expenses_group_id_cancelled_at_idx" ON "expenses" ("group_id","cancelled_at");--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_cancelled_by_users_fk" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_cancelled_consistency_check" CHECK (("cancelled_at" IS NULL AND "cancelled_by" IS NULL) OR ("cancelled_at" IS NOT NULL AND "cancelled_by" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_cancelled_after_created_check" CHECK ("cancelled_at" IS NULL OR "cancelled_at" >= "created_at");
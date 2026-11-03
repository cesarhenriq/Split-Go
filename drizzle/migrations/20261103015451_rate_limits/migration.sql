CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limits_count_non_negative_check" CHECK ("count" >= 0)
);
--> statement-breakpoint
CREATE INDEX "rate_limits_reset_at_idx" ON "rate_limits" ("reset_at");
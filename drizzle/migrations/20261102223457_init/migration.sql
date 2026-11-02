CREATE TYPE "expense_split_method" AS ENUM('EQUAL', 'PERCENTAGE', 'FIXED');--> statement-breakpoint
CREATE TYPE "group_invitation_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "group_member_role" AS ENUM('ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TYPE "group_member_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "settlement_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "expense_splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"expense_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"share_amount" bigint NOT NULL,
	"percentage" numeric(5,2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expense_splits_share_amount_positive_check" CHECK ("share_amount" > 0),
	CONSTRAINT "expense_splits_percentage_range_check" CHECK ("percentage" IS NULL OR ("percentage" >= 0 AND "percentage" <= 100))
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"group_id" uuid NOT NULL,
	"paid_by" uuid NOT NULL,
	"description" varchar(255) NOT NULL,
	"total_amount" bigint NOT NULL,
	"split_method" "expense_split_method" DEFAULT 'EQUAL'::"expense_split_method" NOT NULL,
	"expense_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_total_amount_positive_check" CHECK ("total_amount" > 0),
	CONSTRAINT "expenses_description_not_blank_check" CHECK (char_length(btrim("description")) > 0)
);
--> statement-breakpoint
CREATE TABLE "group_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"group_id" uuid NOT NULL,
	"email" varchar(320) NOT NULL,
	"invited_by" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"status" "group_invitation_status" DEFAULT 'PENDING'::"group_invitation_status" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_invitations_email_lowercase_check" CHECK ("email" = lower("email")),
	CONSTRAINT "group_invitations_token_hash_not_blank_check" CHECK (char_length("token_hash") > 0),
	CONSTRAINT "group_invitations_expires_after_created_check" CHECK ("expires_at" > "created_at"),
	CONSTRAINT "group_invitations_response_consistency_check" CHECK (("status" IN ('ACCEPTED', 'DECLINED') AND "responded_at" IS NOT NULL) OR ("status" IN ('PENDING', 'EXPIRED') AND "responded_at" IS NULL)),
	CONSTRAINT "group_invitations_responded_after_created_check" CHECK ("responded_at" IS NULL OR "responded_at" >= "created_at")
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "group_member_role" DEFAULT 'MEMBER'::"group_member_role" NOT NULL,
	"status" "group_member_status" DEFAULT 'PENDING'::"group_member_status" NOT NULL,
	"joined_at" timestamp with time zone,
	"left_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_members_joined_at_consistency_check" CHECK (("status" = 'ACCEPTED' AND "joined_at" IS NOT NULL) OR ("status" <> 'ACCEPTED' AND "joined_at" IS NULL)),
	CONSTRAINT "group_members_left_at_consistency_check" CHECK ("left_at" IS NULL OR ("status" = 'ACCEPTED' AND "joined_at" IS NOT NULL AND "left_at" >= "joined_at"))
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(120) NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "groups_name_not_blank_check" CHECK (char_length(btrim("name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"group_id" uuid NOT NULL,
	"paid_by" uuid NOT NULL,
	"received_by" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"status" "settlement_status" DEFAULT 'PENDING'::"settlement_status" NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settlements_amount_positive_check" CHECK ("amount" > 0),
	CONSTRAINT "settlements_distinct_users_check" CHECK ("paid_by" <> "received_by"),
	CONSTRAINT "settlements_confirmation_consistency_check" CHECK (("status" = 'CONFIRMED' AND "confirmed_at" IS NOT NULL) OR ("status" <> 'CONFIRMED' AND "confirmed_at" IS NULL)),
	CONSTRAINT "settlements_confirmed_after_paid_check" CHECK ("confirmed_at" IS NULL OR "confirmed_at" >= "paid_at")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_lowercase_check" CHECK ("email" = lower("email")),
	CONSTRAINT "users_name_not_blank_check" CHECK (char_length(btrim("name")) > 0),
	CONSTRAINT "users_password_hash_not_blank_check" CHECK (char_length("password_hash") > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "expense_splits_expense_id_user_id_unique" ON "expense_splits" ("expense_id","user_id");--> statement-breakpoint
CREATE INDEX "expense_splits_user_id_idx" ON "expense_splits" ("user_id");--> statement-breakpoint
CREATE INDEX "expenses_group_id_expense_date_idx" ON "expenses" ("group_id","expense_date");--> statement-breakpoint
CREATE INDEX "expenses_paid_by_idx" ON "expenses" ("paid_by");--> statement-breakpoint
CREATE INDEX "expenses_group_id_paid_by_idx" ON "expenses" ("group_id","paid_by");--> statement-breakpoint
CREATE UNIQUE INDEX "group_invitations_token_hash_unique" ON "group_invitations" ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "group_invitations_pending_group_email_unique" ON "group_invitations" ("group_id","email") WHERE "status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "group_invitations_group_id_idx" ON "group_invitations" ("group_id");--> statement-breakpoint
CREATE INDEX "group_invitations_email_idx" ON "group_invitations" ("email");--> statement-breakpoint
CREATE INDEX "group_invitations_invited_by_idx" ON "group_invitations" ("invited_by");--> statement-breakpoint
CREATE INDEX "group_invitations_status_expires_at_idx" ON "group_invitations" ("status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "group_members_group_id_user_id_unique" ON "group_members" ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "group_members_user_id_idx" ON "group_members" ("user_id");--> statement-breakpoint
CREATE INDEX "group_members_group_id_status_idx" ON "group_members" ("group_id","status");--> statement-breakpoint
CREATE INDEX "groups_created_by_idx" ON "groups" ("created_by");--> statement-breakpoint
CREATE INDEX "settlements_group_id_status_idx" ON "settlements" ("group_id","status");--> statement-breakpoint
CREATE INDEX "settlements_group_id_created_at_idx" ON "settlements" ("group_id","created_at");--> statement-breakpoint
CREATE INDEX "settlements_paid_by_idx" ON "settlements" ("paid_by");--> statement-breakpoint
CREATE INDEX "settlements_received_by_idx" ON "settlements" ("received_by");--> statement-breakpoint
CREATE INDEX "settlements_group_id_paid_by_idx" ON "settlements" ("group_id","paid_by");--> statement-breakpoint
CREATE INDEX "settlements_group_id_received_by_idx" ON "settlements" ("group_id","received_by");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email");--> statement-breakpoint
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_expense_id_expenses_fk" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_user_id_users_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_groups_fk" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_users_fk" FOREIGN KEY ("paid_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_paid_by_group_members_fk" FOREIGN KEY ("group_id","paid_by") REFERENCES "group_members"("group_id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_group_id_groups_fk" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "group_invitations" ADD CONSTRAINT "group_invitations_invited_by_users_fk" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_fk" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_users_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_group_id_groups_fk" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_paid_by_users_fk" FOREIGN KEY ("paid_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_received_by_users_fk" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_group_id_paid_by_group_members_fk" FOREIGN KEY ("group_id","paid_by") REFERENCES "group_members"("group_id","user_id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_group_id_received_by_group_members_fk" FOREIGN KEY ("group_id","received_by") REFERENCES "group_members"("group_id","user_id") ON DELETE RESTRICT;
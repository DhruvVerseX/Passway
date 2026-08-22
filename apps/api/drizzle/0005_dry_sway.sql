CREATE TYPE "public"."environment_type" AS ENUM('development', 'preview', 'staging', 'production', 'custom');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'BUNDLE_CREATED' BEFORE 'SECRET_CREATED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'SECRETS_IMPORTED' BEFORE 'SECRET_CREATED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ENVIRONMENT_LOCKED' BEFORE 'SECRET_CREATED';--> statement-breakpoint
ALTER TYPE "public"."environment_status" ADD VALUE 'locked' BEFORE 'hosted';--> statement-breakpoint
ALTER TABLE "environment" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "environment" ADD COLUMN "type" "environment_type" DEFAULT 'development' NOT NULL;--> statement-breakpoint
ALTER TABLE "environment" ADD COLUMN "description" text;
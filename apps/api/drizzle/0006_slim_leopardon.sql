ALTER TYPE "public"."audit_action" ADD VALUE 'APP_RUNTIME_ENABLED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'APP_RUNTIME_DISABLED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'APP_CONNECTION_VERIFIED';--> statement-breakpoint
ALTER TABLE "environment" ADD COLUMN "runtime_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "environment" ADD COLUMN "runtime_hosted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "environment" ADD COLUMN "runtime_disabled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "environment" ADD COLUMN "last_connected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "environment" ADD COLUMN "last_health_check_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "environment" ADD COLUMN "last_health_healthy" boolean;
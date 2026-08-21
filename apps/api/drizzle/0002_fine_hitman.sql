CREATE TYPE "public"."audit_action" AS ENUM('SECRET_CREATED', 'SECRET_READ', 'SECRET_UPDATED', 'SECRET_DELETED');--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "action" "audit_action";--> statement-breakpoint
UPDATE "audit_log" SET "action" = 'SECRET_READ' WHERE "action" IS NULL;--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "action" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "secret" ADD COLUMN "payload_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "secret" ADD COLUMN "key_version" text DEFAULT 'v1' NOT NULL;--> statement-breakpoint
ALTER TABLE "secret" ADD COLUMN "algorithm" text DEFAULT 'AES-256-GCM' NOT NULL;

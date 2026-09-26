CREATE TYPE "public"."runtime_device_challenge_purpose" AS ENUM('registration', 'session');--> statement-breakpoint
CREATE TYPE "public"."runtime_device_status" AS ENUM('active', 'revoked');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'RUNTIME_DEVICE_REGISTERED' BEFORE 'APP_RUNTIME_ENABLED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'RUNTIME_DEVICE_REVOKED' BEFORE 'APP_RUNTIME_ENABLED';--> statement-breakpoint
CREATE TABLE "runtime_device" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"environment_id" text NOT NULL,
	"project_id" text NOT NULL,
	"public_key" text NOT NULL,
	"label" text NOT NULL,
	"status" "runtime_device_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "runtime_device_public_key_unique" UNIQUE("public_key")
);
--> statement-breakpoint
CREATE TABLE "runtime_device_challenge" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"environment_id" text NOT NULL,
	"project_id" text NOT NULL,
	"public_key" text NOT NULL,
	"label" text,
	"purpose" "runtime_device_challenge_purpose" NOT NULL,
	"challenge" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "runtime_session" ADD COLUMN "device_id" text;--> statement-breakpoint
ALTER TABLE "runtime_device" ADD CONSTRAINT "runtime_device_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_device" ADD CONSTRAINT "runtime_device_environment_id_environment_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_device" ADD CONSTRAINT "runtime_device_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_device_challenge" ADD CONSTRAINT "runtime_device_challenge_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_device_challenge" ADD CONSTRAINT "runtime_device_challenge_environment_id_environment_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_device_challenge" ADD CONSTRAINT "runtime_device_challenge_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "runtime_device_environment_id_idx" ON "runtime_device" USING btree ("environment_id");--> statement-breakpoint
CREATE INDEX "runtime_device_user_id_idx" ON "runtime_device" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "runtime_device_challenge_expires_at_idx" ON "runtime_device_challenge" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "runtime_session" ADD CONSTRAINT "runtime_session_device_id_runtime_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."runtime_device"("id") ON DELETE set null ON UPDATE no action;
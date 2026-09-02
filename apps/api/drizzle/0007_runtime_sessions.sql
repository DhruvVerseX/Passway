CREATE TYPE "public"."runtime_session_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'RUNTIME_SESSION_CREATED' BEFORE 'APP_RUNTIME_ENABLED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'RUNTIME_SESSION_REVOKED' BEFORE 'APP_RUNTIME_ENABLED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'RUNTIME_SESSION_HEARTBEAT_TIMEOUT' BEFORE 'APP_RUNTIME_ENABLED';--> statement-breakpoint
CREATE TABLE "runtime_session" (
	"session_id" text PRIMARY KEY NOT NULL,
	"environment_id" text NOT NULL,
	"project_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"access_token_id" text,
	"session_token_hash" text NOT NULL,
	"status" "runtime_session_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "runtime_session_session_token_hash_unique" UNIQUE("session_token_hash")
);
--> statement-breakpoint
ALTER TABLE "runtime_session" ADD CONSTRAINT "runtime_session_environment_id_environment_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."environment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_session" ADD CONSTRAINT "runtime_session_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_session" ADD CONSTRAINT "runtime_session_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runtime_session" ADD CONSTRAINT "runtime_session_access_token_id_access_token_id_fk" FOREIGN KEY ("access_token_id") REFERENCES "public"."access_token"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "runtime_session_environment_id_idx" ON "runtime_session" USING btree ("environment_id");--> statement-breakpoint
CREATE INDEX "runtime_session_project_id_idx" ON "runtime_session" USING btree ("project_id");
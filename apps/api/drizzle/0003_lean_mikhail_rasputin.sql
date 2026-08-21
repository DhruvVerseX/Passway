CREATE TYPE "public"."environment_status" AS ENUM('draft', 'hosted', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."runtime_token_status" AS ENUM('active', 'revoked');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'ENVIRONMENT_HOSTED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'RUNTIME_TOKEN_CREATED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'RUNTIME_TOKEN_USED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'RUNTIME_TOKEN_REVOKED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'RUNTIME_SECRET_BUNDLE_READ';--> statement-breakpoint
ALTER TABLE "audit_log" ALTER COLUMN "secret_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "access_token" ADD COLUMN "token_hint" text;--> statement-breakpoint
ALTER TABLE "access_token" ADD COLUMN "status" "runtime_token_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "access_token" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "access_token" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "actor_user_id" text;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "workspace_id" text;--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "project_id" text;--> statement-breakpoint
ALTER TABLE "environment" ADD COLUMN "status" "environment_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "environment" ADD COLUMN "locked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "environment" ADD COLUMN "hosted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "access_token" ADD CONSTRAINT "access_token_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_token_environment_id_idx" ON "access_token" USING btree ("environment_id");--> statement-breakpoint
CREATE INDEX "audit_log_environment_id_idx" ON "audit_log" USING btree ("environment_id");--> statement-breakpoint
CREATE FUNCTION "prevent_hosted_environment_secret_mutation"() RETURNS trigger AS $$
DECLARE
  target_environment_id text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_environment_id := OLD.environment_id;
  ELSE
    target_environment_id := NEW.environment_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM "environment"
    WHERE "id" = target_environment_id AND "status" <> 'draft'
  ) THEN
    RAISE EXCEPTION 'environment is locked' USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER "secret_environment_locked"
BEFORE INSERT OR UPDATE OR DELETE ON "secret"
FOR EACH ROW EXECUTE FUNCTION "prevent_hosted_environment_secret_mutation"();

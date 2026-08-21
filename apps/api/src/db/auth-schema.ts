import {
  bigint,
  boolean,
  integer,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimit = pgTable("rateLimit", {
  id: text("id").primaryKey(),
  key: text("key").notNull(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

export const environmentName = pgEnum("environment_name", [
  "development",
  "staging",
  "production",
]);

export const environmentStatus = pgEnum("environment_status", [
  "draft",
  "hosted",
  "disabled",
]);

export const runtimeTokenStatus = pgEnum("runtime_token_status", ["active", "revoked"]);

export const auditResult = pgEnum("audit_result", ["allowed", "denied"]);
export const auditAction = pgEnum("audit_action", [
  "SECRET_CREATED",
  "SECRET_READ",
  "SECRET_UPDATED",
  "SECRET_DELETED",
  "ENVIRONMENT_HOSTED",
  "RUNTIME_TOKEN_CREATED",
  "RUNTIME_TOKEN_USED",
  "RUNTIME_TOKEN_REVOKED",
  "RUNTIME_SECRET_BUNDLE_READ",
  "RUNTIME_CONNECTION_VERIFIED",
]);

export const workspace = pgTable(
  "workspace",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("workspace_slug_unique").on(table.slug)],
);

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("project_workspace_name_unique").on(table.workspaceId, table.name)],
);

export const environment = pgTable(
  "environment",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    name: environmentName("name").notNull(),
    status: environmentStatus("status").notNull().default("draft"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    hostedAt: timestamp("hosted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("environment_project_name_unique").on(table.projectId, table.name)],
);

export const secret = pgTable(
  "secret",
  {
    id: text("id").primaryKey(),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environment.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    ciphertext: text("ciphertext").notNull(),
    iv: text("iv").notNull(),
    authTag: text("auth_tag").notNull(),
    wrappedDataKey: text("wrapped_data_key").notNull(),
    payloadVersion: integer("payload_version").notNull().default(1),
    keyVersion: text("key_version").notNull().default("v1"),
    algorithm: text("algorithm").notNull().default("AES-256-GCM"),
    description: text("description"),
    tags: text("tags").array(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("secret_environment_key_unique").on(table.environmentId, table.key)],
);

export const accessToken = pgTable("access_token", {
  id: text("id").primaryKey(),
  environmentId: text("environment_id")
    .notNull()
    .references(() => environment.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  tokenHint: text("token_hint"),
  label: text("label").notNull(),
  status: runtimeTokenStatus("status").notNull().default("active"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revoked: boolean("revoked").notNull().default(false),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdByUserId: text("created_by_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("access_token_environment_id_idx").on(table.environmentId)]);

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  environmentId: text("environment_id")
    .notNull()
    .references(() => environment.id, { onDelete: "cascade" }),
  accessTokenId: text("access_token_id").references(() => accessToken.id, {
    onDelete: "set null",
  }),
  actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
  workspaceId: text("workspace_id").references(() => workspace.id, { onDelete: "set null" }),
  projectId: text("project_id").references(() => project.id, { onDelete: "set null" }),
  secretKey: text("secret_key"),
  ip: text("ip").notNull(),
  action: auditAction("action").notNull(),
  result: auditResult("result").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("audit_log_environment_id_idx").on(table.environmentId)]);

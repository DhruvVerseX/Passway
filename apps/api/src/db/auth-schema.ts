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
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
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

export const environmentType = pgEnum("environment_type", [
  "development",
  "preview",
  "staging",
  "production",
  "custom",
]);

export const environmentStatus = pgEnum("environment_status", [
  "draft",
  "locked",
  "hosted",
  "disabled",
]);

export const runtimeTokenStatus = pgEnum("runtime_token_status", [
  "active",
  "revoked",
]);

export const runtimeSessionStatus = pgEnum("runtime_session_status", [
  "active",
  "revoked",
  "expired",
]);

export const runtimeDeviceStatus = pgEnum("runtime_device_status", [
  "active",
  "revoked",
]);

export const runtimeDeviceChallengePurpose = pgEnum("runtime_device_challenge_purpose", [
  "registration",
  "session",
]);

export const auditResult = pgEnum("audit_result", ["allowed", "denied"]);
export const auditAction = pgEnum("audit_action", [
  "BUNDLE_CREATED",
  "SECRETS_IMPORTED",
  "ENVIRONMENT_LOCKED",
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
  "RUNTIME_SESSION_CREATED",
  "RUNTIME_SESSION_REVOKED",
  "RUNTIME_SESSION_HEARTBEAT_TIMEOUT",
  "RUNTIME_DEVICE_REGISTERED",
  "RUNTIME_DEVICE_REVOKED",
  "APP_RUNTIME_ENABLED",
  "APP_RUNTIME_DISABLED",
  "APP_CONNECTION_VERIFIED",
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("project_workspace_name_unique").on(
      table.workspaceId,
      table.name,
    ),
  ],
);

export const environment = pgTable(
  "environment",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: environmentType("type").notNull().default("development"),
    description: text("description"),
    status: environmentStatus("status").notNull().default("draft"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    hostedAt: timestamp("hosted_at", { withTimezone: true }),
    runtimeEnabled: boolean("runtime_enabled").notNull().default(false),
    runtimeHostedAt: timestamp("runtime_hosted_at", { withTimezone: true }),
    runtimeDisabledAt: timestamp("runtime_disabled_at", { withTimezone: true }),
    lastConnectedAt: timestamp("last_connected_at", { withTimezone: true }),
    lastHealthCheckAt: timestamp("last_health_check_at", { withTimezone: true }),
    lastHealthHealthy: boolean("last_health_healthy"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("environment_project_name_unique").on(
      table.projectId,
      table.name,
    ),
  ],
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("secret_environment_key_unique").on(
      table.environmentId,
      table.key,
    ),
  ],
);

export const accessToken = pgTable(
  "access_token",
  {
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("access_token_environment_id_idx").on(table.environmentId)],
);

export const runtimeSession = pgTable(
  "runtime_session",
  {
    sessionId: text("session_id").primaryKey(),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environment.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    accessTokenId: text("access_token_id").references(() => accessToken.id, {
      onDelete: "set null",
    }),
    deviceId: text("device_id").references(() => runtimeDevice.id, {
      onDelete: "set null",
    }),
    sessionTokenHash: text("session_token_hash").notNull().unique(),
    status: runtimeSessionStatus("status").notNull().default("active"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("runtime_session_environment_id_idx").on(table.environmentId),
    index("runtime_session_project_id_idx").on(table.projectId),
  ],
);

export const runtimeDevice = pgTable(
  "runtime_device",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environment.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    publicKey: text("public_key").notNull().unique(),
    label: text("label").notNull(),
    status: runtimeDeviceStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("runtime_device_environment_id_idx").on(table.environmentId),
    index("runtime_device_user_id_idx").on(table.userId),
  ],
);

export const runtimeDeviceChallenge = pgTable(
  "runtime_device_challenge",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environment.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    publicKey: text("public_key").notNull(),
    label: text("label"),
    purpose: runtimeDeviceChallengePurpose("purpose").notNull(),
    challenge: text("challenge").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("runtime_device_challenge_expires_at_idx").on(table.expiresAt)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environment.id, { onDelete: "cascade" }),
    accessTokenId: text("access_token_id").references(() => accessToken.id, {
      onDelete: "set null",
    }),
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    workspaceId: text("workspace_id").references(() => workspace.id, {
      onDelete: "set null",
    }),
    projectId: text("project_id").references(() => project.id, {
      onDelete: "set null",
    }),
    secretKey: text("secret_key"),
    ip: text("ip").notNull(),
    action: auditAction("action").notNull(),
    result: auditResult("result").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("audit_log_environment_id_idx").on(table.environmentId)],
);

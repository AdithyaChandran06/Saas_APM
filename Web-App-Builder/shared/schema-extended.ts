import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
  varchar,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

// === WORKSPACES & MULTI-TENANCY ===
export const workspaces = pgTable(
  "workspaces",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [unique("workspaces_slug_unique").on(table.slug)]
);

// === USER ROLES & PERMISSIONS (RBAC) ===
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // 'owner', 'admin', 'member', 'viewer'
    joinedAt: timestamp("joined_at").defaultNow(),
  },
  (table) => [unique("workspace_members_unique").on(table.workspaceId, table.userId)]
);

// === SETTINGS ===
export const workspaceSettings = pgTable(
  "workspace_settings",
  {
    id: serial("id").primaryKey(),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    dataCollectionEnabled: boolean("data_collection_enabled").default(true),
    aiAnalysisFrequency: text("ai_analysis_frequency").default("daily"), // 'realtime', 'daily', 'weekly'
    retentionDays: integer("retention_days").default(90),
    privacyMode: boolean("privacy_mode").default(false),
    sampleRate: doublePrecision("sample_rate").default(1.0), // 0.0 to 1.0
    recommendationGenerateCount: integer("recommendation_generate_count").default(0),
    recommendationGenerateDayKey: text("recommendation_generate_day_key"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
);

// === ALERTS & NOTIFICATIONS ===
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  condition: text("condition").notNull(), // e.g., "error_rate > 5%", "response_time > 2000"
  threshold: doublePrecision("threshold").notNull(),
  metricType: text("metric_type").notNull(), // 'error_rate', 'response_time', 'event_count'
  enabled: boolean("enabled").default(true),
  channels: jsonb("channels").default([]), // ['email', 'slack', 'webhook']
  webhookUrl: text("webhook_url"),
  createdAt: timestamp("created_at").defaultNow(),
  triggeredAt: timestamp("triggered_at"),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: text("acknowledged_by"),
});

// === ANALYTICS & SEGMENTS ===
export const segments = pgTable("segments", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  definition: jsonb("definition").notNull(), // Filter logic for segment
  userCount: integer("user_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cohorts = pgTable("cohorts", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  criteria: jsonb("criteria").notNull(), // Behavioral/demographic criteria
  memberCount: integer("member_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === FUNNELS ===
export const funnels = pgTable("funnels", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  steps: jsonb("steps").notNull(), // Array of event types in order
  timeWindow: integer("time_window_seconds").default(3600), // 1 hour default
  conversionRate: doublePrecision("conversion_rate"),
  totalEntered: integer("total_entered"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === FEATURE FLAGS & EXPERIMENTS ===
export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: varchar("key", { length: 255 }).notNull(),
  enabled: boolean("enabled").default(false),
  rolloutPercentage: integer("rollout_percentage").default(0), // 0-100
  targetSegments: jsonb("target_segments").default([]), // Segment IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const experiments = pgTable("experiments", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  controlGroup: text("control_group").notNull(),
  treatmentGroup: text("treatment_group").notNull(),
  metric: text("metric").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").default("draft"), // 'draft', 'running', 'completed'
  winner: text("winner"), // 'control', 'treatment', 'no_winner'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === API KEYS & SDKs ===
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  secret: varchar("secret", { length: 255 }).notNull(),
  lastUsed: timestamp("last_used"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// === AUDIT LOG ===
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  changes: jsonb("changes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === TELEMETRY ===
export const errorEvents = pgTable("error_events", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  method: text("method").notNull(),
  path: text("path").notNull(),
  statusCode: integer("status_code").notNull(),
  durationMs: integer("duration_ms").notNull(),
  message: text("message"),
  context: jsonb("context"),
});

export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  method: text("method").notNull(),
  path: text("path").notNull(),
  statusCode: integer("status_code").notNull(),
  durationMs: integer("duration_ms").notNull(),
});

// === RELATIONS ===
export const workspaceRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  settings: many(workspaceSettings),
  alerts: many(alerts),
  segments: many(segments),
  cohorts: many(cohorts),
  funnels: many(funnels),
  featureFlags: many(featureFlags),
  experiments: many(experiments),
  apiKeys: many(apiKeys),
  auditLog: many(auditLog),
}));

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [workspaceMembers.userId],
      references: [users.id],
    }),
  })
);

// === SCHEMAS FOR ZODVALIDATION ===
export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateWorkspaceSettingsSchema = createInsertSchema(
  workspaceSettings
).omit({ id: true, workspaceId: true, createdAt: true, updatedAt: true });

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  triggeredAt: true,
  acknowledgedAt: true,
});

export const insertSegmentSchema = createInsertSchema(segments).omit({
  id: true,
  workspaceId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFunnelSchema = createInsertSchema(funnels).omit({
  id: true,
  workspaceId: true,
  conversionRate: true,
  totalEntered: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({
  id: true,
  workspaceId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExperimentSchema = createInsertSchema(experiments).omit({
  id: true,
  workspaceId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  workspaceId: true,
  key: true,
  secret: true,
  lastUsed: true,
  createdAt: true,
});

// === TYPES ===
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type WorkspaceSettings = typeof workspaceSettings.$inferSelect;
export type InsertWorkspaceSettings = z.infer<
  typeof updateWorkspaceSettingsSchema
>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type Segment = typeof segments.$inferSelect;
export type InsertSegment = z.infer<typeof insertSegmentSchema>;

export type Cohort = typeof cohorts.$inferSelect;
export type Funnel = typeof funnels.$inferSelect;
export type InsertFunnel = z.infer<typeof insertFunnelSchema>;

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;

export type Experiment = typeof experiments.$inferSelect;
export type InsertExperiment = z.infer<typeof insertExperimentSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type ErrorEvent = typeof errorEvents.$inferSelect;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;

import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth and chat models
export * from "./models/auth";
export * from "./models/chat";

// Import auth users table for relations
import { users } from "./models/auth";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id"),
  type: text("type").notNull(), // e.g., 'page_view', 'click', 'feature_used'
  payload: jsonb("payload").default({}),
  userId: text("user_id"), // Optional: user might be anonymous initially
  sessionId: text("session_id"),
  url: text("url"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id"),
  userId: text("user_id").references(() => users.id),
  content: text("content").notNull(),
  sentiment: text("sentiment"), // 'positive', 'neutral', 'negative'
  source: text("source").default("web"), // 'web', 'email', etc.
  timestamp: timestamp("timestamp").defaultNow(),
});

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'revenue', 'retention', 'ux'
  impactScore: doublePrecision("impact_score").notNull(), // 0.0 to 10.0
  severityScore: doublePrecision("severity_score"),
  frequencyScore: doublePrecision("frequency_score"),
  affectedUsersPercent: doublePrecision("affected_users_percent"),
  effortScore: doublePrecision("effort_score"),
  confidenceScore: doublePrecision("confidence_score"),
  reasoningSummary: text("reasoning_summary"),
  supportingData: jsonb("supporting_data"),
  modelUsed: text("model_used"),
  inputSnapshotHash: text("input_snapshot_hash"),
  status: text("status").default("new"), // 'new', 'reviewed', 'implemented', 'dismissed'
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertEventSchema = createInsertSchema(events).omit({ id: true, timestamp: true, workspaceId: true });
export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, timestamp: true, sentiment: true, workspaceId: true }); // Sentiment computed by AI
export const insertRecommendationSchema = createInsertSchema(recommendations).omit({ id: true, createdAt: true, workspaceId: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;

// API Request Types
export type CreateEventRequest = InsertEvent;
export type CreateFeedbackRequest = InsertFeedback;
export type CreateRecommendationRequest = InsertRecommendation;

// API Response Types
export type EventResponse = Event;
export type FeedbackResponse = Feedback;
export type RecommendationResponse = Recommendation;

export type DashboardStatsResponse = {
  totalEvents: number;
  totalFeedback: number;
  activeUsers: number;
  recentActivity: Event[];
};

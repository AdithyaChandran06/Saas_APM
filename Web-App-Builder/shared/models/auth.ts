import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // Added for local auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  emailVerified: timestamp("email_verified"), // NULL = not verified
  emailVerificationToken: varchar("email_verification_token"), // For pending verification
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Persistent token storage for email verification and password reset flows.
export const emailTokens = pgTable(
  "email_tokens",
  {
    id: serial("id").primaryKey(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    usedAt: timestamp("used_at"),
  },
  (table) => [
    index("idx_email_tokens_token").on(table.token),
    index("idx_email_tokens_email_type").on(table.email, table.type),
    index("idx_email_tokens_expires_at").on(table.expiresAt),
  ]
);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

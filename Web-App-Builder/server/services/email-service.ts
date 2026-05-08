/**
 * Email Service
 * Handles email verification tokens and password reset tokens
 * Supports both database (production) and in-memory (development) storage
 */

import { randomBytes } from "crypto";
import { db } from "../db";
import { sql } from "drizzle-orm";

export interface EmailToken {
  token: string;
  email: string;
  type: "verification" | "password-reset";
  expiresAt: Date;
  createdAt: Date;
}

// In-memory storage for tokens (fallback if database unavailable)
export const emailTokens = new Map<string, EmailToken>();

// Flag to track if we're using database
let useDatabase = false;

// Initialize database support
export async function initializeEmailTokens() {
  try {
    // Try to query the email_tokens table to verify it exists
    if (!db) {
      console.log("[Email Service] Database not available, using in-memory storage");
      useDatabase = false;
      return;
    }

    const result = await db.execute(
      sql`SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'email_tokens' AND table_schema = 'public'`
    );
    useDatabase = (result as any).rows?.[0]?.count > 0 || (result as any)[0]?.count > 0;
    if (useDatabase) {
      console.log("[Email Service] Using database for token storage");
    } else {
      console.log("[Email Service] Database table not found, using in-memory storage");
    }
  } catch (error) {
    console.log("[Email Service] Database unavailable, using in-memory storage");
    useDatabase = false;
  }
}

/**
 * Generate a secure token
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create email verification token
 */
export function createVerificationToken(email: string): EmailToken {
  const token = generateToken();
  const emailToken: EmailToken = {
    token,
    email,
    type: "verification",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    createdAt: new Date(),
  };

  // Store in database if available, otherwise in-memory
  if (useDatabase) {
    // Store in database (non-blocking)
    storeTokenInDatabase(emailToken).catch((err) =>
      console.error("[Email Service] Failed to store verification token in database:", err)
    );
  } else {
    emailTokens.set(token, emailToken);
  }

  return emailToken;
}

/**
 * Create password reset token
 */
export function createPasswordResetToken(email: string): EmailToken {
  const token = generateToken();
  const emailToken: EmailToken = {
    token,
    email,
    type: "password-reset",
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
    createdAt: new Date(),
  };

  // Store in database if available, otherwise in-memory
  if (useDatabase) {
    // Store in database (non-blocking)
    storeTokenInDatabase(emailToken).catch((err) =>
      console.error("[Email Service] Failed to store password reset token in database:", err)
    );
  } else {
    emailTokens.set(token, emailToken);
  }

  return emailToken;
}

/**
 * Verify and retrieve token
 */
export async function verifyToken(
  token: string,
  type: "verification" | "password-reset"
): Promise<EmailToken | null> {
  // Try database first if available
  if (useDatabase && db) {
    try {
      const result = await db.execute(
        sql`SELECT token, email, type, expires_at, created_at FROM email_tokens 
            WHERE token = ${token} AND type = ${type} AND expires_at > NOW() AND used_at IS NULL`
      );

      const row = (result as any).rows?.[0] || (result as any)[0];
      if (row) {
        return {
          token: row.token,
          email: row.email,
          type: row.type as "verification" | "password-reset",
          expiresAt: new Date(row.expires_at),
          createdAt: new Date(row.created_at),
        };
      }
      return null;
    } catch (error) {
      console.error("[Email Service] Failed to verify token in database:", error);
      // Fall through to in-memory
    }
  }

  // In-memory verification
  const emailToken = emailTokens.get(token);

  if (!emailToken) {
    return null;
  }

  // Check if expired
  if (emailToken.expiresAt < new Date()) {
    emailTokens.delete(token);
    return null;
  }

  // Check type matches
  if (emailToken.type !== type) {
    return null;
  }

  return emailToken;
}

/**
 * Consume token (mark as used)
 */
export async function consumeToken(token: string): Promise<boolean> {
  // Try database first if available
  if (useDatabase && db) {
    try {
      const result = await db.execute(
        sql`UPDATE email_tokens SET used_at = NOW() WHERE token = ${token} AND used_at IS NULL`
      );
      return (result as any).rowCount > 0 || (result as any)[0]?.changes > 0;
    } catch (error) {
      console.error("[Email Service] Failed to consume token in database:", error);
      // Fall through to in-memory
    }
  }

  // In-memory consumption
  return emailTokens.delete(token);
}

/**
 * Get verification link
 */
export function getVerificationLink(token: string): string {
  const baseUrl = process.env.CORS_ORIGIN || "http://localhost:5000";
  return `${baseUrl}/verify-email?token=${token}`;
}

/**
 * Get password reset link
 */
export function getPasswordResetLink(token: string): string {
  const baseUrl = process.env.CORS_ORIGIN || "http://localhost:5000";
  return `${baseUrl}/reset-password?token=${token}`;
}

/**
 * Format verification email
 */
export function formatVerificationEmail(token: string): { subject: string; html: string } {
  const link = getVerificationLink(token);
  return {
    subject: "Verify your Quantora account",
    html: `
      <h2>Welcome to Quantora!</h2>
      <p>Please verify your email address to complete your registration.</p>
      <p><a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
      <p>Or copy this link: <code>${link}</code></p>
      <p>This link expires in 24 hours.</p>
    `,
  };
}

/**
 * Format password reset email
 */
export function formatPasswordResetEmail(token: string): { subject: string; html: string } {
  const link = getPasswordResetLink(token);
  return {
    subject: "Reset your Quantora password",
    html: `
      <h2>Password Reset Request</h2>
      <p>We received a request to reset your password. Click the link below to proceed:</p>
      <p><a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>Or copy this link: <code>${link}</code></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  };
}

/**
 * Clean up expired tokens (call periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  // Try database first if available
  if (useDatabase && db) {
    try {
      const result = await db.execute(
        sql`DELETE FROM email_tokens WHERE expires_at < NOW() OR (used_at IS NOT NULL AND expires_at < NOW() + INTERVAL '24 hours')`
      );
      return (result as any).rowCount || (result as any)[0]?.changes || 0;
    } catch (error) {
      console.error("[Email Service] Failed to cleanup tokens in database:", error);
      // Fall through to in-memory
    }
  }

  // In-memory cleanup
  const now = new Date();
  let removed = 0;

  for (const [token, emailToken] of emailTokens.entries()) {
    if (emailToken.expiresAt < now) {
      emailTokens.delete(token);
      removed++;
    }
  }

  return removed;
}

/**
 * Store token in database
 */
async function storeTokenInDatabase(emailToken: EmailToken): Promise<void> {
  try {
    if (!db) {
      throw new Error("Database not available");
    }

    await db.execute(
      sql`INSERT INTO email_tokens (token, email, type, expires_at, created_at) 
          VALUES (${emailToken.token}, ${emailToken.email}, ${emailToken.type}, ${emailToken.expiresAt}, ${emailToken.createdAt})
          ON CONFLICT (token) DO NOTHING`
    );
  } catch (error) {
    // If database fails, fall back to in-memory
    emailTokens.set(emailToken.token, emailToken);
  }
}

// Run cleanup every 30 minutes
setInterval(() => {
  cleanupExpiredTokens()
    .then((removed) => {
      if (removed > 0) {
        console.log(`[Email Service] Cleaned up ${removed} expired tokens`);
      }
    })
    .catch((err) => console.error("[Email Service] Cleanup error:", err));
}, 30 * 60 * 1000);

/**
 * Email Service
 * Handles email verification tokens and password reset tokens
 */

import { randomBytes } from "crypto";

export interface EmailToken {
  token: string;
  email: string;
  type: "verification" | "password-reset";
  expiresAt: Date;
  createdAt: Date;
}

// In-memory storage for tokens (in production, use database)
export const emailTokens = new Map<string, EmailToken>();

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

  emailTokens.set(token, emailToken);
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

  emailTokens.set(token, emailToken);
  return emailToken;
}

/**
 * Verify and retrieve token
 */
export function verifyToken(token: string, type: "verification" | "password-reset"): EmailToken | null {
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
export function consumeToken(token: string): boolean {
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
export function cleanupExpiredTokens(): number {
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

// Run cleanup every 30 minutes
setInterval(() => {
  const removed = cleanupExpiredTokens();
  if (removed > 0) {
    console.log(`[Email Service] Cleaned up ${removed} expired tokens`);
  }
}, 30 * 60 * 1000);

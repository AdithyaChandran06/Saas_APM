/**
 * Tests for Email Service
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  generateToken,
  createVerificationToken,
  createPasswordResetToken,
  verifyToken,
  consumeToken,
  emailTokens,
  getVerificationLink,
  getPasswordResetLink,
} from "../services/email-service";

describe("Email Service", () => {
  beforeEach(() => {
    // Clear tokens before each test
    emailTokens.clear();
  });

  describe("generateToken", () => {
    it("should generate a valid token", () => {
      const token = generateToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    });

    it("should generate unique tokens", () => {
      const token1 = generateToken();
      const token2 = generateToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("createVerificationToken", () => {
    it("should create a verification token", () => {
      const email = "test@example.com";
      const emailToken = createVerificationToken(email);

      expect(emailToken).toBeDefined();
      expect(emailToken.email).toBe(email);
      expect(emailToken.type).toBe("verification");
      expect(emailToken.expiresAt).toBeInstanceOf(Date);
      expect(emailToken.createdAt).toBeInstanceOf(Date);
    });

    it("should store token in map", () => {
      const email = "test@example.com";
      const emailToken = createVerificationToken(email);

      expect(emailTokens.has(emailToken.token)).toBe(true);
      expect(emailTokens.get(emailToken.token)).toBe(emailToken);
    });

    it("should have 24 hour expiration", () => {
      const emailToken = createVerificationToken("test@example.com");
      const expirationMs = emailToken.expiresAt.getTime() - emailToken.createdAt.getTime();
      const expectedMs = 24 * 60 * 60 * 1000;

      // Allow 1 second variance
      expect(Math.abs(expirationMs - expectedMs)).toBeLessThan(1000);
    });
  });

  describe("createPasswordResetToken", () => {
    it("should create a password reset token", () => {
      const email = "test@example.com";
      const emailToken = createPasswordResetToken(email);

      expect(emailToken).toBeDefined();
      expect(emailToken.email).toBe(email);
      expect(emailToken.type).toBe("password-reset");
    });

    it("should have 1 hour expiration", () => {
      const emailToken = createPasswordResetToken("test@example.com");
      const expirationMs = emailToken.expiresAt.getTime() - emailToken.createdAt.getTime();
      const expectedMs = 1 * 60 * 60 * 1000;

      // Allow 1 second variance
      expect(Math.abs(expirationMs - expectedMs)).toBeLessThan(1000);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid verification token", async () => {
      const email = "test@example.com";
      const emailToken = createVerificationToken(email);

      const verified = await verifyToken(emailToken.token, "verification");
      expect(verified).toBeDefined();
      expect(verified?.email).toBe(email);
    });

    it("should reject invalid token", async () => {
      const verified = await verifyToken("invalid-token", "verification");
      expect(verified).toBeNull();
    });

    it("should reject wrong token type", async () => {
      const emailToken = createVerificationToken("test@example.com");
      const verified = await verifyToken(emailToken.token, "password-reset");
      expect(verified).toBeNull();
    });

    it("should reject expired token", async () => {
      const email = "test@example.com";
      const emailToken = createVerificationToken(email);
      // Set expiration to past
      emailToken.expiresAt = new Date(Date.now() - 1000);

      const verified = await verifyToken(emailToken.token, "verification");
      expect(verified).toBeNull();
      // Expired token should be deleted
      expect(emailTokens.has(emailToken.token)).toBe(false);
    });
  });

  describe("consumeToken", () => {
    it("should remove token from storage", async () => {
      const emailToken = createVerificationToken("test@example.com");
      expect(emailTokens.has(emailToken.token)).toBe(true);

      await consumeToken(emailToken.token);
      expect(emailTokens.has(emailToken.token)).toBe(false);
    });

    it("should return false for non-existent token", async () => {
      const result = await consumeToken("non-existent");
      expect(result).toBe(false);
    });

    it("should handle multiple consumptions gracefully", async () => {
      const emailToken = createVerificationToken("test@example.com");
      const result1 = await consumeToken(emailToken.token);
      const result2 = await consumeToken(emailToken.token);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe("Link generation", () => {
    it("should generate verification link", () => {
      const token = generateToken();
      const link = getVerificationLink(token);

      expect(link).toContain("/verify-email");
      expect(link).toContain(`token=${token}`);
    });

    it("should generate password reset link", () => {
      const token = generateToken();
      const link = getPasswordResetLink(token);

      expect(link).toContain("/reset-password");
      expect(link).toContain(`token=${token}`);
    });

    it("should include base URL in links", () => {
      const token = generateToken();
      const verificationLink = getVerificationLink(token);
      const resetLink = getPasswordResetLink(token);

      expect(verificationLink).toMatch(/^http:\/\/|^https:\/\//);
      expect(resetLink).toMatch(/^http:\/\/|^https:\/\//);
    });
  });

  describe("Token lifecycle", () => {
    it("should complete full verification flow", async () => {
      const email = "user@example.com";
      
      // Create token
      const emailToken = createVerificationToken(email);
      expect(emailTokens.has(emailToken.token)).toBe(true);

      // Verify token
      const verified = await verifyToken(emailToken.token, "verification");
      expect(verified).not.toBeNull();

      // Consume token
      const consumed = await consumeToken(emailToken.token);
      expect(consumed).toBe(true);
      expect(emailTokens.has(emailToken.token)).toBe(false);

      // Can't verify after consumption
      const reVerified = await verifyToken(emailToken.token, "verification");
      expect(reVerified).toBeNull();
    });

    it("should handle password reset flow", async () => {
      const email = "user@example.com";
      
      // Create reset token
      const resetToken = createPasswordResetToken(email);
      expect(resetToken.type).toBe("password-reset");

      // Verify reset token
      const verified = await verifyToken(resetToken.token, "password-reset");
      expect(verified?.email).toBe(email);

      // Consume reset token
      const consumed = await consumeToken(resetToken.token);
      expect(consumed).toBe(true);
    });

    it("should maintain separate token namespaces", async () => {
      const email = "user@example.com";
      
      // Create both types
      const verificationToken = createVerificationToken(email);
      const resetToken = createPasswordResetToken(email);

      // Verification token should not work as reset token
      const asReset = await verifyToken(verificationToken.token, "password-reset");
      expect(asReset).toBeNull();

      // Reset token should not work as verification token
      const asVerification = await verifyToken(resetToken.token, "verification");
      expect(asVerification).toBeNull();
    });
  });
});\n
import { Router, type Request } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { db, hasDatabase } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import {
  createVerificationToken,
  createPasswordResetToken,
  verifyToken,
  consumeToken,
  getVerificationLink,
  getPasswordResetLink,
  formatVerificationEmail,
  formatPasswordResetEmail,
} from "./services/email-service";
import { sendEmailNotification } from "./services/notification-service";

const router = Router();

// In-memory fallback for users when database is unavailable
const memoryUsers = new Map<string, { id: string; email: string; password: string; firstName: string; lastName: string; profileImageUrl: string; emailVerified?: Date; emailVerificationToken?: string }>();

function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((err: unknown) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName } = registerSchema.parse(req.body);

    // Check if user already exists
    let existingUser: typeof memoryUsers.values | any[] = [];
    if (db && hasDatabase) {
      existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    } else {
      existingUser = Array.from(memoryUsers.values()).filter((u) => u.email === email);
    }

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let newUser;
    if (db && hasDatabase) {
      // Create user in database
      const [dbUser] = await db.insert(users).values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      }).returning();
      newUser = dbUser;
    } else {
      // Create user in memory
      newUser = { id: userId, email, password: hashedPassword, firstName, lastName, profileImageUrl: "" };
      memoryUsers.set(email, newUser);
    }

    // Create session and persist it before returning.
    req.session.userId = newUser.id;
    await saveSession(req);

    res.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        profileImageUrl: newUser.profileImageUrl || "",
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ message: "Invalid registration data" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    let user: any = null;
    if (db && hasDatabase) {
      const [dbUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      user = dbUser;
    } else {
      user = memoryUsers.get(email);
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password || "");
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.session.userId = user.id;
    await saveSession(req);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl || "",
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({ message: "Invalid login data" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

// Get current user
router.get("/user", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    let user: any = null;
    if (db && hasDatabase) {
      const [dbUser] = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      }).from(users).where(eq(users.id, req.session.userId)).limit(1);
      user = dbUser;
    } else {
      // Find user in memory
      for (const memUser of memoryUsers.values()) {
        if (memUser.id === req.session.userId) {
          user = {
            id: memUser.id,
            email: memUser.email,
            firstName: memUser.firstName,
            lastName: memUser.lastName,
            profileImageUrl: memUser.profileImageUrl,
          };
          break;
        }
      }
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Verify email
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);

    const emailToken = await verifyToken(token, "verification");
    if (!emailToken) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    // Find user by email
    let user: any = null;
    if (db && hasDatabase) {
      const [dbUser] = await db.select().from(users).where(eq(users.email, emailToken.email)).limit(1);
      if (dbUser) {
        await db
          .update(users)
          .set({ emailVerified: new Date(), emailVerificationToken: null })
          .where(eq(users.id, dbUser.id));
        user = dbUser;
      }
    } else {
      const memUser = memoryUsers.get(emailToken.email);
      if (memUser) {
        memUser.emailVerified = new Date();
        delete memUser.emailVerificationToken;
        user = memUser;
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await consumeToken(token);
    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(400).json({ message: "Invalid verification request" });
  }
});

// Forgot password - send reset email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    // Find user
    let user: any = null;
    if (db && hasDatabase) {
      const [dbUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      user = dbUser;
    } else {
      user = memoryUsers.get(email);
    }

    if (!user) {
      // Don't leak whether user exists - return success anyway
      return res.json({ message: "If an account exists, password reset email will be sent" });
    }

    // Create password reset token
    const resetToken = createPasswordResetToken(email);
    const resetLink = getPasswordResetLink(resetToken.token);
    const { subject, html } = formatPasswordResetEmail(resetToken.token);

    // Send email (will log if SMTP not configured)
    try {
      await sendEmailNotification(email, subject, html.replace(/^<[^>]+>/, "").replace(/<[^>]+>$/g, ""));
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Still return success - user can use reset link
    }

    console.log(`[Password Reset] Reset link for ${email}: ${resetLink}`);
    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(400).json({ message: "Invalid request" });
  }
});

// Reset password - use token from forgot-password email
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = z
      .object({
        token: z.string(),
        newPassword: z.string().min(8),
      })
      .parse(req.body);

    const resetToken = await verifyToken(token, "password-reset");
    if (!resetToken) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    let user: any = null;

    if (db && hasDatabase) {
      const [dbUser] = await db.select().from(users).where(eq(users.email, resetToken.email)).limit(1);
      if (dbUser) {
        await db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, dbUser.id));
        user = dbUser;
      }
    } else {
      const memUser = memoryUsers.get(resetToken.email);
      if (memUser) {
        memUser.password = hashedPassword;
        user = memUser;
      }
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await consumeToken(token);
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(400).json({ message: "Invalid reset request" });
  }
});

export { router as authRouter, memoryUsers };

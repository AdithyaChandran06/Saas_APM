import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { db } from "../db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

const router = Router();

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
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    }).returning();

    // Create session
    req.session.userId = newUser.id;

    res.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        profileImageUrl: newUser.profileImageUrl,
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
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password || "");
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.session.userId = user.id;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
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
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    }).from(users).where(eq(users.id, req.session.userId)).limit(1);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export { router as authRouter };
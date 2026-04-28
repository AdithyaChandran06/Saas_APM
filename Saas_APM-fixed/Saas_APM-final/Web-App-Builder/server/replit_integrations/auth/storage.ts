import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db, hasDatabase } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  private memoryUsers = new Map<string, User>();

  async getUser(id: string): Promise<User | undefined> {
    if (!hasDatabase) {
      return this.memoryUsers.get(id);
    }
    const [user] = await db!.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!hasDatabase) {
      const userId = userData.id ?? `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const existing = this.memoryUsers.get(userId);
      const next = {
        ...existing,
        ...userData,
        id: userId,
        updatedAt: new Date(),
        createdAt: existing?.createdAt ?? new Date(),
      } as User;
      this.memoryUsers.set(userId, next);
      return next;
    }

    const [user] = await db!
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();

import { db, hasDatabase } from "./db";
import {
  events,
  feedback,
  recommendations,
  users,
  type InsertEvent,
  type InsertFeedback,
  type InsertRecommendation,
  type UpsertUser,
  type Event,
  type Feedback,
  type Recommendation,
  type User,
} from "@shared/schema";
import { eq, desc, count } from "drizzle-orm";

type FeedbackInput = InsertFeedback & { sentiment?: string | null };

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;

  // Events
  createEvent(event: InsertEvent): Promise<Event>;
  getEvents(limit?: number): Promise<Event[]>;
  getEventsCount(): Promise<number>;

  // Feedback
  createFeedback(feedback: FeedbackInput): Promise<Feedback>;
  getFeedback(): Promise<Feedback[]>;
  getFeedbackCount(): Promise<number>;

  // Recommendations
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  getRecommendations(): Promise<Recommendation[]>;
  getRecommendation(id: number): Promise<Recommendation | undefined>;
  updateRecommendation(id: number, updates: Partial<InsertRecommendation>): Promise<Recommendation | undefined>;
  deleteRecommendation(id: number): Promise<boolean>;
  clearRecommendations(): Promise<void>; // For regenerating

  // Stats
  getActiveUsersCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User methods (Basic implementation if needed outside auth module)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Note: The auth module schema uses 'email' as the unique identifier mainly,
    // but if we had a username field we'd check it.
    // The provided auth schema has email, so we'll check email here if username is passed as email
    const [user] = await db!.select().from(users).where(eq(users.email, username));
    return user;
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    const [user] = await db!.insert(users).values(insertUser).returning();
    return user;
  }

  // Events
  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db!.insert(events).values(event).returning();
    return newEvent;
  }

  async getEvents(limit: number = 100): Promise<Event[]> {
    return db!.select().from(events).orderBy(desc(events.timestamp)).limit(limit);
  }

  async getEventsCount(): Promise<number> {
    const [result] = await db!.select({ count: count() }).from(events);
    return result.count;
  }

  // Feedback
  async createFeedback(fb: FeedbackInput): Promise<Feedback> {
    const [newFeedback] = await db!.insert(feedback).values(fb).returning();
    return newFeedback;
  }

  async getFeedback(): Promise<Feedback[]> {
    return db!.select().from(feedback).orderBy(desc(feedback.timestamp));
  }

  async getFeedbackCount(): Promise<number> {
    const [result] = await db!.select({ count: count() }).from(feedback);
    return result.count;
  }

  // Recommendations
  async createRecommendation(rec: InsertRecommendation): Promise<Recommendation> {
    const [newRec] = await db!.insert(recommendations).values(rec).returning();
    return newRec;
  }

  async getRecommendations(): Promise<Recommendation[]> {
    return db!.select().from(recommendations).orderBy(desc(recommendations.impactScore));
  }

  async getRecommendation(id: number): Promise<Recommendation | undefined> {
    const [rec] = await db!.select().from(recommendations).where(eq(recommendations.id, id));
    return rec;
  }

  async updateRecommendation(id: number, updates: Partial<InsertRecommendation>): Promise<Recommendation | undefined> {
    const [updated] = await db!.update(recommendations).set(updates).where(eq(recommendations.id, id)).returning();
    return updated;
  }

  async deleteRecommendation(id: number): Promise<boolean> {
    const result = await db!.delete(recommendations).where(eq(recommendations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async clearRecommendations(): Promise<void> {
    await db!.delete(recommendations);
  }

  // Stats
  async getActiveUsersCount(): Promise<number> {
    // Count unique users in events in the last 30 days (simplified to total unique users for now)
    const [result] = await db!
      .select({ count: count(events.userId) })
      .from(events);
    return result.count;
  }
}

class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private eventsData: Event[] = [];
  private feedbackData: Feedback[] = [];
  private recommendationsData: Recommendation[] = [];
  private nextEventId = 1;
  private nextFeedbackId = 1;
  private nextRecommendationId = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.email === username);
  }

  async createUser(user: UpsertUser): Promise<User> {
    const newUser = { ...user, createdAt: new Date(), updatedAt: new Date() } as User;
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const newEvent = {
      id: this.nextEventId++,
      timestamp: new Date(),
      payload: event.payload ?? {},
      sessionId: event.sessionId ?? null,
      url: event.url ?? null,
      userId: event.userId ?? null,
      type: event.type,
    } as Event;
    this.eventsData.unshift(newEvent);
    return newEvent;
  }

  async getEvents(limit = 100): Promise<Event[]> {
    return this.eventsData.slice(0, limit);
  }

  async getEventsCount(): Promise<number> {
    return this.eventsData.length;
  }

  async createFeedback(fb: FeedbackInput): Promise<Feedback> {
    const newFeedback = {
      id: this.nextFeedbackId++,
      timestamp: new Date(),
      userId: fb.userId ?? null,
      content: fb.content,
      sentiment: fb.sentiment ?? null,
      source: fb.source ?? "web",
    } as Feedback;
    this.feedbackData.unshift(newFeedback);
    return newFeedback;
  }

  async getFeedback(): Promise<Feedback[]> {
    return [...this.feedbackData];
  }

  async getFeedbackCount(): Promise<number> {
    return this.feedbackData.length;
  }

  async createRecommendation(rec: InsertRecommendation): Promise<Recommendation> {
    const newRecommendation = {
      id: this.nextRecommendationId++,
      createdAt: new Date(),
      status: rec.status ?? "new",
      title: rec.title,
      description: rec.description,
      category: rec.category,
      impactScore: rec.impactScore,
      severityScore: rec.severityScore,
      frequencyScore: rec.frequencyScore,
      affectedUsersPercent: rec.affectedUsersPercent,
      effortScore: rec.effortScore,
      confidenceScore: rec.confidenceScore,
      reasoningSummary: rec.reasoningSummary,
      supportingData: rec.supportingData,
      modelUsed: rec.modelUsed,
      inputSnapshotHash: rec.inputSnapshotHash,
    } as Recommendation;
    this.recommendationsData.unshift(newRecommendation);
    return newRecommendation;
  }

  async getRecommendations(): Promise<Recommendation[]> {
    return [...this.recommendationsData].sort((a, b) => b.impactScore - a.impactScore);
  }

  async getRecommendation(id: number): Promise<Recommendation | undefined> {
    return this.recommendationsData.find((r) => r.id === id);
  }

  async updateRecommendation(id: number, updates: Partial<InsertRecommendation>): Promise<Recommendation | undefined> {
    const index = this.recommendationsData.findIndex((r) => r.id === id);
    if (index === -1) return undefined;
    
    const existing = this.recommendationsData[index];
    const updated = { ...existing, ...updates };
    this.recommendationsData[index] = updated;
    return updated;
  }

  async deleteRecommendation(id: number): Promise<boolean> {
    const index = this.recommendationsData.findIndex((r) => r.id === id);
    if (index === -1) return false;
    
    this.recommendationsData.splice(index, 1);
    return true;
  }

  async clearRecommendations(): Promise<void> {
    this.recommendationsData = [];
  }

  async getActiveUsersCount(): Promise<number> {
    const userIds = new Set(this.eventsData.map((e) => e.userId).filter(Boolean));
    return userIds.size;
  }
}

export function createStorage() {
  return hasDatabase && db ? new DatabaseStorage() : new MemoryStorage();
}

export let storage = createStorage();

export function refreshStorage() {
  storage = createStorage();
  return storage;
}

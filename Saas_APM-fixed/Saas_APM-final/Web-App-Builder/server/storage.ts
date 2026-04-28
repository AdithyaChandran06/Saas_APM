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
import { and, eq, desc, count } from "drizzle-orm";

type FeedbackInput = InsertFeedback & { sentiment?: string | null };
type WorkspaceScopedEvent = InsertEvent & { workspaceId: number };
type WorkspaceScopedFeedback = FeedbackInput & { workspaceId: number };
type WorkspaceScopedRecommendation = InsertRecommendation & { workspaceId: number };

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;

  // Events
  createEvent(event: WorkspaceScopedEvent): Promise<Event>;
  getEvents(limit?: number, workspaceId?: number): Promise<Event[]>;
  getEventsCount(workspaceId?: number): Promise<number>;

  // Feedback
  createFeedback(feedback: WorkspaceScopedFeedback): Promise<Feedback>;
  getFeedback(workspaceId?: number): Promise<Feedback[]>;
  getFeedbackCount(workspaceId?: number): Promise<number>;

  // Recommendations
  createRecommendation(recommendation: WorkspaceScopedRecommendation): Promise<Recommendation>;
  getRecommendations(workspaceId?: number): Promise<Recommendation[]>;
  getRecommendation(id: number, workspaceId?: number): Promise<Recommendation | undefined>;
  updateRecommendation(id: number, updates: Partial<InsertRecommendation>, workspaceId?: number): Promise<Recommendation | undefined>;
  deleteRecommendation(id: number, workspaceId?: number): Promise<boolean>;
  clearRecommendations(workspaceId?: number): Promise<void>; // For regenerating

  // Stats
  getActiveUsersCount(workspaceId?: number): Promise<number>;
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
  async createEvent(event: WorkspaceScopedEvent): Promise<Event> {
    const [newEvent] = await db!.insert(events).values(event).returning();
    return newEvent;
  }

  async getEvents(limit: number = 100, workspaceId?: number): Promise<Event[]> {
    const query = db!.select().from(events);
    const filtered = workspaceId === undefined ? query : query.where(eq(events.workspaceId, workspaceId));
    return filtered.orderBy(desc(events.timestamp)).limit(limit);
  }

  async getEventsCount(workspaceId?: number): Promise<number> {
    const query = db!.select({ count: count() }).from(events);
    const filtered = workspaceId === undefined ? query : query.where(eq(events.workspaceId, workspaceId));
    const [result] = await filtered;
    return result.count;
  }

  // Feedback
  async createFeedback(fb: WorkspaceScopedFeedback): Promise<Feedback> {
    const [newFeedback] = await db!.insert(feedback).values(fb).returning();
    return newFeedback;
  }

  async getFeedback(workspaceId?: number): Promise<Feedback[]> {
    const query = db!.select().from(feedback);
    const filtered = workspaceId === undefined ? query : query.where(eq(feedback.workspaceId, workspaceId));
    return filtered.orderBy(desc(feedback.timestamp));
  }

  async getFeedbackCount(workspaceId?: number): Promise<number> {
    const query = db!.select({ count: count() }).from(feedback);
    const filtered = workspaceId === undefined ? query : query.where(eq(feedback.workspaceId, workspaceId));
    const [result] = await filtered;
    return result.count;
  }

  // Recommendations
  async createRecommendation(rec: WorkspaceScopedRecommendation): Promise<Recommendation> {
    const [newRec] = await db!.insert(recommendations).values(rec).returning();
    return newRec;
  }

  async getRecommendations(workspaceId?: number): Promise<Recommendation[]> {
    if (workspaceId === undefined) {
      return db!.select().from(recommendations).orderBy(desc(recommendations.impactScore));
    }

    return db!.select().from(recommendations).where(eq(recommendations.workspaceId, workspaceId)).orderBy(desc(recommendations.impactScore));
  }

  async getRecommendation(id: number, workspaceId?: number): Promise<Recommendation | undefined> {
    const query = workspaceId === undefined
      ? db!.select().from(recommendations).where(eq(recommendations.id, id))
      : db!.select().from(recommendations).where(and(eq(recommendations.id, id), eq(recommendations.workspaceId, workspaceId)));
    const [rec] = await query;
    return rec;
  }

  async updateRecommendation(id: number, updates: Partial<InsertRecommendation>, workspaceId?: number): Promise<Recommendation | undefined> {
    const query = workspaceId === undefined
      ? db!.update(recommendations).set(updates).where(eq(recommendations.id, id))
      : db!.update(recommendations).set(updates).where(and(eq(recommendations.id, id), eq(recommendations.workspaceId, workspaceId)));
    const [updated] = await query.returning();
    return updated;
  }

  async deleteRecommendation(id: number, workspaceId?: number): Promise<boolean> {
    const result = workspaceId === undefined
      ? await db!.delete(recommendations).where(eq(recommendations.id, id))
      : await db!.delete(recommendations).where(and(eq(recommendations.id, id), eq(recommendations.workspaceId, workspaceId)));
    return (result.rowCount ?? 0) > 0;
  }

  async clearRecommendations(workspaceId?: number): Promise<void> {
    if (workspaceId === undefined) {
      await db!.delete(recommendations);
      return;
    }
    await db!.delete(recommendations).where(eq(recommendations.workspaceId, workspaceId));
  }

  // Stats
  async getActiveUsersCount(workspaceId?: number): Promise<number> {
    // Count unique users in events in the last 30 days (simplified to total unique users for now)
    const query = db!
      .select({ count: count(events.userId) })
      .from(events);
    const filtered = workspaceId === undefined ? query : query.where(eq(events.workspaceId, workspaceId));
    const [result] = await filtered;
    return result.count;
  }
}

class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private eventsData: Array<Event & { workspaceId: number | null }> = [];
  private feedbackData: Array<Feedback & { workspaceId: number | null }> = [];
  private recommendationsData: Array<Recommendation & { workspaceId: number | null }> = [];
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

  async createEvent(event: WorkspaceScopedEvent): Promise<Event> {
    const newEvent = {
      id: this.nextEventId++,
      workspaceId: event.workspaceId,
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

  async getEvents(limit = 100, workspaceId?: number): Promise<Event[]> {
    const items = workspaceId === undefined ? this.eventsData : this.eventsData.filter((event) => event.workspaceId === workspaceId);
    return items.slice(0, limit);
  }

  async getEventsCount(workspaceId?: number): Promise<number> {
    return workspaceId === undefined
      ? this.eventsData.length
      : this.eventsData.filter((event) => event.workspaceId === workspaceId).length;
  }

  async createFeedback(fb: WorkspaceScopedFeedback): Promise<Feedback> {
    const newFeedback = {
      id: this.nextFeedbackId++,
      workspaceId: fb.workspaceId,
      timestamp: new Date(),
      userId: fb.userId ?? null,
      content: fb.content,
      sentiment: fb.sentiment ?? null,
      source: fb.source ?? "web",
    } as Feedback;
    this.feedbackData.unshift(newFeedback);
    return newFeedback;
  }

  async getFeedback(workspaceId?: number): Promise<Feedback[]> {
    const items = workspaceId === undefined ? this.feedbackData : this.feedbackData.filter((feedbackItem) => feedbackItem.workspaceId === workspaceId);
    return [...items];
  }

  async getFeedbackCount(workspaceId?: number): Promise<number> {
    return workspaceId === undefined
      ? this.feedbackData.length
      : this.feedbackData.filter((feedbackItem) => feedbackItem.workspaceId === workspaceId).length;
  }

  async createRecommendation(rec: WorkspaceScopedRecommendation): Promise<Recommendation> {
    const newRecommendation = {
      id: this.nextRecommendationId++,
      workspaceId: rec.workspaceId,
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

  async getRecommendations(workspaceId?: number): Promise<Recommendation[]> {
    const items = workspaceId === undefined ? this.recommendationsData : this.recommendationsData.filter((recommendation) => recommendation.workspaceId === workspaceId);
    return [...items].sort((a, b) => b.impactScore - a.impactScore);
  }

  async getRecommendation(id: number, workspaceId?: number): Promise<Recommendation | undefined> {
    return this.recommendationsData.find((r) => r.id === id && (workspaceId === undefined || r.workspaceId === workspaceId));
  }

  async updateRecommendation(id: number, updates: Partial<InsertRecommendation>, workspaceId?: number): Promise<Recommendation | undefined> {
    const index = this.recommendationsData.findIndex((r) => r.id === id);
    if (index === -1) return undefined;
    if (workspaceId !== undefined && this.recommendationsData[index].workspaceId !== workspaceId) return undefined;
    
    const existing = this.recommendationsData[index];
    const updated = { ...existing, ...updates };
    this.recommendationsData[index] = updated;
    return updated;
  }

  async deleteRecommendation(id: number, workspaceId?: number): Promise<boolean> {
    const index = this.recommendationsData.findIndex((r) => r.id === id);
    if (index === -1) return false;
    if (workspaceId !== undefined && this.recommendationsData[index].workspaceId !== workspaceId) return false;
    
    this.recommendationsData.splice(index, 1);
    return true;
  }

  async clearRecommendations(workspaceId?: number): Promise<void> {
    if (workspaceId === undefined) {
      this.recommendationsData = [];
      return;
    }
    this.recommendationsData = this.recommendationsData.filter((recommendation) => recommendation.workspaceId !== workspaceId);
  }

  async getActiveUsersCount(workspaceId?: number): Promise<number> {
    const scopedEvents = workspaceId === undefined ? this.eventsData : this.eventsData.filter((event) => event.workspaceId === workspaceId);
    const userIds = new Set(scopedEvents.map((e) => e.userId).filter(Boolean));
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

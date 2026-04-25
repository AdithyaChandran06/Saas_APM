import type { Express } from "express";
import type { Server } from "http";
import { refreshStorage, storage } from "./storage";
import { db as appDb, hasDatabase, verifyDatabaseConnection } from "./db";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import OpenAI from "openai";
import { and, desc, eq } from "drizzle-orm";
import {
  alerts as alertsTable,
  apiKeys as apiKeysTable,
  workspaceSettings as workspaceSettingsTable,
  workspaces,
} from "@shared/schema-extended";
import { analyzeSentiment } from "./services/sentiment-analysis";
import { deriveCorrelationEvidence } from "./services/correlation";
import { scoreRecommendation } from "./services/scoring";
import { generateRecommendationsWithRetries } from "./services/ai-recommendations";
import type { InsertEvent, InsertFeedback, UpsertUser } from "@shared/schema";

const openaiApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
const openai = openaiApiKey
  ? new OpenAI({
      apiKey: openaiApiKey,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    })
  : null;

type AlertItem = {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  metricType: string;
  channels: string[];
  enabled: boolean;
  createdAt: string;
  acknowledgedAt?: string;
};

type SettingsState = {
  dataCollectionEnabled: boolean;
  aiAnalysisFrequency: "realtime" | "daily" | "weekly";
  retentionDays: number;
  privacyMode: boolean;
  sampleRate: number;
};

let settingsState: SettingsState = {
  dataCollectionEnabled: true,
  aiAnalysisFrequency: "daily",
  retentionDays: 90,
  privacyMode: false,
  sampleRate: 1,
};

let profileState = {
  id: "local-dev-user",
  email: "local@example.com",
  firstName: "Local",
  lastName: "Developer",
  profileImageUrl: "",
};

let apiKeysState: Array<{ id: number | string; name: string; key: string; createdAt: string; lastUsed: string | null }> = [];
let alertsState: AlertItem[] = [];
let hasExtendedDbTables = true;

function paginate<T>(items: T[], limit: number, offset: number) {
  const sliced = items.slice(offset, offset + limit);
  return {
    items: sliced,
    pagination: {
      total: items.length,
      limit,
      offset,
      hasMore: offset + limit < items.length,
    },
  };
}

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseNumericParam(value: string | string[]) {
  return parseInt(Array.isArray(value) ? value[0] : value, 10);
}

function weekKey(date: Date) {
  const year = date.getUTCFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.floor((day + start.getUTCDay()) / 7) + 1;
  return `${year}-W${week}`;
}

async function getWorkspaceId() {
  if (!hasDatabase || !appDb || !hasExtendedDbTables) return null;

  try {
    const [existing] = await appDb.select({ id: workspaces.id }).from(workspaces).orderBy(desc(workspaces.id)).limit(1);
    if (existing) return existing.id;

    try {
      await storage.createUser({
        id: profileState.id,
        email: profileState.email,
        firstName: profileState.firstName,
        lastName: profileState.lastName,
      });
    } catch {
      // user likely already exists
    }

    const [created] = await appDb
      .insert(workspaces)
      .values({
        name: "Default Workspace",
        slug: `default-${Date.now()}`,
        ownerId: profileState.id,
      })
      .returning({ id: workspaces.id });

    if (!created) return null;

    await appDb.insert(workspaceSettingsTable).values({ workspaceId: created.id });
    return created.id;
  } catch (error) {
    hasExtendedDbTables = false;
    console.warn("Extended DB tables unavailable, using in-memory fallback for settings/alerts/api-keys.", error);
    return null;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await verifyDatabaseConnection();
  refreshStorage();

  // Setup Integrations
  if (process.env.REPL_ID) {
    await setupAuth(app);
    registerAuthRoutes(app);
  } else {
    app.get("/api/login", (_req, res) => {
      res.redirect("/");
    });
    app.get("/api/logout", (_req, res) => {
      res.redirect("/");
    });
    app.get("/api/auth/user", (_req, res) => {
      res.json(profileState);
    });
  }

  if (hasDatabase) {
    registerChatRoutes(app);
  }

  // API Routes

  // Events
  app.post(api.events.create.path, async (req, res) => {
    try {
      const input = api.events.create.input.parse(req.body);
      const event = await storage.createEvent(input);
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.events.list.path, async (req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.get(api.events.query.path, async (req, res) => {
    try {
      const query = api.events.query.query.parse(req.query);
      const from = parseDate(query.from);
      const to = parseDate(query.to);
      const allEvents = await storage.getEvents(5000);
      const filtered = allEvents.filter((event) => {
        if (query.type && event.type !== query.type) return false;
        if (query.userId && event.userId !== query.userId) return false;
        if (query.urlContains && !(event.url ?? "").toLowerCase().includes(query.urlContains.toLowerCase())) return false;
        if (from && event.timestamp && new Date(event.timestamp) < from) return false;
        if (to && event.timestamp && new Date(event.timestamp) > to) return false;
        return true;
      });
      res.json(paginate(filtered, query.limit, query.offset));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.post("/api/events/batch", async (req, res) => {
    try {
      const payload = z
        .object({
          events: z.array(
            z.object({
              type: z.string().min(1),
              payload: z.record(z.any()).optional(),
              userId: z.string().optional(),
              sessionId: z.string().optional(),
              url: z.string().optional(),
            }),
          ),
        })
        .parse(req.body);

      for (const event of payload.events) {
        await storage.createEvent({
          type: event.type,
          payload: event.payload ?? {},
          userId: event.userId,
          sessionId: event.sessionId,
          url: event.url,
        });
      }

      res.json({ success: true, eventsProcessed: payload.events.length });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  // Feedback
  app.post(api.feedback.create.path, async (req, res) => {
    try {
      const input = api.feedback.create.input.parse(req.body);
      const sentiment = analyzeSentiment(input.content).sentiment;
      const fb = await storage.createFeedback({ ...input, sentiment });
      res.status(201).json(fb);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.feedback.list.path, async (req, res) => {
    const feedback = await storage.getFeedback();
    res.json(feedback);
  });

  app.get(api.feedback.query.path, async (req, res) => {
    try {
      const query = api.feedback.query.query.parse(req.query);
      const from = parseDate(query.from);
      const to = parseDate(query.to);
      const allFeedback = await storage.getFeedback();
      const filtered = allFeedback.filter((item) => {
        if (query.sentiment && item.sentiment !== query.sentiment) return false;
        if (query.source && item.source !== query.source) return false;
        if (query.userId && item.userId !== query.userId) return false;
        if (query.query && !item.content.toLowerCase().includes(query.query.toLowerCase())) return false;
        if (from && item.timestamp && new Date(item.timestamp) < from) return false;
        if (to && item.timestamp && new Date(item.timestamp) > to) return false;
        return true;
      });
      res.json(paginate(filtered, query.limit, query.offset));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  // Recommendations
  app.post(api.recommendations.create.path, async (req, res) => {
    try {
      const input = api.recommendations.create.input.parse(req.body);
      const rec = await storage.createRecommendation(input);
      res.status(201).json(rec);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.get(api.recommendations.list.path, async (req, res) => {
    const recs = await storage.getRecommendations();
    res.json(recs);
  });

  app.get(api.recommendations.get.path, async (req, res) => {
    const id = parseNumericParam(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid recommendation id" });
    }
    const rec = await storage.getRecommendation(id);
    if (!rec) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    res.json(rec);
  });

  app.put(api.recommendations.update.path, async (req, res) => {
    try {
      const id = parseNumericParam(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid recommendation id" });
      }
      const input = api.recommendations.update.input.parse(req.body);
      const rec = await storage.updateRecommendation(id, input);
      if (!rec) {
        return res.status(404).json({ message: "Recommendation not found" });
      }
      res.json(rec);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete(api.recommendations.delete.path, async (req, res) => {
    const id = parseNumericParam(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid recommendation id" });
    }
    const deleted = await storage.deleteRecommendation(id);
    if (!deleted) {
      return res.status(404).json({ message: "Recommendation not found" });
    }
    res.status(204).send();
  });

  app.get(api.recommendations.query.path, async (req, res) => {
    try {
      const query = api.recommendations.query.query.parse(req.query);
      const all = await storage.getRecommendations();
      const filtered = all.filter((rec) => {
        if (query.category && rec.category !== query.category) return false;
        if (query.status && rec.status !== query.status) return false;
        if (query.minImpact !== undefined && rec.impactScore < query.minImpact) return false;
        if (query.maxImpact !== undefined && rec.impactScore > query.maxImpact) return false;
        return true;
      });
      res.json(paginate(filtered, query.limit, query.offset));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.post(api.recommendations.generate.path, async (req, res) => {
    try {
      const events = await storage.getEvents(50);
      const feedback = await storage.getFeedback();
      const stats = {
        totalEvents: await storage.getEventsCount(),
        totalFeedback: await storage.getFeedbackCount(),
      };

      await storage.clearRecommendations();

      const generated = openai
        ? await generateRecommendationsWithRetries(openai, { events, feedback, stats })
        : {
            recommendations: [
              {
                title: "Simplify onboarding first-run flow",
                description: "Reduce first-session drop-offs by clarifying the first key action and shortening initial setup steps.",
                category: "retention" as const,
                effortScore: 6,
              },
              {
                title: "Improve pricing page clarity",
                description: "Address recurring pricing confusion with clearer plan comparison and stronger value messaging.",
                category: "revenue" as const,
                effortScore: 5,
              },
              {
                title: "Add contextual feature guidance",
                description: "Display in-app hints on complex screens to reduce confusion and improve completion rates.",
                category: "ux" as const,
                effortScore: 4,
              },
            ],
            modelUsed: "fallback",
            inputSnapshotHash: "local-fallback",
          };

      for (const rec of generated.recommendations) {
        const evidence = deriveCorrelationEvidence(
          { title: rec.title, description: rec.description, category: rec.category },
          { events, feedback },
        );
        const scored = scoreRecommendation(
          { title: rec.title, description: rec.description, category: rec.category, effortScore: rec.effortScore },
          { events, feedback },
          { evidence },
        );

        await storage.createRecommendation({
          title: rec.title || "New Insight",
          description: rec.description || "No description provided",
          category: rec.category || "ux",
          impactScore: scored.impactScore,
          severityScore: scored.severityScore,
          frequencyScore: scored.frequencyScore,
          affectedUsersPercent: scored.affectedUsersPercent,
          effortScore: scored.effortScore,
          confidenceScore: scored.confidenceScore,
          reasoningSummary: scored.reasoningSummary,
          supportingData: scored.supportingData,
          modelUsed: generated.modelUsed,
          inputSnapshotHash: generated.inputSnapshotHash,
          status: "new",
        });
      }

      res.json({ message: "Recommendations generated" });
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  app.get(api.recommendations.scoring.path, async (req, res) => {
    const id = parseNumericParam(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid recommendation id" });
    }

    const rec = await storage.getRecommendation(id);
    if (!rec) {
      return res.status(404).json({ message: "Recommendation not found" });
    }

    res.json({
      recommendation: rec,
      scoringDetails: {
        impactScore: rec.impactScore,
        severityScore: rec.severityScore || 0,
        frequencyScore: rec.frequencyScore || 0,
        affectedUsersPercent: rec.affectedUsersPercent || 0,
        effortScore: rec.effortScore || 0,
        confidenceScore: rec.confidenceScore || 0,
        reasoningSummary: rec.reasoningSummary || "",
        supportingData: rec.supportingData || {},
      },
    });
  });

  // Stats
  app.get(api.stats.get.path, async (req, res) => {
    const query = api.stats.get.query.parse(req.query);
    const windowMs: Record<"24h" | "7d" | "30d" | "all", number | null> = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      all: null,
    };

    const threshold = windowMs[query.window] ? Date.now() - windowMs[query.window]! : null;
    const allEvents = await storage.getEvents(5000);
    const allFeedback = await storage.getFeedback();

    const eventsInWindow = threshold
      ? allEvents.filter((e) => e.timestamp && new Date(e.timestamp).getTime() >= threshold)
      : allEvents;
    const feedbackInWindow = threshold
      ? allFeedback.filter((f) => f.timestamp && new Date(f.timestamp).getTime() >= threshold)
      : allFeedback;

    const totalEvents = eventsInWindow.length;
    const totalFeedback = feedbackInWindow.length;
    const activeUsers = new Set(eventsInWindow.map((e) => e.userId).filter(Boolean)).size;
    const recentActivity = eventsInWindow.slice(0, 10);

    res.json({
      totalEvents,
      totalFeedback,
      activeUsers,
      recentActivity,
    });
  });

  // Settings + profile
  app.get("/api/settings", async (_req, res) => {
    const workspaceId = await getWorkspaceId();
    if (workspaceId && appDb) {
      try {
        const [existing] = await appDb
          .select()
          .from(workspaceSettingsTable)
          .where(eq(workspaceSettingsTable.workspaceId, workspaceId))
          .limit(1);

        if (existing) {
          return res.json({
            id: existing.id,
            workspaceId,
            dataCollectionEnabled: existing.dataCollectionEnabled ?? true,
            aiAnalysisFrequency: (existing.aiAnalysisFrequency ?? "daily") as SettingsState["aiAnalysisFrequency"],
            retentionDays: existing.retentionDays ?? 90,
            privacyMode: existing.privacyMode ?? false,
            sampleRate: existing.sampleRate ?? 1,
          });
        }
      } catch (error) {
        hasExtendedDbTables = false;
      }
    }

    return res.json({ id: 1, workspaceId: 1, ...settingsState });
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const input = z
        .object({
          dataCollectionEnabled: z.boolean().optional(),
          aiAnalysisFrequency: z.enum(["realtime", "daily", "weekly"]).optional(),
          retentionDays: z.number().min(7).max(365).optional(),
          privacyMode: z.boolean().optional(),
          sampleRate: z.number().min(0).max(1).optional(),
        })
        .parse(req.body);

      settingsState = {
        dataCollectionEnabled: input.dataCollectionEnabled ?? settingsState.dataCollectionEnabled,
        aiAnalysisFrequency: input.aiAnalysisFrequency ?? settingsState.aiAnalysisFrequency,
        retentionDays: input.retentionDays ?? settingsState.retentionDays,
        privacyMode: input.privacyMode ?? settingsState.privacyMode,
        sampleRate: input.sampleRate ?? settingsState.sampleRate,
      };

      const workspaceId = await getWorkspaceId();
      if (workspaceId && appDb) {
        const [existing] = await appDb
          .select({ id: workspaceSettingsTable.id })
          .from(workspaceSettingsTable)
          .where(eq(workspaceSettingsTable.workspaceId, workspaceId))
          .limit(1);

        if (existing) {
          const [updated] = await appDb
            .update(workspaceSettingsTable)
            .set({
              dataCollectionEnabled: settingsState.dataCollectionEnabled,
              aiAnalysisFrequency: settingsState.aiAnalysisFrequency,
              retentionDays: settingsState.retentionDays,
              privacyMode: settingsState.privacyMode,
              sampleRate: settingsState.sampleRate,
              updatedAt: new Date(),
            })
            .where(eq(workspaceSettingsTable.id, existing.id))
            .returning();

          return res.json({
            id: updated.id,
            workspaceId,
            dataCollectionEnabled: updated.dataCollectionEnabled ?? true,
            aiAnalysisFrequency: (updated.aiAnalysisFrequency ?? "daily") as SettingsState["aiAnalysisFrequency"],
            retentionDays: updated.retentionDays ?? 90,
            privacyMode: updated.privacyMode ?? false,
            sampleRate: updated.sampleRate ?? 1,
          });
        }

        const [created] = await appDb
          .insert(workspaceSettingsTable)
          .values({
            workspaceId,
            dataCollectionEnabled: settingsState.dataCollectionEnabled,
            aiAnalysisFrequency: settingsState.aiAnalysisFrequency,
            retentionDays: settingsState.retentionDays,
            privacyMode: settingsState.privacyMode,
            sampleRate: settingsState.sampleRate,
          })
          .returning();

        return res.json({
          id: created.id,
          workspaceId,
          dataCollectionEnabled: created.dataCollectionEnabled ?? true,
          aiAnalysisFrequency: (created.aiAnalysisFrequency ?? "daily") as SettingsState["aiAnalysisFrequency"],
          retentionDays: created.retentionDays ?? 90,
          privacyMode: created.privacyMode ?? false,
          sampleRate: created.sampleRate ?? 1,
        });
      }

      return res.json({ id: 1, workspaceId: 1, ...settingsState });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.get("/api/profile", async (_req, res) => {
    res.json(profileState);
  });

  app.put("/api/profile", async (req, res) => {
    try {
      const input = z
        .object({
          firstName: z.string().min(1).optional(),
          lastName: z.string().min(1).optional(),
          email: z.string().email().optional(),
        })
        .parse(req.body);

      profileState = {
        ...profileState,
        firstName: input.firstName ?? profileState.firstName,
        lastName: input.lastName ?? profileState.lastName,
        email: input.email ?? profileState.email,
      };
      res.json(profileState);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.get("/api/api-keys", async (_req, res) => {
    const workspaceId = await getWorkspaceId();
    if (workspaceId && appDb) {
      try {
        const keys = await appDb
          .select({
            id: apiKeysTable.id,
            name: apiKeysTable.name,
            key: apiKeysTable.key,
            createdAt: apiKeysTable.createdAt,
            lastUsed: apiKeysTable.lastUsed,
          })
          .from(apiKeysTable)
          .where(and(eq(apiKeysTable.workspaceId, workspaceId), eq(apiKeysTable.isActive, true)))
          .orderBy(desc(apiKeysTable.createdAt));

        return res.json(
          keys.map((item) => ({
            id: item.id,
            name: item.name,
            key: item.key,
            createdAt: item.createdAt?.toISOString() ?? new Date().toISOString(),
            lastUsed: item.lastUsed ? item.lastUsed.toISOString() : null,
          })),
        );
      } catch {
        hasExtendedDbTables = false;
      }
    }

    return res.json(apiKeysState);
  });

  app.post("/api/api-keys", async (req, res) => {
    try {
      const input = z.object({ name: z.string().min(1) }).parse(req.body);
      const key = {
        id: Math.floor(Math.random() * 1_000_000_000),
        name: input.name,
        key: `pk_${Math.random().toString(36).slice(2, 18)}`,
        createdAt: new Date().toISOString(),
        lastUsed: null,
      };

      const workspaceId = await getWorkspaceId();
      if (workspaceId && appDb) {
        const [created] = await appDb
          .insert(apiKeysTable)
          .values({
            workspaceId,
            name: input.name,
            key: key.key,
            secret: `sk_${Math.random().toString(36).slice(2, 26)}`,
            isActive: true,
          })
          .returning();

        return res.status(201).json({
          id: created.id,
          name: created.name,
          key: created.key,
          createdAt: created.createdAt?.toISOString() ?? new Date().toISOString(),
          lastUsed: created.lastUsed ? created.lastUsed.toISOString() : null,
        });
      }

      apiKeysState = [key, ...apiKeysState];
      return res.status(201).json(key);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete("/api/api-keys/:id", async (req, res) => {
    const id = parseNumericParam(req.params.id);
    const workspaceId = await getWorkspaceId();

    if (workspaceId && appDb && !Number.isNaN(id)) {
      try {
        await appDb
          .update(apiKeysTable)
          .set({ isActive: false })
          .where(and(eq(apiKeysTable.id, id), eq(apiKeysTable.workspaceId, workspaceId)));
        return res.status(204).send();
      } catch {
        hasExtendedDbTables = false;
      }
    }

    apiKeysState = apiKeysState.filter((key) => String(key.id) !== String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id));
    return res.status(204).send();
  });

  // Alerts
  app.get("/api/alerts", async (_req, res) => {
    const workspaceId = await getWorkspaceId();
    if (workspaceId && appDb) {
      try {
        const dbAlerts = await appDb
          .select()
          .from(alertsTable)
          .where(eq(alertsTable.workspaceId, workspaceId))
          .orderBy(desc(alertsTable.createdAt));

        return res.json(
          dbAlerts.map((item) => ({
            id: item.id,
            name: item.name,
            condition: item.condition,
            threshold: item.threshold,
            metricType: item.metricType,
            enabled: item.enabled ?? true,
            channels: (item.channels as string[] | null) ?? [],
            createdAt: item.createdAt?.toISOString() ?? new Date().toISOString(),
            triggeredAt: item.triggeredAt ? item.triggeredAt.toISOString() : undefined,
            acknowledgedAt: item.acknowledgedAt ? item.acknowledgedAt.toISOString() : undefined,
          })),
        );
      } catch {
        hasExtendedDbTables = false;
      }
    }

    return res.json(alertsState);
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const input = z
        .object({
          name: z.string().min(1),
          condition: z.string().min(1),
          threshold: z.number(),
          metricType: z.string().min(1),
          channels: z.array(z.string()).optional(),
          webhookUrl: z.string().url().optional(),
        })
        .parse(req.body);

      const alert: AlertItem = {
        id: crypto.randomUUID(),
        name: input.name,
        condition: input.condition,
        threshold: input.threshold,
        metricType: input.metricType,
        channels: input.channels ?? [],
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      const workspaceId = await getWorkspaceId();
      if (workspaceId && appDb) {
        const [created] = await appDb
          .insert(alertsTable)
          .values({
            workspaceId,
            name: input.name,
            condition: input.condition,
            threshold: input.threshold,
            metricType: input.metricType,
            enabled: true,
            channels: input.channels ?? [],
            webhookUrl: input.webhookUrl,
          })
          .returning();

        return res.status(201).json({
          id: created.id,
          name: created.name,
          condition: created.condition,
          threshold: created.threshold,
          metricType: created.metricType,
          enabled: created.enabled ?? true,
          channels: (created.channels as string[] | null) ?? [],
          createdAt: created.createdAt?.toISOString() ?? new Date().toISOString(),
          triggeredAt: created.triggeredAt ? created.triggeredAt.toISOString() : undefined,
          acknowledgedAt: created.acknowledgedAt ? created.acknowledgedAt.toISOString() : undefined,
        });
      }

      alertsState = [alert, ...alertsState];
      return res.status(201).json(alert);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.put("/api/alerts/:id", async (req, res) => {
    try {
      const input = z
        .object({
          name: z.string().min(1).optional(),
          enabled: z.boolean().optional(),
        })
        .parse(req.body);

      const existing = alertsState.find((a) => a.id === req.params.id);
      const alertId = parseNumericParam(req.params.id);
      const workspaceId = await getWorkspaceId();
      if (workspaceId && appDb && !Number.isNaN(alertId)) {
        const [updatedDbAlert] = await appDb
          .update(alertsTable)
          .set({
            name: input.name,
            enabled: input.enabled,
          })
          .where(and(eq(alertsTable.id, alertId), eq(alertsTable.workspaceId, workspaceId)))
          .returning();

        if (!updatedDbAlert) {
          return res.status(404).json({ message: "Alert not found" });
        }

        return res.json({
          id: updatedDbAlert.id,
          name: updatedDbAlert.name,
          condition: updatedDbAlert.condition,
          threshold: updatedDbAlert.threshold,
          metricType: updatedDbAlert.metricType,
          enabled: updatedDbAlert.enabled ?? true,
          channels: (updatedDbAlert.channels as string[] | null) ?? [],
          createdAt: updatedDbAlert.createdAt?.toISOString() ?? new Date().toISOString(),
          acknowledgedAt: updatedDbAlert.acknowledgedAt ? updatedDbAlert.acknowledgedAt.toISOString() : undefined,
        });
      }

      if (!existing) {
        return res.status(404).json({ message: "Alert not found" });
      }

      const updated = { ...existing, ...input };
      alertsState = alertsState.map((a) => (a.id === req.params.id ? updated : a));
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete("/api/alerts/:id", async (req, res) => {
    const alertId = parseNumericParam(req.params.id);
    const workspaceId = await getWorkspaceId();
    if (workspaceId && appDb && !Number.isNaN(alertId)) {
      await appDb.delete(alertsTable).where(and(eq(alertsTable.id, alertId), eq(alertsTable.workspaceId, workspaceId)));
      return res.status(204).send();
    }

    alertsState = alertsState.filter((a) => String(a.id) !== String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id));
    return res.status(204).send();
  });

  app.post("/api/alerts/:id/acknowledge", async (req, res) => {
    const alertId = parseNumericParam(req.params.id);
    const workspaceId = await getWorkspaceId();
    if (workspaceId && appDb && !Number.isNaN(alertId)) {
      const [updatedDbAlert] = await appDb
        .update(alertsTable)
        .set({ acknowledgedAt: new Date(), acknowledgedBy: profileState.id })
        .where(and(eq(alertsTable.id, alertId), eq(alertsTable.workspaceId, workspaceId)))
        .returning();

      if (!updatedDbAlert) {
        return res.status(404).json({ message: "Alert not found" });
      }

      return res.json({
        id: updatedDbAlert.id,
        name: updatedDbAlert.name,
        condition: updatedDbAlert.condition,
        threshold: updatedDbAlert.threshold,
        metricType: updatedDbAlert.metricType,
        enabled: updatedDbAlert.enabled ?? true,
        channels: (updatedDbAlert.channels as string[] | null) ?? [],
        createdAt: updatedDbAlert.createdAt?.toISOString() ?? new Date().toISOString(),
        acknowledgedAt: updatedDbAlert.acknowledgedAt ? updatedDbAlert.acknowledgedAt.toISOString() : undefined,
      });
    }

    const existing = alertsState.find((a) => String(a.id) === String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id));
    if (!existing) {
      return res.status(404).json({ message: "Alert not found" });
    }
    const updated = { ...existing, acknowledgedAt: new Date().toISOString() };
    alertsState = alertsState.map((a) => (a.id === req.params.id ? updated : a));
    res.json(updated);
  });

  // Analytics
  app.get("/api/analytics/retention", async (_req, res) => {
    const allEvents = await storage.getEvents(5000);
    const dated = allEvents
      .filter((e) => e.userId && e.timestamp)
      .map((e) => ({
        userId: e.userId as string,
        ts: new Date(e.timestamp as Date),
      }));

    const firstSeen = new Map<string, Date>();
    for (const evt of dated) {
      if (!firstSeen.has(evt.userId) || evt.ts < (firstSeen.get(evt.userId) as Date)) {
        firstSeen.set(evt.userId, evt.ts);
      }
    }

    const checkpoints = [0, 1, 7, 30];
    const users = Array.from(firstSeen.keys());
    const retained = checkpoints.map((day) => {
      if (day === 0) return users.length;
      let count = 0;
      for (const userId of users) {
        const first = firstSeen.get(userId);
        if (!first) continue;
        const minTs = new Date(first.getTime() + day * 86400000);
        const maxTs = new Date(first.getTime() + (day + 1) * 86400000);
        const exists = dated.some((evt) => evt.userId === userId && evt.ts >= minTs && evt.ts < maxTs);
        if (exists) count++;
      }
      return count;
    });

    const base = users.length || 1;
    res.json({
      days: checkpoints.map((day, index) => ({
        day,
        retained: retained[index],
        percentage: Number(((retained[index] / base) * 100).toFixed(1)),
      })),
    });
  });

  app.get("/api/analytics/growth", async (_req, res) => {
    const allEvents = await storage.getEvents(5000);
    const now = Date.now();
    const currentWindowStart = now - 30 * 86400000;
    const previousWindowStart = now - 60 * 86400000;

    const eventsWithUser = allEvents.filter((e) => e.userId && e.timestamp);
    const usersByFirstSeen = new Map<string, number>();

    for (const evt of eventsWithUser) {
      const ts = new Date(evt.timestamp as Date).getTime();
      const userId = evt.userId as string;
      if (!usersByFirstSeen.has(userId) || ts < (usersByFirstSeen.get(userId) as number)) {
        usersByFirstSeen.set(userId, ts);
      }
    }

    const newUsers = Array.from(usersByFirstSeen.values()).filter((ts) => ts >= currentWindowStart).length;
    const previousNewUsers = Array.from(usersByFirstSeen.values()).filter((ts) => ts >= previousWindowStart && ts < currentWindowStart).length;
    const activeCurrent = new Set(
      eventsWithUser
        .filter((e) => new Date(e.timestamp as Date).getTime() >= currentWindowStart)
        .map((e) => e.userId as string),
    );
    const returningUsers = Array.from(activeCurrent).filter((userId) => (usersByFirstSeen.get(userId) as number) < currentWindowStart).length;
    const churnRate = activeCurrent.size === 0 ? 0 : Number((((activeCurrent.size - returningUsers) / activeCurrent.size) * 100).toFixed(1));
    const growthRate = previousNewUsers === 0 ? 100 : Number((((newUsers - previousNewUsers) / previousNewUsers) * 100).toFixed(1));

    res.json({
      newUsers,
      returningUsers,
      churnRate,
      growthRate,
    });
  });

  app.get("/api/analytics/funnels", async (_req, res) => {
    const allEvents = await storage.getEvents(5000);
    const byType = (type: string) => allEvents.filter((e) => e.type === type).length;
    const landing = byType("page_view");
    const signup = byType("signup");
    const onboarding = byType("feature_used");
    const activated = Math.max(onboarding - byType("error"), 0);

    res.json([
      { stage: "Landing", users: landing },
      { stage: "Signup", users: signup },
      { stage: "Onboarding", users: onboarding },
      { stage: "Activated", users: activated },
    ]);
  });

  app.get("/api/analytics/segments", async (_req, res) => {
    const allEvents = await storage.getEvents(5000);
    const byUser = new Map<string, number>();
    for (const evt of allEvents) {
      if (!evt.userId) continue;
      byUser.set(evt.userId, (byUser.get(evt.userId) ?? 0) + 1);
    }

    let powerUsers = 0;
    let regularUsers = 0;
    let atRisk = 0;

    for (const count of byUser.values()) {
      if (count >= 8) powerUsers++;
      else if (count >= 3) regularUsers++;
      else atRisk++;
    }

    res.json([
      { name: "Power Users", count: powerUsers },
      { name: "Regular Users", count: regularUsers },
      { name: "At-Risk", count: atRisk },
    ]);
  });

  app.get("/api/analytics/cohorts", async (_req, res) => {
    const allEvents = await storage.getEvents(5000);
    const userEvents = allEvents
      .filter((e) => e.userId && e.timestamp)
      .map((e) => ({ userId: e.userId as string, ts: new Date(e.timestamp as Date) }));

    const firstSeen = new Map<string, Date>();
    for (const evt of userEvents) {
      if (!firstSeen.has(evt.userId) || evt.ts < (firstSeen.get(evt.userId) as Date)) {
        firstSeen.set(evt.userId, evt.ts);
      }
    }

    const cohortUsers = new Map<string, Set<string>>();
    for (const [userId, date] of firstSeen.entries()) {
      const key = weekKey(date);
      if (!cohortUsers.has(key)) cohortUsers.set(key, new Set());
      (cohortUsers.get(key) as Set<string>).add(userId);
    }

    const rows = Array.from(cohortUsers.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .map(([cohort, users]) => {
        const userList = Array.from(users);
        const week0 = userList.length;
        const weekHits = [1, 2, 3].map((weeks) => {
          let retained = 0;
          for (const userId of userList) {
            const first = firstSeen.get(userId);
            if (!first) continue;
            const minTs = new Date(first.getTime() + weeks * 7 * 86400000);
            const maxTs = new Date(first.getTime() + (weeks + 1) * 7 * 86400000);
            const active = userEvents.some((e) => e.userId === userId && e.ts >= minTs && e.ts < maxTs);
            if (active) retained++;
          }
          return retained;
        });

        return {
          cohort,
          week0,
          week1: weekHits[0],
          week2: weekHits[1],
          week3: weekHits[2],
        };
      });

    res.json(rows);
  });

  app.get("/api/analytics/experiments", async (_req, res) => {
    res.json([]);
  });

  // Initial seeding
  await seedDatabase();

  return httpServer;
}

// Seed function
async function seedDatabase() {
  const count = await storage.getEventsCount();
  if (count === 0) {
    console.log("Seeding database...");
    
    const usersToCreate: UpsertUser[] = [
      { id: "user_1", email: "user1@example.com", firstName: "Alice", lastName: "Product" },
      { id: "user_2", email: "user2@example.com", firstName: "Bob", lastName: "Developer" },
    ];
    
    for (const u of usersToCreate) {
      await storage.createUser(u);
    }

    const sampleEvents: InsertEvent[] = [
      { type: "page_view", url: "/", userId: "user_1" },
      { type: "click", url: "/pricing", userId: "user_1" },
      { type: "signup", url: "/signup", userId: "user_2" },
      { type: "page_view", url: "/dashboard", userId: "user_2" },
      { type: "feature_used", payload: { feature: "export" }, userId: "user_2" },
    ];
    for (const e of sampleEvents) await storage.createEvent(e);

    const sampleFeedback: Array<InsertFeedback & { sentiment?: "positive" | "negative" | "neutral" }> = [
      { userId: "user_2", content: "I love the new export feature!", source: "web", sentiment: "positive" },
      { userId: "user_1", content: "Pricing page is confusing.", source: "email", sentiment: "negative" },
    ];
    for (const f of sampleFeedback) await storage.createFeedback(f);
  }
}

import type { Express } from "express";
import { z } from "zod";
import { createStorage } from "./storage";

// Settings routes
export function registerSettingsRoutes(app: Express, storage: any) {
  // Get workspace settings
  app.get("/api/settings", async (req, res) => {
    try {
      const userId = (req as any).user?.id || "demo_user";
      // For now, return default settings for demo
      const settings = {
        id: 1,
        workspaceId: 1,
        dataCollectionEnabled: true,
        aiAnalysisFrequency: "daily",
        retentionDays: 90,
        privacyMode: false,
        sampleRate: 1.0,
      };
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update workspace settings
  app.put("/api/settings", async (req, res) => {
    try {
      const updateSchema = z.object({
        dataCollectionEnabled: z.boolean().optional(),
        aiAnalysisFrequency: z
          .enum(["realtime", "daily", "weekly"])
          .optional(),
        retentionDays: z.number().min(7).max(365).optional(),
        privacyMode: z.boolean().optional(),
        sampleRate: z.number().min(0).max(1).optional(),
      });

      const input = updateSchema.parse(req.body);
      const userId = (req as any).user?.id || "demo_user";

      // Save settings (implementation depends on storage layer)
      const updated = {
        id: 1,
        workspaceId: 1,
        dataCollectionEnabled:
          input.dataCollectionEnabled ?? true,
        aiAnalysisFrequency: input.aiAnalysisFrequency ?? "daily",
        retentionDays: input.retentionDays ?? 90,
        privacyMode: input.privacyMode ?? false,
        sampleRate: input.sampleRate ?? 1.0,
      };

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get user profile
  app.get("/api/profile", async (req, res) => {
    try {
      const user = (req as any).user || {
        id: "demo_user",
        email: "demo@pm-ai.local",
        firstName: "Demo",
        lastName: "User",
        profileImageUrl: "",
      };
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update user profile
  app.put("/api/profile", async (req, res) => {
    try {
      const profileSchema = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional(),
      });

      const input = profileSchema.parse(req.body);

      const updated = {
        id: (req as any).user?.id || "demo_user",
        email: input.email || "demo@pm-ai.local",
        firstName: input.firstName || "Demo",
        lastName: input.lastName || "User",
        profileImageUrl: "",
      };

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Generate API key
  app.post("/api/api-keys", async (req, res) => {
    try {
      const keySchema = z.object({
        name: z.string().min(1),
      });

      const input = keySchema.parse(req.body);

      const key = `pk_${Math.random().toString(36).substr(2, 32)}`;
      const secret = `sk_${Math.random().toString(36).substr(2, 48)}`;

      res.status(201).json({
        id: Math.random(),
        name: input.name,
        key,
        secret,
        createdAt: new Date().toISOString(),
        lastUsed: null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Failed to generate API key" });
    }
  });

  // List API keys
  app.get("/api/api-keys", async (req, res) => {
    try {
      res.json([
        {
          id: 1,
          name: "Development Key",
          key: "pk_test_...",
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  // Delete API key
  app.delete("/api/api-keys/:id", async (req, res) => {
    try {
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete API key" });
    }
  });
}

// Alert routes
export function registerAlertRoutes(app: Express, storage: any) {
  // Get alerts
  app.get("/api/alerts", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Create alert
  app.post("/api/alerts", async (req, res) => {
    try {
      const alertSchema = z.object({
        name: z.string().min(1),
        condition: z.string().min(1),
        threshold: z.number(),
        metricType: z.string(),
        channels: z.array(z.string()).optional(),
        webhookUrl: z.string().url().optional(),
      });

      const input = alertSchema.parse(req.body);

      res.status(201).json({
        id: Math.random(),
        ...input,
        enabled: true,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  // Update alert
  app.put("/api/alerts/:id", async (req, res) => {
    try {
      const alertSchema = z.object({
        name: z.string().min(1).optional(),
        enabled: z.boolean().optional(),
      });

      const input = alertSchema.parse(req.body);

      res.json({
        id: req.params.id,
        ...input,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Failed to update alert" });
    }
  });

  // Delete alert
  app.delete("/api/alerts/:id", async (req, res) => {
    try {
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete alert" });
    }
  });

  // Acknowledge alert
  app.post("/api/alerts/:id/acknowledge", async (req, res) => {
    try {
      res.json({
        id: req.params.id,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: "user",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  });
}

// Analytics routes
export function registerAnalyticsRoutes(app: Express, storage: any) {
  // Get funnel data
  app.get("/api/analytics/funnels", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch funnels" });
    }
  });

  // Get segment data
  app.get("/api/analytics/segments", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch segments" });
    }
  });

  // Get cohort analysis
  app.get("/api/analytics/cohorts", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cohorts" });
    }
  });

  // Get experiment data
  app.get("/api/analytics/experiments", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch experiments" });
    }
  });

  // Get retention analysis
  app.get("/api/analytics/retention", async (req, res) => {
    try {
      res.json({
        days: [
          { day: 0, retained: 100, percentage: 100 },
          { day: 1, retained: 85, percentage: 85 },
          { day: 7, retained: 45, percentage: 45 },
          { day: 30, retained: 20, percentage: 20 },
        ],
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch retention data" });
    }
  });

  // Get growth metrics
  app.get("/api/analytics/growth", async (req, res) => {
    try {
      res.json({
        newUsers: 150,
        returningUsers: 850,
        churnRate: 15.5,
        growthRate: 8.2,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch growth metrics" });
    }
  });
}

// Batch event ingestion for SDK
export function registerBatchRoutes(app: Express, storage: any) {
  app.post("/api/events/batch", async (req, res) => {
    try {
      const batchSchema = z.object({
        events: z.array(z.object({
          type: z.string(),
          payload: z.record(z.any()).optional(),
          userId: z.string().optional(),
          sessionId: z.string().optional(),
          url: z.string().optional(),
          timestamp: z.string().optional(),
        })),
      });

      const input = batchSchema.parse(req.body);

      // Process events
      for (const event of input.events) {
        await storage.createEvent({
          type: event.type,
          payload: event.payload || {},
          userId: event.userId,
          sessionId: event.sessionId,
          url: event.url,
        });
      }

      res.json({
        success: true,
        eventsProcessed: input.events.length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
          field: error.errors[0].path.join("."),
        });
      }
      res.status(500).json({ message: "Failed to process batch events" });
    }
  });
}

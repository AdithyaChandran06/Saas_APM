import { z } from 'zod';
import { insertEventSchema, insertFeedbackSchema, insertRecommendationSchema, events, feedback, recommendations } from './schema';

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const eventQuerySchema = paginationSchema.extend({
  type: z.string().optional(),
  userId: z.string().optional(),
  urlContains: z.string().optional(),
}).merge(dateRangeSchema);

export const feedbackQuerySchema = paginationSchema.extend({
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  source: z.string().optional(),
  userId: z.string().optional(),
  query: z.string().optional(),
}).merge(dateRangeSchema);

const paginatedMetaSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  hasMore: z.boolean(),
});

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  events: {
    create: {
      method: 'POST' as const,
      path: '/api/events',
      input: insertEventSchema,
      responses: {
        201: z.custom<typeof events.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: { // For debugging/admin
      method: 'GET' as const,
      path: '/api/events',
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
    query: {
      method: "GET" as const,
      path: "/api/events/query",
      query: eventQuerySchema,
      responses: {
        200: z.object({
          items: z.array(z.custom<typeof events.$inferSelect>()),
          pagination: paginatedMetaSchema,
        }),
      },
    },
  },
  feedback: {
    create: {
      method: 'POST' as const,
      path: '/api/feedback',
      input: insertFeedbackSchema,
      responses: {
        201: z.custom<typeof feedback.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/feedback',
      responses: {
        200: z.array(z.custom<typeof feedback.$inferSelect>()),
      },
    },
    query: {
      method: "GET" as const,
      path: "/api/feedback/query",
      query: feedbackQuerySchema,
      responses: {
        200: z.object({
          items: z.array(z.custom<typeof feedback.$inferSelect>()),
          pagination: paginatedMetaSchema,
        }),
      },
    },
  },
  recommendations: {
    create: {
      method: 'POST' as const,
      path: '/api/recommendations',
      input: insertRecommendationSchema,
      responses: {
        201: z.custom<typeof recommendations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/recommendations',
      responses: {
        200: z.array(z.custom<typeof recommendations.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/recommendations/:id',
      responses: {
        200: z.custom<typeof recommendations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/recommendations/:id',
      input: insertRecommendationSchema.partial(),
      responses: {
        200: z.custom<typeof recommendations.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/recommendations/:id',
      responses: {
        204: z.undefined(),
        404: errorSchemas.notFound,
      },
    },
    query: {
      method: 'GET' as const,
      path: '/api/recommendations/query',
      query: paginationSchema.extend({
        category: z.enum(['revenue', 'retention', 'ux']).optional(),
        status: z.enum(['new', 'reviewed', 'implemented', 'dismissed']).optional(),
        minImpact: z.coerce.number().optional(),
        maxImpact: z.coerce.number().optional(),
      }),
      responses: {
        200: z.object({
          items: z.array(z.custom<typeof recommendations.$inferSelect>()),
          pagination: paginatedMetaSchema,
        }),
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/recommendations/generate',
      responses: {
        200: z.object({ message: z.string() }),
        500: errorSchemas.internal,
      },
    },
    scoring: {
      method: 'GET' as const,
      path: '/api/recommendations/:id/scoring',
      responses: {
        200: z.object({
          recommendation: z.custom<typeof recommendations.$inferSelect>(),
          scoringDetails: z.object({
            impactScore: z.number(),
            severityScore: z.number(),
            frequencyScore: z.number(),
            affectedUsersPercent: z.number(),
            effortScore: z.number(),
            confidenceScore: z.number(),
            reasoningSummary: z.string(),
            supportingData: z.record(z.any()),
          }),
        }),
        404: errorSchemas.notFound,
      },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      query: z.object({
        window: z.enum(["24h", "7d", "30d", "all"]).default("all"),
      }),
      responses: {
        200: z.object({
          totalEvents: z.number(),
          totalFeedback: z.number(),
          activeUsers: z.number(),
          recentActivity: z.array(z.custom<typeof events.$inferSelect>()),
        }),
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE EXPORTS
// ============================================
export type CreateEventInput = z.infer<typeof api.events.create.input>;
export type CreateFeedbackInput = z.infer<typeof api.feedback.create.input>;
export type StatsResponse = z.infer<typeof api.stats.get.responses[200]>;

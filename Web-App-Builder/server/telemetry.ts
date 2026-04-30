type ErrorSample = {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  message?: string;
  context?: Record<string, unknown>;
};

type PathTelemetry = {
  totalCount: number;
  errorCount: number;
  durationsMs: number[];
};

import { desc, count, sql } from "drizzle-orm";
import { db, hasDatabase } from "./db";
import { errorEvents, performanceMetrics } from "@shared/schema-extended";

const pathTelemetry = new Map<string, PathTelemetry>();
const recentErrors: ErrorSample[] = [];
const MAX_DURATION_SAMPLES = 1000;
const MAX_ERROR_SAMPLES = 200;

function getPathKey(method: string, path: string) {
  return `${method.toUpperCase()} ${path}`;
}

function getOrCreatePathTelemetry(method: string, path: string) {
  const key = getPathKey(method, path);
  const existing = pathTelemetry.get(key);
  if (existing) return existing;

  const created: PathTelemetry = {
    totalCount: 0,
    errorCount: 0,
    durationsMs: [],
  };
  pathTelemetry.set(key, created);
  return created;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

export function recordApiRequest(input: {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
}) {
  const entry = getOrCreatePathTelemetry(input.method, input.path);
  entry.totalCount += 1;
  if (input.statusCode >= 500) {
    entry.errorCount += 1;
    recentErrors.unshift({
      timestamp: new Date().toISOString(),
      method: input.method,
      path: input.path,
      statusCode: input.statusCode,
      durationMs: input.durationMs,
    });
    if (recentErrors.length > MAX_ERROR_SAMPLES) {
      recentErrors.splice(MAX_ERROR_SAMPLES);
    }
  }

  entry.durationsMs.push(input.durationMs);
  if (entry.durationsMs.length > MAX_DURATION_SAMPLES) {
    entry.durationsMs.shift();
  }

  if (hasDatabase && db) {
    void db.insert(performanceMetrics).values({
      method: input.method,
      path: input.path,
      statusCode: input.statusCode,
      durationMs: Math.round(input.durationMs),
    }).catch((err) => {
      console.warn("Failed to persist performance metric", err);
    });

    if (input.statusCode >= 500) {
      void db.insert(errorEvents).values({
        method: input.method,
        path: input.path,
        statusCode: input.statusCode,
        durationMs: Math.round(input.durationMs),
      }).catch((err) => {
        console.warn("Failed to persist error event", err);
      });
    }
  }
}

export function recordClientError(input: {
  path?: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}) {
  recentErrors.unshift({
    timestamp: new Date().toISOString(),
    method: "CLIENT",
    path: input.path ?? "client",
    statusCode: 0,
    durationMs: 0,
    message: input.message,
    context: {
      ...(input.context ?? {}),
      stack: input.stack,
    },
  });

  if (recentErrors.length > MAX_ERROR_SAMPLES) {
    recentErrors.splice(MAX_ERROR_SAMPLES);
  }

  if (hasDatabase && db) {
    void db.insert(errorEvents).values({
      method: "CLIENT",
      path: input.path ?? "client",
      statusCode: 0,
      durationMs: 0,
      message: input.message,
      context: {
        ...(input.context ?? {}),
        stack: input.stack,
      },
    }).catch((err) => {
      console.warn("Failed to persist client error", err);
    });
  }
}

async function getErrorTelemetryFromDatabase() {
  const [{ count: totalRequests }] = await db!.select({ count: count() }).from(performanceMetrics);
  const [{ count: totalErrors }] = await db!
    .select({ count: count() })
    .from(performanceMetrics)
    .where(sql`${performanceMetrics.statusCode} >= 500`);
  const recent = await db!
    .select()
    .from(errorEvents)
    .orderBy(desc(errorEvents.timestamp))
    .limit(MAX_ERROR_SAMPLES);

  return {
    totalRequests,
    totalErrors,
    errorRatePercent: totalRequests === 0 ? 0 : Number(((totalErrors / totalRequests) * 100).toFixed(2)),
    recentErrors: recent,
  };
}

export async function getErrorTelemetry() {
  if (hasDatabase && db) {
    try {
      return await getErrorTelemetryFromDatabase();
    } catch (err) {
      console.warn("Falling back to in-memory error telemetry", err);
    }
  }

  const totals = Array.from(pathTelemetry.values()).reduce(
    (acc, item) => {
      acc.total += item.totalCount;
      acc.errors += item.errorCount;
      acc.totalDuration += item.durationsMs.reduce((a, b) => a + b, 0);
      return acc;
    },
    { total: 0, errors: 0, totalDuration: 0 },
  );

  // Calculate top paths by error count
  const topPaths = Array.from(pathTelemetry.entries())
    .map(([path, item]) => ({
      path,
      count: item.errorCount,
      avgDuration: item.durationsMs.length > 0 ? item.durationsMs.reduce((a, b) => a + b, 0) / item.durationsMs.length : 0,
    }))
    .filter(p => p.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Generate error trend (simplified - 24 hourly buckets)
  const now = new Date();
  const errorTrend = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
    errorTrend.push({
      time: `${hour.getHours()}:00`,
      count: Math.floor(recentErrors.filter(e => {
        const eTime = new Date(e.timestamp);
        return eTime.getHours() === hour.getHours();
      }).length),
    });
  }

  return {
    totalErrors: totals.errors,
    errorRate: totals.total === 0 ? 0 : Number(((totals.errors / totals.total) * 100).toFixed(2)),
    avgDurationMs: totals.total === 0 ? 0 : totals.totalDuration / totals.total,
    topPaths,
    recentErrors: recentErrors.map(e => ({
      ...e,
      id: Math.random(),
    })),
    errorTrend,
  };
}

function aggregatePerformanceTelemetry(rows: Array<{ method: string; path: string; statusCode: number; durationMs: number }>) {
  const grouped = new Map<string, PathTelemetry>();

  for (const row of rows) {
    const key = `${row.method.toUpperCase()} ${row.path}`;
    const existing = grouped.get(key) ?? { totalCount: 0, errorCount: 0, durationsMs: [] };
    existing.totalCount += 1;
    if (row.statusCode >= 500) {
      existing.errorCount += 1;
    }
    existing.durationsMs.push(row.durationMs);
    grouped.set(key, existing);
  }

  return Array.from(grouped.entries())
    .map(([pathKey, item]) => {
      const p50 = percentile(item.durationsMs, 50);
      const p95 = percentile(item.durationsMs, 95);
      const p99 = percentile(item.durationsMs, 99);

      return {
        path: pathKey,
        requestCount: item.totalCount,
        errorCount: item.errorCount,
        errorRatePercent: item.totalCount === 0 ? 0 : Number(((item.errorCount / item.totalCount) * 100).toFixed(2)),
        p50Ms: Number(p50.toFixed(2)),
        p95Ms: Number(p95.toFixed(2)),
        p99Ms: Number(p99.toFixed(2)),
      };
    })
    .sort((a, b) => b.requestCount - a.requestCount);
}

export async function getPerformanceTelemetry() {
  if (hasDatabase && db) {
    try {
      const rows = await db
        .select({
          method: performanceMetrics.method,
          path: performanceMetrics.path,
          statusCode: performanceMetrics.statusCode,
          durationMs: performanceMetrics.durationMs,
        })
        .from(performanceMetrics)
        .orderBy(desc(performanceMetrics.timestamp))
        .limit(5000);

      return aggregatePerformanceTelemetry(rows);
    } catch (err) {
      console.warn("Falling back to in-memory performance telemetry", err);
    }
  }

  return aggregatePerformanceTelemetry(
    Array.from(pathTelemetry.entries()).flatMap(([pathKey, item]) =>
      item.durationsMs.map((durationMs) => ({
        method: pathKey.split(" ")[0] ?? "GET",
        path: pathKey.split(" ").slice(1).join(" ") || pathKey,
        statusCode: item.errorCount > 0 ? 500 : 200,
        durationMs,
      })),
    ),
  );
}

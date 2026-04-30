/**
 * Alert Evaluation Service
 * Periodically evaluates alert conditions against metrics and triggers notifications
 */

import type { Drizzle } from "drizzle-orm";
import { and, eq, gte, desc, sql } from "drizzle-orm";
import type { Alert } from "@shared/schema-extended";
import { alerts as alertsTable, performanceMetrics, errorEvents } from "@shared/schema-extended";

export type AlertConditionType = "error_rate" | "latency_p95" | "latency_p99" | "error_count" | "status_5xx";

interface AlertEvaluationContext {
  workspaceId: number;
  metrics: {
    errorRate: number;
    latencyP95: number;
    latencyP99: number;
    errorCount: number;
    status5xxCount: number;
  };
}

/**
 * Evaluate if an alert condition is triggered
 */
function isAlertTriggered(
  condition: string,
  threshold: number,
  metricType: AlertConditionType,
  metrics: AlertEvaluationContext["metrics"],
): boolean {
  const metric =
    metricType === "error_rate"
      ? metrics.errorRate
      : metricType === "latency_p95"
        ? metrics.latencyP95
        : metricType === "latency_p99"
          ? metrics.latencyP99
          : metricType === "error_count"
            ? metrics.errorCount
            : metrics.status5xxCount;

  // Condition operators: "greater_than", "less_than", "equals"
  if (condition === "greater_than") {
    return metric > threshold;
  }
  if (condition === "less_than") {
    return metric < threshold;
  }
  if (condition === "equals") {
    return Math.abs(metric - threshold) < 0.01;
  }

  return false;
}

/**
 * Gather metrics for alert evaluation from telemetry
 */
async function gatherMetrics(
  db: Drizzle<any>,
  workspaceId: number,
): Promise<AlertEvaluationContext["metrics"]> {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const [perfData, errorData] = await Promise.all([
    db
      .select({
        totalCount: sql`COUNT(*)`,
        errorCount: sql`COUNT(CASE WHEN status_code >= 500 THEN 1 END)`,
        avgDuration: sql`AVG(duration_ms)`,
        p95Duration: sql`PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)`,
        p99Duration: sql`PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms)`,
      })
      .from(performanceMetrics)
      .where(gte(performanceMetrics.timestamp, fiveMinutesAgo)),
    db
      .select({ count: sql`COUNT(*)` })
      .from(errorEvents)
      .where(gte(errorEvents.timestamp, fiveMinutesAgo)),
  ]);

  const perfMetrics = perfData[0];
  const errorCount = Number(errorData[0]?.count ?? 0);
  const totalCount = Number(perfMetrics?.totalCount ?? 1);
  const errorRateValue = Number(perfMetrics?.errorCount ?? 0);

  return {
    errorRate: (errorRateValue / totalCount) * 100, // percentage
    latencyP95: Number(perfMetrics?.p95Duration ?? 0),
    latencyP99: Number(perfMetrics?.p99Duration ?? 0),
    errorCount,
    status5xxCount: errorRateValue,
  };
}

/**
 * Evaluate all alerts for a workspace and trigger notifications
 */
export async function evaluateAlertsForWorkspace(
  db: Drizzle<any>,
  workspaceId: number,
): Promise<void> {
  try {
    // Get all enabled alerts for workspace
    const alerts = await db
      .select()
      .from(alertsTable)
      .where(and(eq(alertsTable.workspaceId, workspaceId), eq(alertsTable.enabled, true)));

    if (alerts.length === 0) return;

    // Gather metrics
    const metrics = await gatherMetrics(db, workspaceId);

    // Evaluate each alert
    for (const alert of alerts) {
      const isTriggered = isAlertTriggered(
        alert.condition || "greater_than",
        alert.threshold || 0,
        (alert.metricType as AlertConditionType) || "error_rate",
        metrics,
      );

      if (isTriggered) {
        // Update alert as triggered
        await db
          .update(alertsTable)
          .set({
            triggeredAt: new Date(),
          })
          .where(eq(alertsTable.id, alert.id))
          .catch((err) => {
            console.warn(`Failed to update alert ${alert.id}:`, err);
          });

        // TODO: Send notifications via channels (email, Slack, webhook)
        // For now, just log it
        console.log(`[ALERT TRIGGERED] ${alert.name}: ${alert.metricType} = ${
          alert.metricType === "error_rate"
            ? metrics.errorRate.toFixed(2) + "%"
            : alert.metricType === "error_count"
              ? metrics.errorCount
              : metrics.latencyP95.toFixed(0) + "ms"
        } (threshold: ${alert.threshold})`);
      }
    }
  } catch (error) {
    console.error(`Failed to evaluate alerts for workspace ${workspaceId}:`, error);
  }
}

/**
 * Start the alert evaluation loop (runs every minute)
 */
export function startAlertEvaluationLoop(db: Drizzle<any> | null, workspaceIds: number[] | (() => Promise<number[]>)): NodeJS.Timer | null {
  if (!db) return null;

  return setInterval(async () => {
    try {
      let workspaces: number[];

      if (typeof workspaceIds === "function") {
        workspaces = await workspaceIds();
      } else {
        workspaces = workspaceIds;
      }

      // Evaluate alerts for each workspace
      for (const workspaceId of workspaces) {
        await evaluateAlertsForWorkspace(db, workspaceId);
      }
    } catch (error) {
      console.error("Alert evaluation loop error:", error);
    }
  }, 60 * 1000); // Every minute
}

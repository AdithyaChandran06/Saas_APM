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
}

export function getErrorTelemetry() {
  const totals = Array.from(pathTelemetry.values()).reduce(
    (acc, item) => {
      acc.total += item.totalCount;
      acc.errors += item.errorCount;
      return acc;
    },
    { total: 0, errors: 0 },
  );

  return {
    totalRequests: totals.total,
    totalErrors: totals.errors,
    errorRatePercent: totals.total === 0 ? 0 : Number(((totals.errors / totals.total) * 100).toFixed(2)),
    recentErrors,
  };
}

export function getPerformanceTelemetry() {
  const rows = Array.from(pathTelemetry.entries()).map(([pathKey, item]) => {
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
  });

  return rows.sort((a, b) => b.requestCount - a.requestCount);
}

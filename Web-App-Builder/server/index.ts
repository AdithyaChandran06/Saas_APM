import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { workspaceRouter } from "./workspace";
import { serveStatic } from "./static";
import { createServer } from "http";
import { validateRuntimeEnv } from "./env";
import { recordApiRequest } from "./telemetry";
import { startAlertEvaluationLoop } from "./services/alert-evaluator";
import { db, pool } from "./db";
import { workspaces } from "@shared/schema-extended";

const app = express();
const httpServer = createServer(app);
const runtimeEnv = validateRuntimeEnv();
const PgSessionStore = connectPgSimple(session);
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

if (runtimeEnv.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (runtimeEnv.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

function rateLimit(options: { windowMs: number; max: number; scope: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const forwardedFor = req.headers["x-forwarded-for"];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0]?.trim() || req.ip;
    const key = `${options.scope}:${ip}`;
    const now = Date.now();
    const bucket = rateLimitBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000).toString());
      return res.status(429).json({ message: "Too many requests. Please try again shortly." });
    }

    return next();
  };
}

app.use(applySecurityHeaders);
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 60, scope: "auth" }));
app.use("/api/events", rateLimit({ windowMs: 60 * 1000, max: 600, scope: "events" }));
app.use("/api/feedback", rateLimit({ windowMs: 60 * 1000, max: 120, scope: "feedback" }));
app.use("/api/recommendations/generate", rateLimit({ windowMs: 60 * 60 * 1000, max: 20, scope: "ai" }));

app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Session middleware
app.use(
  session({
    store:
      runtimeEnv.NODE_ENV === "production" && pool
        ? new PgSessionStore({
            pool,
            createTableIfMissing: false,
            tableName: "sessions",
          })
        : undefined,
    secret: runtimeEnv.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // "auto" keeps secure cookies on HTTPS while allowing localhost HTTP in Docker/dev.
      secure: runtimeEnv.NODE_ENV === "production" ? "auto" : false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  }),
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      recordApiRequest({
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs: duration,
      });

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  app.use("/api/workspaces", workspaceRouter);
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Start alert evaluation loop if database is available
  const activeDb = db;
  if (activeDb) {
    // Get all active workspace IDs for alert evaluation
    const getWorkspaceIds = async () => {
      try {
        const allWorkspaces = await activeDb.select({ id: workspaces.id }).from(workspaces).limit(1000);
        return allWorkspaces.map(w => w.id);
      } catch {
        return [];
      }
    };
    
    startAlertEvaluationLoop(activeDb, getWorkspaceIds);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();

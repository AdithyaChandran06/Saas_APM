export interface APMConfig {
  apiKey: string;
  endpoint?: string;
  userId?: string;
  sessionId?: string;
  sampleRate?: number;
  enableAutoPageTracking?: boolean;
  enableAutoErrorTracking?: boolean;
  enableAutoPerformanceTracking?: boolean;
  debug?: boolean;
}

export interface EventPayload {
  [key: string]: unknown;
}

export interface PerformanceMetrics {
  navigationTiming?: PerformanceNavigationTiming;
  resourceTimings?: PerformanceResourceTiming[];
  paintEntries?: PerformancePaintTiming[];
}

export class APMClient {
  private apiKey: string;
  private endpoint: string;
  private userId: string;
  private sessionId: string;
  private sampleRate: number;
  private debug: boolean;
  private queue: Array<Record<string, unknown>> = [];
  private isProcessing = false;

  constructor(config: APMConfig) {
    if (!config.apiKey) {
      throw new Error("APM API key is required");
    }

    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint ?? "http://localhost:5000";
    this.userId = config.userId ?? this.generateUserId();
    this.sessionId = config.sessionId ?? this.generateSessionId();
    this.sampleRate = config.sampleRate ?? 1;
    this.debug = config.debug ?? false;

    if (config.enableAutoPageTracking ?? true) this.setupPageTracking();
    if (config.enableAutoErrorTracking ?? true) this.setupErrorTracking();
    if (config.enableAutoPerformanceTracking ?? true) this.setupPerformanceTracking();

    setInterval(() => {
      void this.flush();
    }, 30_000);

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        void this.flush();
      });
    }
  }

  public trackEvent(type: string, payload: EventPayload = {}, userId?: string): void {
    if (!this.shouldSample()) return;

    const event = {
      type,
      payload,
      userId: userId ?? this.userId,
      sessionId: this.sessionId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      timestamp: new Date().toISOString(),
    };

    this.queue.push(event);

    if (this.debug) {
      console.log("[APM SDK] event queued", event);
    }

    if (this.queue.length >= 50) {
      void this.flush();
    }
  }

  public trackError(error: Error | string, context?: EventPayload): void {
    const errorEvent = {
      type: "error",
      payload: {
        message: typeof error === "string" ? error : error.message,
        stack: typeof error === "string" ? undefined : error.stack,
        ...(context ?? {}),
      },
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    };

    this.queue.push(errorEvent);
    void this.flush();
  }

  public trackInteraction(action: string, target: string, payload?: EventPayload): void {
    this.trackEvent("user_interaction", {
      action,
      target,
      ...(payload ?? {}),
    });
  }

  public trackPerformance(metrics: PerformanceMetrics): void {
    this.trackEvent("performance", {
      metrics,
      timestamp: new Date().toISOString(),
    });
  }

  public setUser(userId: string, metadata?: EventPayload): void {
    this.userId = userId;
    this.trackEvent("user_set", { userId, metadata });
  }

  public async flush(): Promise<void> {
    if (this.queue.length === 0 || this.isProcessing) return;

    this.isProcessing = true;
    const events = this.queue.splice(0, 100);

    try {
      const response = await fetch(`${this.endpoint}/api/events/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send events: ${response.status}`);
      }
    } catch (error) {
      this.queue.unshift(...events);
      if (this.debug) {
        console.error("[APM SDK] flush failed", error);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private shouldSample(): boolean {
    return Math.random() <= this.sampleRate;
  }

  private generateUserId(): string {
    if (typeof window !== "undefined") {
      let userId = localStorage.getItem("apm_user_id");
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem("apm_user_id", userId);
      }
      return userId;
    }

    return `user_${Date.now()}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private setupPageTracking(): void {
    if (typeof window === "undefined") return;

    const trackPageView = () => {
      this.trackEvent("page_view", {
        page: window.location.pathname,
        referrer: document.referrer,
      });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", trackPageView);
    } else {
      trackPageView();
    }

    let lastUrl = window.location.href;
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        trackPageView();
      }
    });

    observer.observe(document, { subtree: true, childList: true });
  }

  private setupErrorTracking(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("error", (event) => {
      this.trackError(event.error ?? event.message, {
        type: "uncaught_error",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.trackError(String(event.reason), {
        type: "unhandled_promise_rejection",
      });
    });
  }

  private setupPerformanceTracking(): void {
    if (typeof window === "undefined" || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            this.trackEvent("long_task", {
              duration: entry.duration,
              name: entry.name,
            });
          }
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      // Not all browsers support long task telemetry.
    }
  }
}

export function createAPMClient(config: APMConfig): APMClient {
  return new APMClient(config);
}

/**
 * Data Ingestion SDK for APM
 * Include this in your application to automatically track events and send them to the APM platform
 *
 * Usage:
 * import { APMClient } from '@your-domain/apm-sdk';
 *
 * const apm = new APMClient({
 *   apiKey: 'your-api-key',
 *   endpoint: 'https://apm.example.com',
 * });
 *
 * apm.trackEvent('page_view', { page: '/dashboard' });
 * apm.trackError(error);
 */

interface APMConfig {
  apiKey: string;
  endpoint?: string;
  userId?: string;
  sessionId?: string;
  sampleRate?: number; // 0.0 to 1.0
  enableAutoPageTracking?: boolean;
  enableAutoErrorTracking?: boolean;
  enableAutoPerformanceTracking?: boolean;
  debug?: boolean;
}

interface EventPayload {
  [key: string]: any;
}

interface PerformanceMetrics {
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
  private queue: any[] = [];
  private isProcessing = false;

  constructor(config: APMConfig) {
    if (!config.apiKey) {
      throw new Error("APM API Key is required");
    }

    this.apiKey = config.apiKey;
    this.endpoint = config.endpoint || "http://localhost:5000";
    this.userId = config.userId || this.generateUserId();
    this.sessionId = config.sessionId || this.generateSessionId();
    this.sampleRate = config.sampleRate ?? 1.0;
    this.debug = config.debug ?? false;

    // Auto-tracking features
    if (config.enableAutoPageTracking ?? true) {
      this.setupPageTracking();
    }
    if (config.enableAutoErrorTracking ?? true) {
      this.setupErrorTracking();
    }
    if (config.enableAutoPerformanceTracking ?? true) {
      this.setupPerformanceTracking();
    }

    // Batch send events periodically
    setInterval(() => this.flush(), 30000); // Every 30 seconds

    // Flush on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.flush());
    }
  }

  /**
   * Track a custom event
   */
  public trackEvent(
    type: string,
    payload: EventPayload = {},
    userId?: string
  ): void {
    if (!this.shouldSample()) return;

    const event = {
      type,
      payload,
      userId: userId || this.userId,
      sessionId: this.sessionId,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      timestamp: new Date().toISOString(),
    };

    this.queue.push(event);

    if (this.debug) {
      console.log("[APM] Event queued:", event);
    }

    // Auto-flush if queue is large
    if (this.queue.length >= 50) {
      this.flush();
    }
  }

  /**
   * Track an error
   */
  public trackError(error: Error | string, context?: EventPayload): void {
    const errorEvent = {
      type: "error",
      payload: {
        message:
          typeof error === "string" ? error : error.message,
        stack: typeof error === "string" ? undefined : error.stack,
        ...(context || {}),
      },
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    };

    this.queue.push(errorEvent);

    if (this.debug) {
      console.log("[APM] Error tracked:", errorEvent);
    }

    // Flush immediately for errors
    this.flush();
  }

  /**
   * Track user interaction
   */
  public trackInteraction(
    action: string,
    target: string,
    payload?: EventPayload
  ): void {
    this.trackEvent("user_interaction", {
      action,
      target,
      ...payload,
    });
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(metrics: PerformanceMetrics): void {
    this.trackEvent("performance", {
      metrics,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set user context for all future events
   */
  public setUser(userId: string, metadata?: EventPayload): void {
    this.userId = userId;
    this.trackEvent("user_set", { userId, metadata });
  }

  /**
   * Manually flush pending events
   */
  public async flush(): Promise<void> {
    if (this.queue.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const events = this.queue.splice(0, 100); // Batch up to 100 events

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
        throw new Error(`Failed to send events: ${response.statusText}`);
      }

      if (this.debug) {
        console.log(`[APM] Flushed ${events.length} events`);
      }
    } catch (error) {
      // Re-queue events if send failed
      this.queue.unshift(...events);

      if (this.debug) {
        console.error("[APM] Failed to flush events:", error);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Private helper methods
   */
  private shouldSample(): boolean {
    return Math.random() <= this.sampleRate;
  }

  private generateUserId(): string {
    if (typeof window !== "undefined") {
      let userId = localStorage.getItem("apm_user_id");
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem("apm_user_id", userId);
      }
      return userId;
    }
    return `user_${Date.now()}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPageTracking(): void {
    if (typeof window === "undefined") return;

    // Track page views
    const trackPageView = () => {
      this.trackEvent("page_view", {
        page: window.location.pathname,
        referrer: document.referrer,
      });
    };

    // Initial page load
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", trackPageView);
    } else {
      trackPageView();
    }

    // Track page changes (for SPAs)
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

    // Track uncaught errors
    window.addEventListener("error", (event) => {
      this.trackError(event.error || event.message, {
        type: "uncaught_error",
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Track unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.trackError(event.reason, {
        type: "unhandled_promise_rejection",
      });
    });
  }

  private setupPerformanceTracking(): void {
    if (typeof window === "undefined" || !window.PerformanceObserver)
      return;

    // Track Long Tasks
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // 50ms threshold
            this.trackEvent("long_task", {
              duration: entry.duration,
              name: entry.name,
            });
          }
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      // Long tasks API might not be available
    }

    // Track Core Web Vitals
    if ("web-vital" in window) {
      // Assuming a web-vitals library is available
      this.trackEvent("performance_metrics", {
        source: "web_vitals",
      });
    }
  }
}

// Export factory function for easier instantiation
export function createAPMClient(config: APMConfig): APMClient {
  return new APMClient(config);
}

// Global type augmentation
declare global {
  interface Window {
    APMClient: typeof APMClient;
    createAPMClient: typeof createAPMClient;
  }
}

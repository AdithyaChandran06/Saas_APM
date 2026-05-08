/**
 * Tests for Notification Service
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendSlackNotification, sendWebhookNotification } from "../services/notification-service";

describe("Notification Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendSlackNotification", () => {
    it("should send Slack message with correct format", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        statusText: "OK",
      });
      global.fetch = mockFetch;

      const webhookUrl = "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX";
      const title = "Test Alert";
      const message = "This is a test message";

      await sendSlackNotification(webhookUrl, title, message);

      expect(mockFetch).toHaveBeenCalledOnce();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe(webhookUrl);
      expect(call[1]?.method).toBe("POST");
      expect(call[1]?.headers).toEqual({ "Content-Type": "application/json" });

      const body = JSON.parse(call[1]?.body as string);
      expect(body.text).toBe(title);
      expect(body.blocks).toBeDefined();
      expect(body.blocks[0].text.text).toContain(title);
      expect(body.blocks[0].text.text).toContain(message);
    });

    it("should include metadata in Slack message", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        statusText: "OK",
      });
      global.fetch = mockFetch;

      const metadata = { threshold: 5, metric: "10%" };
      await sendSlackNotification("https://hooks.slack.com/services/test", "Alert", "Test", metadata);

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.blocks.length).toBeGreaterThan(1);
      expect(body.blocks[1].fields).toBeDefined();
    });

    it("should throw error on failed request", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
      });
      global.fetch = mockFetch;

      await expect(sendSlackNotification("https://hooks.slack.com/services/test", "Alert", "Test")).rejects.toThrow();
    });
  });

  describe("sendWebhookNotification", () => {
    it("should send webhook with correct payload", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        statusText: "OK",
      });
      global.fetch = mockFetch;

      const webhookUrl = "https://example.com/webhook";
      const title = "Test Alert";
      const message = "This is a test message";

      await sendWebhookNotification(webhookUrl, title, message);

      expect(mockFetch).toHaveBeenCalledOnce();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe(webhookUrl);
      expect(call[1]?.method).toBe("POST");

      const body = JSON.parse(call[1]?.body as string);
      expect(body.event).toBe("alert.triggered");
      expect(body.title).toBe(title);
      expect(body.message).toBe(message);
      expect(body.timestamp).toBeDefined();
    });

    it("should include metadata in webhook payload", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        statusText: "OK",
      });
      global.fetch = mockFetch;

      const metadata = { alertId: "123", workspace: "workspace-1" };
      await sendWebhookNotification("https://example.com/webhook", "Alert", "Test", metadata);

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(body.metadata).toEqual(metadata);
    });

    it("should throw error on failed request", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: "Server Error",
      });
      global.fetch = mockFetch;

      await expect(sendWebhookNotification("https://example.com/webhook", "Alert", "Test")).rejects.toThrow();
    });
  });
});

/**
 * Tests for Alert Evaluator Service
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { isAlertTriggered } from "../services/alert-evaluator";

describe("Alert Evaluator", () => {
  describe("isAlertTriggered", () => {
    const mockMetrics = {
      errorRate: 5.5,
      latencyP95: 1200,
      latencyP99: 2500,
      errorCount: 45,
      status5xxCount: 12,
    };

    it("should detect error_rate threshold exceeded (greater_than)", () => {
      const result = isAlertTriggered("greater_than", 5, "error_rate", mockMetrics);
      expect(result).toBe(true);
    });

    it("should detect error_rate threshold not exceeded (greater_than)", () => {
      const result = isAlertTriggered("greater_than", 10, "error_rate", mockMetrics);
      expect(result).toBe(false);
    });

    it("should detect latency_p95 threshold exceeded (greater_than)", () => {
      const result = isAlertTriggered("greater_than", 1000, "latency_p95", mockMetrics);
      expect(result).toBe(true);
    });

    it("should detect latency_p99 threshold exceeded (greater_than)", () => {
      const result = isAlertTriggered("greater_than", 2000, "latency_p99", mockMetrics);
      expect(result).toBe(true);
    });

    it("should detect error_count threshold exceeded (greater_than)", () => {
      const result = isAlertTriggered("greater_than", 40, "error_count", mockMetrics);
      expect(result).toBe(true);
    });

    it("should handle less_than condition", () => {
      const result = isAlertTriggered("less_than", 10, "error_rate", mockMetrics);
      expect(result).toBe(true);
    });

    it("should handle equals condition", () => {
      const result = isAlertTriggered("equals", 5.5, "error_rate", mockMetrics);
      expect(result).toBe(true);
    });

    it("should handle equals with tolerance", () => {
      const result = isAlertTriggered("equals", 5.51, "error_rate", mockMetrics);
      expect(result).toBe(true); // Within tolerance
    });

    it("should detect status_5xx threshold", () => {
      const result = isAlertTriggered("greater_than", 10, "status_5xx", mockMetrics);
      expect(result).toBe(true);
    });

    it("should return false for unknown condition", () => {
      const result = isAlertTriggered("unknown" as any, 5, "error_rate", mockMetrics);
      expect(result).toBe(false);
    });
  });
});

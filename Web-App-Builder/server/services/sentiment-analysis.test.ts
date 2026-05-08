/**
 * Tests for Sentiment Analysis Service
 */

import { describe, it, expect } from "vitest";
import { analyzeSentiment } from "../services/sentiment-analysis";

describe("Sentiment Analysis Service", () => {
  describe("analyzeSentiment", () => {
    it("should detect positive sentiment", () => {
      const result = analyzeSentiment("This product is amazing and I love it!");
      expect(result).toBe("positive");
    });

    it("should detect negative sentiment", () => {
      const result = analyzeSentiment("This is terrible, buggy, and broken.");
      expect(result).toBe("negative");
    });

    it("should detect neutral sentiment", () => {
      const result = analyzeSentiment("The app works as expected.");
      expect(result).toBe("neutral");
    });

    it("should be case insensitive", () => {
      const result1 = analyzeSentiment("GREAT and AMAZING");
      const result2 = analyzeSentiment("great and amazing");
      expect(result1).toBe(result2);
    });

    it("should handle positive intensifiers", () => {
      const result = analyzeSentiment("This is very very excellent!");
      expect(result).toBe("positive");
    });

    it("should handle negative intensifiers", () => {
      const result = analyzeSentiment("This is absolutely terrible and horrible.");
      expect(result).toBe("negative");
    });

    it("should handle mixed sentiments (positive dominant)", () => {\n      const result = analyzeSentiment(\"Great app but has some bugs\");\n      expect(result).toBe(\"positive\");\n    });\n\n    it(\"should handle mixed sentiments (negative dominant)\", () => {\n      const result = analyzeSentiment(\"Nice design but very slow and broken\");\n      expect(result).toBe(\"negative\");\n    });\n\n    it(\"should handle empty string\", () => {\n      const result = analyzeSentiment(\"\");\n      expect(result).toBe(\"neutral\");\n    });\n\n    it(\"should handle text with no keywords\", () => {\n      const result = analyzeSentiment(\"The app has 5 features and 3 pages\");\n      expect(result).toBe(\"neutral\");\n    });\n\n    it(\"should handle multiple negative keywords\", () => {\n      const result = analyzeSentiment(\n        \"The app is broken, buggy, crashes frequently, and has many errors\"\n      );\n      expect(result).toBe(\"negative\");\n    });\n\n    it(\"should handle multiple positive keywords\", () => {\n      const result = analyzeSentiment(\n        \"This is amazing, excellent, and I absolutely love it! Highly recommend!\"\n      );\n      expect(result).toBe(\"positive\");\n    });\n  });\n});\n
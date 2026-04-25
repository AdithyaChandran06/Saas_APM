import { z } from "zod";

// More sophisticated sentiment analysis
const sentimentKeywords = {
  positive: [
    "great",
    "excellent",
    "amazing",
    "love",
    "awesome",
    "fantastic",
    "wonderful",
    "perfect",
    "happy",
    "satisfied",
    "impressed",
    "brilliant",
    "superb",
    "delighted",
    "recommend",
    "easy",
    "smooth",
    "intuitive",
  ],
  negative: [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "hate",
    "broken",
    "crash",
    "bug",
    "error",
    "issue",
    "problem",
    "slow",
    "confusing",
    "frustrat",
    "annoying",
    "useless",
    "disappointing",
    "difficult",
    "complicated",
    "buggy",
    "unstable",
  ],
};

const intensityModifiers = {
  very: 1.5,
  extremely: 2.0,
  incredibly: 2.0,
  really: 1.5,
  so: 1.5,
  not: -1.0,
  never: -1.5,
  always: 1.3,
};

export type SentimentResult = {
  sentiment: "positive" | "negative" | "neutral";
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  keywords: string[];
};

export function analyzeSentiment(text: string): SentimentResult {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  let positiveScore = 0;
  let negativeScore = 0;
  const foundKeywords: string[] = [];
  let previousModifier = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const cleanWord = word.replace(/[.,!?;:'"()-]/g, "");

    // Check for intensity modifiers
    if (intensityModifiers[cleanWord as keyof typeof intensityModifiers]) {
      previousModifier =
        intensityModifiers[cleanWord as keyof typeof intensityModifiers];
      continue;
    }

    // Check for positive keywords
    if (
      sentimentKeywords.positive.some((keyword) =>
        cleanWord.includes(keyword)
      )
    ) {
      positiveScore += previousModifier;
      foundKeywords.push(cleanWord);
    }

    // Check for negative keywords
    if (
      sentimentKeywords.negative.some((keyword) =>
        cleanWord.includes(keyword)
      )
    ) {
      negativeScore += Math.abs(previousModifier);
      foundKeywords.push(cleanWord);
    }

    previousModifier = 1;
  }

  const totalScore = positiveScore - negativeScore;
  const totalKeywords = positiveScore + negativeScore;

  // Normalize score to -1 to 1
  let normalizedScore = 0;
  if (totalScore > 0) {
    normalizedScore = Math.min(1, totalScore / Math.max(positiveScore, 1));
  } else if (totalScore < 0) {
    normalizedScore = Math.max(-1, totalScore / Math.max(negativeScore, 1));
  }

  // Calculate confidence based on keyword count
  const confidence = Math.min(1, totalKeywords / 10);

  let sentiment: "positive" | "negative" | "neutral";
  if (normalizedScore > 0.2) {
    sentiment = "positive";
  } else if (normalizedScore < -0.2) {
    sentiment = "negative";
  } else {
    sentiment = "neutral";
  }

  return {
    sentiment,
    score: Math.round(normalizedScore * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    keywords: Array.from(new Set(foundKeywords)),
  };
}

// NLP-based text categorization
export function categorizeContent(
  text: string
): "feature_request" | "bug" | "general_feedback" | "complaint" | "praise" {
  const lowerText = text.toLowerCase();

  const bugKeywords = ["bug", "crash", "error", "broken", "doesn't work", "fail"];
  const featureKeywords = ["feature", "add", "implement", "would like", "wish"];
  const complaintKeywords = ["complaint", "issue", "problem", "frustrat"];
  const praiseKeywords = ["great", "love", "excellent", "amazing", "awesome"];

  const bugMatches = bugKeywords.filter((k) => lowerText.includes(k)).length;
  const featureMatches = featureKeywords.filter((k) =>
    lowerText.includes(k)
  ).length;
  const complaintMatches = complaintKeywords.filter((k) =>
    lowerText.includes(k)
  ).length;
  const praiseMatches = praiseKeywords.filter((k) => lowerText.includes(k))
    .length;

  if (bugMatches >= 1) return "bug";
  if (featureMatches >= 1) return "feature_request";
  if (complaintMatches >= 1) return "complaint";
  if (praiseMatches >= 1) return "praise";
  return "general_feedback";
}

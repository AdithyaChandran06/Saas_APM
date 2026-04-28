import type { Event, Feedback } from "@shared/schema";

type RecommendationCandidate = {
  title?: string;
  description?: string;
  category?: string;
  impactScore?: number;
  effortScore?: number;
};

type ScoringEnhancements = {
  evidence?: {
    likelyRootCause?: string;
    correlationScore?: number;
    matchedFeedbackCount?: number;
    matchedEventCount?: number;
    topFeedbackThemes?: string[];
    impactedUrls?: string[];
  };
};

type ScoringResult = {
  impactScore: number;
  severityScore: number;
  frequencyScore: number;
  affectedUsersPercent: number;
  effortScore: number;
  confidenceScore: number;
  reasoningSummary: string;
  supportingData: Record<string, unknown>;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 100) / 100;

function getSeverityScore(candidate: RecommendationCandidate, feedback: Feedback[]): number {
  const text = `${candidate.title ?? ""} ${candidate.description ?? ""}`.toLowerCase();
  const strongNegativeSignals = ["critical", "outage", "broken", "blocked", "churn"];
  const mediumNegativeSignals = ["slow", "confusing", "issue", "friction", "drop"];

  const strongHits = strongNegativeSignals.filter((word) => text.includes(word)).length;
  const mediumHits = mediumNegativeSignals.filter((word) => text.includes(word)).length;
  const negativeFeedbackRatio =
    feedback.length > 0
      ? feedback.filter((item) => item.sentiment === "negative").length / feedback.length
      : 0;

  const score = 3 + strongHits * 2 + mediumHits * 1 + negativeFeedbackRatio * 4;
  return clamp(score, 1, 10);
}

function getFrequencyScore(candidate: RecommendationCandidate, events: Event[]): number {
  const text = `${candidate.title ?? ""} ${candidate.description ?? ""}`.toLowerCase();
  const tokens = text
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 3);

  if (tokens.length === 0 || events.length === 0) return 3;

  const joinedEvents = events
    .map((event) => `${event.type} ${event.url ?? ""} ${JSON.stringify(event.payload ?? {})}`.toLowerCase())
    .join(" ");

  const tokenHits = tokens.filter((token) => joinedEvents.includes(token)).length;
  const hitRatio = tokenHits / tokens.length;
  return clamp(2 + hitRatio * 8, 1, 10);
}

function getAffectedUsersPercent(events: Event[]): number {
  if (events.length === 0) return 0;
  const users = events.map((event) => event.userId).filter((id): id is string => Boolean(id));
  const uniqueUsers = new Set(users);
  if (uniqueUsers.size === 0) return 0;
  return clamp((uniqueUsers.size / Math.max(users.length, uniqueUsers.size)) * 100, 0, 100);
}

function getEffortScore(candidate: RecommendationCandidate): number {
  if (typeof candidate.effortScore === "number") return clamp(candidate.effortScore, 1, 10);
  const text = `${candidate.title ?? ""} ${candidate.description ?? ""}`.toLowerCase();
  if (text.includes("redesign") || text.includes("migration") || text.includes("re-architecture")) return 8;
  if (text.includes("optimize") || text.includes("improve") || text.includes("refactor")) return 6;
  if (text.includes("copy") || text.includes("tooltip") || text.includes("ui tweak")) return 3;
  return 5;
}

export function scoreRecommendation(
  candidate: RecommendationCandidate,
  context: { events: Event[]; feedback: Feedback[] },
  enhancements?: ScoringEnhancements,
): ScoringResult {
  const severityScore = getSeverityScore(candidate, context.feedback);
  const frequencyScore = getFrequencyScore(candidate, context.events);
  const affectedUsersPercent = getAffectedUsersPercent(context.events);
  const effortScore = getEffortScore(candidate);

  // Higher effort reduces priority impact.
  const impactScore = clamp(
    severityScore * 0.35 + frequencyScore * 0.3 + (affectedUsersPercent / 10) * 0.25 + (10 - effortScore) * 0.1,
    0,
    10,
  );

  const confidenceScore = clamp(
    (context.events.length >= 20 ? 4 : context.events.length / 5) +
      (context.feedback.length >= 10 ? 4 : context.feedback.length / 3) +
      2,
    0,
    10,
  );

  return {
    impactScore: round(impactScore),
    severityScore: round(severityScore),
    frequencyScore: round(frequencyScore),
    affectedUsersPercent: round(affectedUsersPercent),
    effortScore: round(effortScore),
    confidenceScore: round(confidenceScore),
    reasoningSummary:
      enhancements?.evidence?.likelyRootCause
        ? `Impact combines issue severity, observed frequency, affected user share, and implementation effort. Root cause signal: ${enhancements.evidence.likelyRootCause}`
        : "Impact combines issue severity, observed frequency, affected user share, and implementation effort.",
    supportingData: {
      sampledEvents: context.events.length,
      sampledFeedback: context.feedback.length,
      negativeFeedbackCount: context.feedback.filter((item) => item.sentiment === "negative").length,
      correlation: enhancements?.evidence ?? null,
    },
  };
}

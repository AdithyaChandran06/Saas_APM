import type { Event, Feedback } from "@shared/schema";

type RecommendationInput = {
  title?: string;
  description?: string;
  category?: string;
};

export type CorrelationEvidence = {
  matchedFeedbackCount: number;
  matchedEventCount: number;
  topFeedbackThemes: string[];
  impactedUrls: string[];
  likelyRootCause: string;
  correlationScore: number;
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "have",
  "your",
  "users",
  "user",
  "into",
  "about",
  "page",
  "feature",
]);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 3 && !STOP_WORDS.has(token));
}

function getTopThemes(feedback: Feedback[]): string[] {
  const counts = new Map<string, number>();
  for (const item of feedback) {
    for (const token of tokenize(item.content)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([token]) => token);
}

export function deriveCorrelationEvidence(
  recommendation: RecommendationInput,
  context: { events: Event[]; feedback: Feedback[] },
): CorrelationEvidence {
  const text = `${recommendation.title ?? ""} ${recommendation.description ?? ""}`;
  const recTokens = new Set(tokenize(text));

  const matchedFeedback = context.feedback.filter((item) => {
    const tokens = tokenize(item.content);
    return tokens.some((token) => recTokens.has(token));
  });

  const matchedEvents = context.events.filter((event) => {
    const joined = `${event.type} ${event.url ?? ""} ${JSON.stringify(event.payload ?? {})}`.toLowerCase();
    return Array.from(recTokens).some((token) => joined.includes(token));
  });

  const impactedUrls = Array.from(
    new Set(matchedEvents.map((event) => event.url).filter((url): url is string => Boolean(url))),
  ).slice(0, 5);

  const topFeedbackThemes = getTopThemes(matchedFeedback.length > 0 ? matchedFeedback : context.feedback);
  const correlationScore = clamp(
    (matchedFeedback.length / Math.max(context.feedback.length, 1)) * 6 +
      (matchedEvents.length / Math.max(context.events.length, 1)) * 4,
    0,
    10,
  );

  const likelyRootCause =
    impactedUrls.length > 0
      ? `User friction appears concentrated around ${impactedUrls.join(", ")} based on event and feedback overlap.`
      : "Feedback themes indicate a discoverability/clarity issue without a single dominant URL path.";

  return {
    matchedFeedbackCount: matchedFeedback.length,
    matchedEventCount: matchedEvents.length,
    topFeedbackThemes,
    impactedUrls,
    likelyRootCause,
    correlationScore: Math.round(correlationScore * 100) / 100,
  };
}

import OpenAI from "openai";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { Event, Feedback } from "@shared/schema";

const aiRecommendationSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(8),
  category: z.enum(["revenue", "retention", "ux"]),
  effortScore: z.number().min(1).max(10).optional(),
});

const aiResponseSchema = z.object({
  recommendations: z.array(aiRecommendationSchema).min(1).max(5),
});

export type AiRecommendation = z.infer<typeof aiRecommendationSchema>;

type RecommendationContext = {
  events: Event[];
  feedback: Feedback[];
  stats: { totalEvents: number; totalFeedback: number };
};

type RecommendationGenerationResult = {
  recommendations: AiRecommendation[];
  modelUsed: string;
  inputSnapshotHash: string;
};

const DEFAULT_MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
const MAX_ATTEMPTS = 3;
const FALLBACK_MODELS = [DEFAULT_MODEL, "gpt-4o-mini", "gpt-4.1-mini"];

function buildPrompt(context: RecommendationContext): string {
  return [
    "Generate exactly 3 prioritized product recommendations.",
    "Focus on retention, revenue, and UX friction.",
    "Return strict JSON with this shape:",
    '{"recommendations":[{"title":"string","description":"string","category":"revenue|retention|ux","effortScore":1-10}]}',
    `Stats: ${JSON.stringify(context.stats)}`,
    `Recent Events Sample: ${JSON.stringify(context.events.slice(0, 10))}`,
    `Recent Feedback Sample: ${JSON.stringify(context.feedback.slice(0, 10))}`,
  ].join("\n");
}

function buildInputSnapshotHash(context: RecommendationContext): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        stats: context.stats,
        events: context.events.slice(0, 50),
        feedback: context.feedback.slice(0, 50),
      }),
    )
    .digest("hex");
}

export async function generateRecommendationsWithRetries(
  openai: OpenAI,
  context: RecommendationContext,
): Promise<RecommendationGenerationResult> {
  const inputSnapshotHash = buildInputSnapshotHash(context);
  const prompt = buildPrompt(context);

  let lastError: unknown;
  const uniqueModels = Array.from(new Set(FALLBACK_MODELS));

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await openai.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content ?? "{}";
        const parsedJson = JSON.parse(content);
        const parsed = aiResponseSchema.parse(parsedJson);

        return {
          recommendations: parsed.recommendations,
          modelUsed: model,
          inputSnapshotHash,
        };
      } catch (error) {
        lastError = error;
        const maybeErrorCode = (error as { code?: string })?.code;
        const maybeErrorType = (error as { type?: string })?.type;
        const isModelNotFound = maybeErrorCode === "model_not_found";
        const isNonRetryableAuthOrQuota =
          maybeErrorCode === "insufficient_quota" ||
          maybeErrorCode === "invalid_api_key" ||
          maybeErrorType === "insufficient_quota";
        if (isNonRetryableAuthOrQuota) {
          break;
        }
        if (isModelNotFound) {
          break;
        }
        if (attempt === MAX_ATTEMPTS) break;
      }
    }
  }

  // Deterministic fallback to keep endpoint reliable even if AI output is malformed.
  const fallbackRecommendations: AiRecommendation[] = [
    {
      title: "Simplify onboarding first-run flow",
      description: "Reduce first-session drop-offs by clarifying the first key action and shortening initial setup steps.",
      category: "retention",
      effortScore: 6,
    },
    {
      title: "Improve pricing page clarity",
      description: "Address recurring pricing confusion with clearer plan comparison and stronger value messaging.",
      category: "revenue",
      effortScore: 5,
    },
    {
      title: "Surface feature guidance contextually",
      description: "Add contextual tips and inline guidance in complex screens to reduce friction and improve task completion.",
      category: "ux",
      effortScore: 4,
    },
  ];

  if (lastError) {
    const error = lastError as { status?: number; code?: string; type?: string; message?: string };
    console.warn(
      `AI generation fallback activated (status=${error.status ?? "unknown"}, code=${error.code ?? error.type ?? "unknown"}).`,
    );
  }

  return {
    recommendations: fallbackRecommendations,
    modelUsed: "fallback",
    inputSnapshotHash,
  };
}

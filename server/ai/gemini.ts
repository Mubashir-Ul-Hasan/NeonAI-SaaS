/// <reference types="node" />

import type {
  GenerateArticleInput,
  GenerateArticleOutput,
  GenerateTitlesInput,
  GenerateTitlesOutput,
  JsonRecord,
} from "../types";
import { env } from "../env";
import { aiProviderError, validationError } from "../utils/errors";

type GeminiRole = "user" | "model";

type GeminiPart = {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
};

type GeminiContent = {
  role?: GeminiRole;
  parts: GeminiPart[];
};

type GeminiGenerateOptions = {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  responseMimeType?: "text/plain" | "application/json";
  responseSchema?: JsonRecord;
  images?: Array<{
    mimeType: string;
    base64Data: string;
  }>;
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
      role?: string;
    };
    finishReason?: string;
    safetyRatings?: unknown[];
  }>;
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: unknown[];
  };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

type GeminiTextResult = {
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  raw: GeminiGenerateResponse;
};

const defaultGeminiModel =
  process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

const fallbackGeminiModels = [
  defaultGeminiModel,
  ...(process.env.GEMINI_FALLBACK_MODELS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean),
].filter((model, index, models) => models.indexOf(model) === index);


const geminiApiBaseUrl =
  process.env.GEMINI_API_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta";

export async function generateGeminiText(
  options: GeminiGenerateOptions,
): Promise<GeminiTextResult> {
  const modelsToTry = options.model
    ? [options.model]
    : fallbackGeminiModels.length
      ? fallbackGeminiModels
      : [defaultGeminiModel];

  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      return await generateGeminiTextWithModel({
        ...options,
        model,
      });
    } catch (error) {
      lastError = error;

      const message = getGeminiRetryMessage(error);

const shouldTryNextModel =
  message.includes("503") ||
  message.includes("UNAVAILABLE") ||
  message.includes("high demand") ||
  message.includes("overloaded");

      if (!shouldTryNextModel) {
        throw error;
      }

      if (env.isDevelopment) {
        console.warn(
          JSON.stringify(
            {
              level: "warn",
              message: "Gemini model failed, trying fallback model",
              failedModel: model,
              remainingModels: modelsToTry.slice(modelsToTry.indexOf(model) + 1),
              error: message,
            },
            null,
            2,
          ),
        );
      }
    }
  }

  throw aiProviderError("gemini", "Gemini text generation failed.", lastError);
}

async function generateGeminiTextWithModel(
  options: GeminiGenerateOptions & {
    model: string;
  },
): Promise<GeminiTextResult> {
  const model = options.model;
  const url = `${geminiApiBaseUrl}/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;

  const contents: GeminiContent[] = [
    {
      role: "user",
      parts: [
        { text: options.prompt },
        ...(options.images?.map((image) => ({
          inlineData: {
            mimeType: image.mimeType,
            data: image.base64Data,
          },
        })) ?? []),
      ],
    },
  ];

  const requestBody = {
    contents,
    ...(options.systemInstruction
      ? {
          systemInstruction: {
            parts: [{ text: options.systemInstruction }],
          },
        }
      : {}),
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      topP: options.topP ?? 0.9,
      topK: options.topK,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
      responseMimeType: options.responseMimeType ?? "text/plain",
      ...(options.responseSchema
        ? {
            responseSchema: options.responseSchema,
          }
        : {}),
    },
  };

  const startedAt = Date.now();
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();

      if (!response.ok) {
        const retryable =
          response.status === 429 ||
          response.status === 500 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504;

        if (retryable && attempt < maxAttempts) {
          await wait(700 * attempt);
          continue;
        }

        throw new Error(
          `Gemini API failed with ${response.status}: ${responseText}`,
        );
      }

      const data = JSON.parse(responseText) as GeminiGenerateResponse;

      if (data.promptFeedback?.blockReason) {
        throw validationError("Gemini blocked the prompt for safety reasons.", {
          blockReason: data.promptFeedback.blockReason,
          safetyRatings: data.promptFeedback.safetyRatings,
        });
      }

      const text = extractGeminiText(data);

      if (!text.trim()) {
        throw new Error("Gemini returned an empty response.");
      }

      return {
        text,
        model,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
          totalTokens:
            data.usageMetadata?.totalTokenCount ?? estimateTokens(text),
        },
        raw: {
          ...data,
          usageMetadata: {
            ...data.usageMetadata,
            totalTokenCount:
              data.usageMetadata?.totalTokenCount ?? estimateTokens(text),
          },
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (attempt < maxAttempts) {
        await wait(700 * attempt);
        continue;
      }

      if (env.isDevelopment) {
        console.error(
          JSON.stringify(
            {
              level: "error",
              message: "Gemini request failed",
              model,
              apiBaseUrl: geminiApiBaseUrl,
              latencyMs: Date.now() - startedAt,
              error: errorMessage,
            },
            null,
            2,
          ),
        );
      }

      throw aiProviderError("gemini", "Gemini text generation failed.", {
        error: errorMessage,
        latencyMs: Date.now() - startedAt,
        model,
      });
    }
  }

  throw aiProviderError("gemini", "Gemini text generation failed.");
}

export async function generateArticleWithGemini(
  input: GenerateArticleInput,
): Promise<GenerateArticleOutput & { usage: GeminiTextResult["usage"] }> {
  const systemInstruction = [
    "You are an expert SaaS content writer.",
    "Write clear, useful, original content.",
    "Avoid fluff. Use practical explanations and strong structure.",
    "Return only valid JSON. Do not wrap the JSON in markdown.",
  ].join("\n");

  const prompt = [
    "Create a complete article from this request.",
    "",
    `Topic/request: ${input.prompt}`,
    `Tone: ${input.tone || "Professional and helpful"}`,
    `Length: ${input.length || "medium"}`,
    input.keywords?.length
      ? `Keywords to include naturally: ${input.keywords.join(", ")}`
      : "Keywords: none provided",
    "",
    "Return JSON in this exact shape:",
    JSON.stringify(
      {
        title: "Article title",
        content: "Full article body with headings and paragraphs",
      },
      null,
      2,
    ),
  ].join("\n");

  const result = await generateGeminiText({
    prompt,
    systemInstruction,
    temperature: 0.72,
    maxOutputTokens: getArticleMaxTokens(input.length),
    responseMimeType: "application/json",
  });

  const parsed = parseJsonFromGemini<{
    title?: unknown;
    content?: unknown;
  }>(result.text);

  const title =
    typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim()
      : "Generated Article";

  const content =
    typeof parsed.content === "string" && parsed.content.trim()
      ? parsed.content.trim()
      : result.text.trim();

  const wordCount = countWords(content);

  return {
    title,
    content,
    wordCount,
    readingTimeMinutes: getReadingTimeMinutes(wordCount),
    usage: result.usage,
  };
}

export async function generateBlogTitlesWithGemini(
  input: GenerateTitlesInput,
): Promise<GenerateTitlesOutput & { usage: GeminiTextResult["usage"] }> {
  const count = clamp(input.count ?? 5, 1, 20);

  const systemInstruction = [
    "You are an expert blog title strategist and SEO copywriter.",
    "Create concise, useful, clickable titles without clickbait.",
    "Return only valid JSON. Do not wrap the JSON in markdown.",
  ].join("\n");

  const prompt = [
    `Generate ${count} blog title ideas.`,
    "",
    `Topic: ${input.topic}`,
    `Category: ${input.category || "General"}`,
    `Style: ${input.style || "SEO-friendly"}`,
    "",
    "Return JSON in this exact shape:",
    JSON.stringify(
      {
        titles: [
          "First title",
          "Second title",
          "Third title",
        ],
      },
      null,
      2,
    ),
  ].join("\n");

  const result = await generateGeminiText({
    prompt,
    systemInstruction,
    temperature: 0.85,
    maxOutputTokens: 1024,
    responseMimeType: "application/json",
  });

  const parsed = parseJsonFromGemini<{
    titles?: unknown;
  }>(result.text);

  const titles = Array.isArray(parsed.titles)
    ? parsed.titles
        .filter((title): title is string => typeof title === "string")
        .map((title) => title.trim())
        .filter(Boolean)
        .slice(0, count)
    : splitTitleFallback(result.text).slice(0, count);

  if (!titles.length) {
    throw aiProviderError("gemini", "Gemini did not return any blog titles.");
  }

  return {
    titles,
    usage: result.usage,
  };
}

export async function reviewTextWithGemini(options: {
  text: string;
  targetRole?: string;
  focus?: string;
}): Promise<{
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  atsSuggestions: string[];
  fullReview: string;
  usage: GeminiTextResult["usage"];
}> {
  const systemInstruction = [
    "You are an expert technical resume reviewer.",
    "Give honest, practical, specific feedback.",
    "Return only valid JSON. Do not wrap the JSON in markdown.",
  ].join("\n");

  const prompt = [
    "Review this resume text.",
    "",
    `Target role: ${options.targetRole || "Not specified"}`,
    `Review focus: ${options.focus || "ATS optimization and overall quality"}`,
    "",
    "Resume text:",
    options.text,
    "",
    "Return JSON in this exact shape:",
    JSON.stringify(
      {
        score: 82,
        summary: "Brief summary",
        strengths: ["strength 1", "strength 2"],
        improvements: ["improvement 1", "improvement 2"],
        atsSuggestions: ["ATS suggestion 1", "ATS suggestion 2"],
        fullReview: "Detailed review text",
      },
      null,
      2,
    ),
  ].join("\n");

  const result = await generateGeminiText({
    prompt,
    systemInstruction,
    temperature: 0.45,
    maxOutputTokens: 2500,
    responseMimeType: "application/json",
  });

  const parsed = parseJsonFromGemini<{
    score?: unknown;
    summary?: unknown;
    strengths?: unknown;
    improvements?: unknown;
    atsSuggestions?: unknown;
    fullReview?: unknown;
  }>(result.text);

  return {
    score:
      typeof parsed.score === "number"
        ? clamp(Math.round(parsed.score), 0, 100)
        : 75,
    summary:
      typeof parsed.summary === "string"
        ? parsed.summary
        : "Resume review completed.",
    strengths: parseStringList(parsed.strengths),
    improvements: parseStringList(parsed.improvements),
    atsSuggestions: parseStringList(parsed.atsSuggestions),
    fullReview:
      typeof parsed.fullReview === "string" ? parsed.fullReview : result.text,
    usage: result.usage,
  };
}

export function parseJsonFromGemini<T>(text: string): T {
  const cleanedText = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleanedText) as T;
  } catch {
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw aiProviderError("gemini", "Gemini returned invalid JSON.");
    }

    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch (error) {
      throw aiProviderError("gemini", "Failed to parse Gemini JSON response.", error);
    }
  }
}

export function extractGeminiText(data: GeminiGenerateResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];

  return parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getReadingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 220));
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function getArticleMaxTokens(length: GenerateArticleInput["length"]): number {
  if (length === "short") return 1200;
  if (length === "long") return 3600;

  return 2200;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => windowlessSetTimeout(resolve, ms));
}

function windowlessSetTimeout(resolve: () => void, ms: number): void {
  setTimeout(resolve, ms);
}

function getGeminiRetryMessage(error: unknown): string {
  if (error instanceof Error) {
    const details = "details" in error ? JSON.stringify(error.details) : "";
    const cause = "cause" in error ? JSON.stringify(error.cause) : "";

    return `${error.message} ${details} ${cause}`;
  }

  return String(error);
}

function splitTitleFallback(text: string): string[] {
  return text
    .split("\n")
    .map((line) =>
      line
        .replace(/^\d+[\).:-]\s*/, "")
        .replace(/^[-*]\s*/, "")
        .trim(),
    )
    .filter(Boolean);
}

function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
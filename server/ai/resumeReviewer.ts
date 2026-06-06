/// <reference types="node" />

import { Buffer } from "node:buffer";

import type {
  JsonRecord,
  ResumeReviewOutput,
  ReviewResumeInput,
  UploadedFile,
} from "../types";
import {
  aiProviderError,
  getErrorMessage,
  validationError,
} from "../utils/errors";
import { getSafeFileName } from "../utils/validators";
import {
  generateGeminiText,
  parseJsonFromGemini,
  reviewTextWithGemini,
} from "./gemini";

type ResumeExtractionResult = {
  text: string;
  method: "pdf" | "docx" | "text" | "image" | "fallback";
  metadata: JsonRecord;
};

type ResumeReviewResult = ResumeReviewOutput & {
  extraction: ResumeExtractionResult;
  usage: {
    promptTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
};

const supportedTextMimeTypes = [
  "text/plain",
  "text/markdown",
  "application/json",
] as const;

const supportedPdfMimeTypes = ["application/pdf"] as const;

const supportedDocxMimeTypes = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

const unsupportedDocMimeTypes = ["application/msword"] as const;

const supportedImageMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export async function reviewResume(
  input: ReviewResumeInput,
): Promise<ResumeReviewResult> {
  const extraction = await extractResumeContent(input);

  if (!extraction.text.trim()) {
    throw validationError("Could not extract readable resume content.");
  }

  const review = await reviewTextWithGemini({
    text: extraction.text,
    targetRole: input.targetRole,
    focus: input.focus,
  });

  return {
    score: review.score,
    summary: review.summary,
    strengths: review.strengths,
    improvements: review.improvements,
    atsSuggestions: review.atsSuggestions,
    fullReview: review.fullReview,
    extraction,
    usage: review.usage,
  };
}

export async function reviewUploadedResume(
  file: UploadedFile,
  options: {
    targetRole?: string;
    focus?: string;
  } = {},
): Promise<ResumeReviewResult> {
  return reviewResume({
    resumeBuffer: file.buffer,
    fileName: file.fileName,
    mimeType: file.mimeType,
    targetRole: options.targetRole,
    focus: options.focus,
  });
}

export async function extractResumeContent(
  input: ReviewResumeInput,
): Promise<ResumeExtractionResult> {
  const mimeType = input.mimeType.toLowerCase();
  const fileName = getSafeFileName(input.fileName, "resume");

  if (isSupportedTextMimeType(mimeType)) {
    return extractTextResume(input.resumeBuffer, fileName);
  }

  if (isSupportedPdfMimeType(mimeType) || fileName.toLowerCase().endsWith(".pdf")) {
    return extractPdfResume(input.resumeBuffer, fileName);
  }

  if (
    isSupportedDocxMimeType(mimeType) ||
    fileName.toLowerCase().endsWith(".docx")
  ) {
    return extractDocxResume(input.resumeBuffer, fileName);
  }

  if (isUnsupportedDocMimeType(mimeType) || fileName.toLowerCase().endsWith(".doc")) {
    throw validationError(
      "Legacy .doc resume files are not supported. Please upload PDF, DOCX, PNG, JPG, WEBP, or TXT.",
      {
        fileName,
        mimeType,
      },
    );
  }

  if (isSupportedImageMimeType(mimeType)) {
    return extractImageResumeWithGemini(input);
  }

  throw validationError("Unsupported resume file type.", {
    fileName,
    mimeType,
    supportedTypes: [
      ...supportedPdfMimeTypes,
      ...supportedDocxMimeTypes,
      ...supportedTextMimeTypes,
      ...supportedImageMimeTypes,
    ],
  });
}

export async function extractPdfResume(
  buffer: Buffer,
  fileName = "resume.pdf",
): Promise<ResumeExtractionResult> {
  let parser: PdfParserInstance | undefined;

  try {
    const { PDFParse } = await importPdfParse();

    parser = new PDFParse({
      data: new Uint8Array(buffer),
    });

    const result = await parser.getText();
    const text = normalizeExtractedText(result.text ?? "");

    if (!text) {
      throw new Error("PDF text extraction returned empty text.");
    }

    return {
      text,
      method: "pdf",
      metadata: {
        fileName,
        pages: typeof result.total === "number" ? result.total : null,
      },
    };
  } catch (error) {
    throw aiProviderError(
      "resume-reviewer",
      "Failed to extract text from PDF resume.",
      {
        error: getErrorMessage(error),
        fileName,
      },
    );
  } finally {
    await parser?.destroy?.();
  }
}

export async function extractDocxResume(
  buffer: Buffer,
  fileName = "resume.docx",
): Promise<ResumeExtractionResult> {
  try {
    const mammoth = await importMammoth();
    const result = await mammoth.extractRawText({
      buffer,
    });

    const text = normalizeExtractedText(result.value ?? "");

    if (!text) {
      throw new Error("DOCX text extraction returned empty text.");
    }

    return {
      text,
      method: "docx",
      metadata: {
        fileName,
        messages:
        result.messages?.map((message) => ({
        type: message.type ?? "info",
        message: message.message ?? "",
        })) ?? [],
      },
    };
  } catch (error) {
    throw aiProviderError(
      "resume-reviewer",
      "Failed to extract text from DOCX resume.",
      {
        error: getErrorMessage(error),
        fileName,
      },
    );
  }
}

export function extractTextResume(
  buffer: Buffer,
  fileName = "resume.txt",
): ResumeExtractionResult {
  const text = normalizeExtractedText(buffer.toString("utf8"));

  if (!text) {
    throw validationError("Text resume file is empty.", {
      fileName,
    });
  }

  return {
    text,
    method: "text",
    metadata: {
      fileName,
      bytes: buffer.byteLength,
    },
  };
}

export async function extractImageResumeWithGemini(
  input: ReviewResumeInput,
): Promise<ResumeExtractionResult> {
  const prompt = [
    "Extract all readable resume text from this image.",
    "Preserve important sections like name, contact details, summary, education, skills, projects, experience, and achievements.",
    "Return only valid JSON. Do not wrap the JSON in markdown.",
    "",
    "Return JSON in this exact shape:",
    JSON.stringify(
      {
        text: "Complete extracted resume text",
      },
      null,
      2,
    ),
  ].join("\n");

  const result = await generateGeminiText({
    prompt,
    systemInstruction:
      "You are an OCR assistant that extracts resume text accurately from images.",
    temperature: 0.2,
    maxOutputTokens: 2500,
    responseMimeType: "application/json",
    images: [
      {
        mimeType: input.mimeType,
        base64Data: input.resumeBuffer.toString("base64"),
      },
    ],
  });

  const parsed = parseJsonFromGemini<{
    text?: unknown;
  }>(result.text);

  const text =
    typeof parsed.text === "string" ? normalizeExtractedText(parsed.text) : "";

  if (!text) {
    throw aiProviderError(
      "resume-reviewer",
      "Gemini could not extract readable resume text from the image.",
    );
  }

  return {
    text,
    method: "image",
    metadata: {
      fileName: getSafeFileName(input.fileName, "resume-image"),
      mimeType: input.mimeType,
      bytes: input.resumeBuffer.byteLength,
      extractionModel: "gemini",
      extractionTokens: result.usage.totalTokens,
    },
  };
}

export async function reviewResumeText(options: {
  text: string;
  targetRole?: string;
  focus?: string;
}): Promise<ResumeReviewOutput> {
  const text = normalizeExtractedText(options.text);

  if (!text) {
    throw validationError("Resume text is required.");
  }

  const review = await reviewTextWithGemini({
    text,
    targetRole: options.targetRole,
    focus: options.focus,
  });

  return {
    score: review.score,
    summary: review.summary,
    strengths: review.strengths,
    improvements: review.improvements,
    atsSuggestions: review.atsSuggestions,
    fullReview: review.fullReview,
  };
}

export function buildResumeReviewMarkdown(review: ResumeReviewOutput): string {
  return [
    `# Resume Review`,
    "",
    `## Score`,
    `${review.score}/100`,
    "",
    `## Summary`,
    review.summary,
    "",
    `## Strengths`,
    ...formatList(review.strengths),
    "",
    `## Improvements`,
    ...formatList(review.improvements),
    "",
    `## ATS Suggestions`,
    ...formatList(review.atsSuggestions),
    "",
    `## Full Review`,
    review.fullReview,
  ].join("\n");
}

export function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function getResumeTextPreview(text: string, maxLength = 1200): string {
  const normalizedText = normalizeExtractedText(text);

  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, maxLength).trim()}...`;
}

export function estimateResumeQualityScore(text: string): number {
  const normalizedText = normalizeExtractedText(text).toLowerCase();

  let score = 40;

  const checks = [
    ["email", /[^\s@]+@[^\s@]+\.[^\s@]+/],
    ["phone", /\+?\d[\d\s().-]{7,}/],
    ["skills", /\bskills?\b/],
    ["experience", /\bexperience\b|\bemployment\b|\bwork history\b/],
    ["education", /\beducation\b|\buniversity\b|\bcollege\b/],
    ["projects", /\bprojects?\b/],
    ["achievements", /\bimproved\b|\bincreased\b|\breduced\b|\bbuilt\b|\bled\b/],
  ] as const;

  for (const [, regex] of checks) {
    if (regex.test(normalizedText)) {
      score += 8;
    }
  }

  const wordCount = normalizedText.split(/\s+/).filter(Boolean).length;

  if (wordCount >= 300) score += 6;
  if (wordCount >= 600) score += 6;

  return Math.min(score, 100);
}

function formatList(items: string[]): string[] {
  if (!items.length) {
    return ["- Not provided."];
  }

  return items.map((item) => `- ${item}`);
}

function isSupportedTextMimeType(mimeType: string): boolean {
  return (supportedTextMimeTypes as readonly string[]).includes(mimeType);
}

function isSupportedPdfMimeType(mimeType: string): boolean {
  return (supportedPdfMimeTypes as readonly string[]).includes(mimeType);
}

function isSupportedDocxMimeType(mimeType: string): boolean {
  return (supportedDocxMimeTypes as readonly string[]).includes(mimeType);
}

function isUnsupportedDocMimeType(mimeType: string): boolean {
  return (unsupportedDocMimeTypes as readonly string[]).includes(mimeType);
}

function isSupportedImageMimeType(mimeType: string): boolean {
  return (supportedImageMimeTypes as readonly string[]).includes(mimeType);
}

function sanitizeJsonRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record: JsonRecord = {};

  for (const [key, item] of Object.entries(value)) {
    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean" ||
      item === null
    ) {
      record[key] = item;
    }
  }

  return record;
}

type PdfTextResult = {
  text?: string;
  total?: number;
};

type PdfParserInstance = {
  getText(): Promise<PdfTextResult>;
  destroy?(): Promise<void> | void;
};

type PdfParseConstructor = new (options: {
  data: Uint8Array;
}) => PdfParserInstance;

async function importPdfParse(): Promise<{
  PDFParse: PdfParseConstructor;
}> {
  try {
    const module = (await import("pdf-parse")) as unknown as {
      PDFParse?: PdfParseConstructor;
    };

    if (!module.PDFParse) {
      throw new Error("PDFParse export was not found.");
    }

    return {
      PDFParse: module.PDFParse,
    };
  } catch {
    throw validationError(
      "PDF resume parsing dependency is missing or incompatible. Install it with: npm i pdf-parse",
    );
  }
}

async function importMammoth(): Promise<{
  extractRawText(input: { buffer: Buffer }): Promise<{
    value?: string;
    messages?: Array<{
      type?: string;
      message?: string;
    }>;
  }>;
}> {
  try {
    const module = await import("mammoth");

    return module.default ?? module;
  } catch {
    throw validationError(
      "DOCX resume parsing dependency is missing. Install it with: npm i mammoth",
    );
  }
}
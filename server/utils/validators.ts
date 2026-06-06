import type {
  GenerateArticleInput,
  GenerateImageInput,
  GenerateTitlesInput,
  ImageSize,
  ImageStyle,
  ReviewResumeInput,
  ToolType,
  UploadedFile,
} from "../types";
import { env } from "../env";
import {
  badRequest,
  unsupportedFileType,
  uploadTooLarge,
  validationError,
} from "./errors";

export const toolTypes = [
  "article",
  "blog-title",
  "image",
  "background-removal",
  "object-removal",
  "resume-review",
] as const satisfies readonly ToolType[];

export const premiumToolTypes = [
  "background-removal",
  "object-removal",
  "resume-review",
] as const satisfies readonly ToolType[];

export const freeToolTypes = [
  "article",
  "blog-title",
  "image",
] as const satisfies readonly ToolType[];

export const imageStyles = [
  "realistic",
  "digital-art",
  "anime",
  "3d-render",
  "cyberpunk",
  "minimal",
  "product-shot",
  "cinematic",
] as const satisfies readonly ImageStyle[];

export const imageSizes = [
  "square",
  "portrait",
  "landscape",
] as const satisfies readonly ImageSize[];

export const acceptedImageMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const acceptedResumeMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export const acceptedImageExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

export const acceptedResumeExtensions = [
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

export function isToolType(value: unknown): value is ToolType {
  return typeof value === "string" && toolTypes.includes(value as ToolType);
}

export function isPremiumTool(value: ToolType): boolean {
  return (premiumToolTypes as readonly string[]).includes(value);
}

export function isFreeTool(value: ToolType): boolean {
  return (freeToolTypes as readonly string[]).includes(value);
}

export function assertToolType(value: unknown): ToolType {
  if (!isToolType(value)) {
    throw validationError("Invalid tool type.", {
      allowedToolTypes: toolTypes,
      received: value,
    });
  }

  return value;
}

export function isImageStyle(value: unknown): value is ImageStyle {
  return (
    typeof value === "string" &&
    (imageStyles as readonly string[]).includes(value)
  );
}

export function isImageSize(value: unknown): value is ImageSize {
  return (
    typeof value === "string" &&
    (imageSizes as readonly string[]).includes(value)
  );
}

export function assertImageStyle(value: unknown): ImageStyle {
  if (!isImageStyle(value)) {
    throw validationError("Invalid image style.", {
      allowedImageStyles: imageStyles,
      received: value,
    });
  }

  return value;
}

export function assertImageSize(value: unknown): ImageSize {
  if (!isImageSize(value)) {
    throw validationError("Invalid image size.", {
      allowedImageSizes: imageSizes,
      received: value,
    });
  }

  return value;
}

export function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function requireString(
  value: unknown,
  fieldName: string,
  options: {
    minLength?: number;
    maxLength?: number;
  } = {},
): string {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    throw validationError(`${fieldName} is required.`);
  }

  if (options.minLength && normalizedValue.length < options.minLength) {
    throw validationError(
      `${fieldName} must be at least ${options.minLength} characters.`,
    );
  }

  if (options.maxLength && normalizedValue.length > options.maxLength) {
    throw validationError(
      `${fieldName} must be at most ${options.maxLength} characters.`,
    );
  }

  return normalizedValue;
}

export function optionalString(
  value: unknown,
  fieldName: string,
  options: {
    maxLength?: number;
  } = {},
): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw validationError(`${fieldName} must be a string.`);
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return undefined;
  }

  if (options.maxLength && normalizedValue.length > options.maxLength) {
    throw validationError(
      `${fieldName} must be at most ${options.maxLength} characters.`,
    );
  }

  return normalizedValue;
}

export function optionalStringArray(
  value: unknown,
  fieldName: string,
  options: {
    maxItems?: number;
    maxItemLength?: number;
  } = {},
): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw validationError(`${fieldName} must be an array of strings.`);
  }

  const items = value
    .map((item: unknown) => {
      if (typeof item !== "string") {
        throw validationError(`${fieldName} must only contain strings.`);
      }

      return item.trim();
    })
    .filter(Boolean);

  if (options.maxItems && items.length > options.maxItems) {
    throw validationError(
      `${fieldName} must contain at most ${options.maxItems} items.`,
    );
  }

  if (
    options.maxItemLength &&
    items.some((item: string) => item.length > options.maxItemLength!)
  ) {
    throw validationError(`${fieldName} contains an item that is too long.`);
  }

  return items.length ? items : undefined;
}

export function optionalNumber(
  value: unknown,
  fieldName: string,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
  } = {},
): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw validationError(`${fieldName} must be a valid number.`);
  }

  if (options.integer && !Number.isInteger(parsedValue)) {
    throw validationError(`${fieldName} must be an integer.`);
  }

  if (options.min !== undefined && parsedValue < options.min) {
    throw validationError(`${fieldName} must be at least ${options.min}.`);
  }

  if (options.max !== undefined && parsedValue > options.max) {
    throw validationError(`${fieldName} must be at most ${options.max}.`);
  }

  return parsedValue;
}

export function validateGenerateArticleInput(
  body: unknown,
): GenerateArticleInput {
  if (!isObject(body)) {
    throw badRequest("Request body must be an object.");
  }

  const prompt = requireString(body.prompt, "Prompt", {
    minLength: 10,
    maxLength: 4000,
  });

  const tone = optionalString(body.tone, "Tone", {
    maxLength: 80,
  });

  const length = validateArticleLength(body.length);

  const keywords = optionalStringArray(body.keywords, "Keywords", {
    maxItems: 10,
    maxItemLength: 60,
  });

  return {
    prompt,
    tone,
    length,
    keywords,
  };
}

export function validateGenerateTitlesInput(
  body: unknown,
): GenerateTitlesInput {
  if (!isObject(body)) {
    throw badRequest("Request body must be an object.");
  }

  const topic = requireString(body.topic ?? body.prompt, "Topic", {
    minLength: 3,
    maxLength: 500,
  });

  const category = optionalString(body.category, "Category", {
    maxLength: 80,
  });

  const style = optionalString(body.style, "Style", {
    maxLength: 80,
  });

  const count = optionalNumber(body.count, "Count", {
    min: 1,
    max: 20,
    integer: true,
  });

  return {
    topic,
    category,
    style,
    count: count ?? 5,
  };
}

export function validateGenerateImageInput(body: unknown): GenerateImageInput {
  if (!isObject(body)) {
    throw badRequest("Request body must be an object.");
  }

  const prompt = requireString(body.prompt, "Prompt", {
    minLength: 5,
    maxLength: 1500,
  });

  const styleValue = optionalString(body.style, "Style", {
    maxLength: 80,
  });

  const sizeValue = optionalString(body.size, "Size", {
    maxLength: 40,
  });

  const style = styleValue ? assertImageStyle(styleValue) : undefined;
  const size = sizeValue ? assertImageSize(sizeValue) : undefined;

  return {
    prompt,
    style,
    size,
  };
}

export function validateRemoveObjectInput(
  body: unknown,
): {
  objectPrompt: string;
} {
  if (!isObject(body)) {
    throw badRequest("Request body must be an object.");
  }

  const objectPrompt = requireString(
    body.objectPrompt ?? body.prompt,
    "Object prompt",
    {
      minLength: 3,
      maxLength: 700,
    },
  );

  return {
    objectPrompt,
  };
}

export function validateReviewResumeFields(
  body: unknown,
): Pick<ReviewResumeInput, "targetRole" | "focus"> {
  if (!isObject(body)) {
    return {};
  }

  const targetRole = optionalString(body.targetRole, "Target role", {
    maxLength: 120,
  });

  const focus = optionalString(body.focus, "Focus", {
    maxLength: 80,
  });

  return {
    targetRole,
    focus,
  };
}

export function validateImageFile(file: UploadedFile): UploadedFile {
  validateFileSize(file);
  validateMimeType(file.mimeType, acceptedImageMimeTypes);
  validateFileExtension(file.fileName, acceptedImageExtensions);

  return file;
}

export function validateResumeFile(file: UploadedFile): UploadedFile {
  validateFileSize(file);
  validateMimeType(file.mimeType, acceptedResumeMimeTypes);
  validateFileExtension(file.fileName, acceptedResumeExtensions);

  return file;
}

export function validateFileSize(file: Pick<UploadedFile, "size">): void {
  const maxBytes = env.maxUploadSizeMb * 1024 * 1024;

  if (file.size > maxBytes) {
    throw uploadTooLarge(env.maxUploadSizeMb);
  }
}

export function validateMimeType(
  mimeType: string,
  allowedTypes: readonly string[],
): void {
  const normalizedMimeType = mimeType.toLowerCase();

  if (!allowedTypes.includes(normalizedMimeType)) {
    throw unsupportedFileType(mimeType, allowedTypes);
  }
}

export function validateFileExtension(
  fileName: string,
  allowedExtensions: readonly string[],
): void {
  const normalizedFileName = fileName.toLowerCase();

  const isAllowed = allowedExtensions.some((extension: string) =>
    normalizedFileName.endsWith(extension),
  );

  if (!isAllowed) {
    throw validationError("Unsupported file extension.", {
      fileName,
      allowedExtensions,
    });
  }
}

export function getSafeFileName(fileName: string, fallback = "upload"): string {
  const normalizedFileName = fileName
    .trim()
    .replace(/[^\w.\-() ]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 120);

  return normalizedFileName || fallback;
}

export function validatePagination(value: {
  page?: unknown;
  limit?: unknown;
}): {
  page: number;
  limit: number;
} {
  const page = optionalNumber(value.page, "Page", {
    min: 1,
    max: 10_000,
    integer: true,
  });

  const limit = optionalNumber(value.limit, "Limit", {
    min: 1,
    max: 100,
    integer: true,
  });

  return {
    page: page ?? 1,
    limit: limit ?? 20,
  };
}

export function validateSearchQuery(value: unknown): string | undefined {
  return optionalString(value, "Search", {
    maxLength: 200,
  });
}

export function validateCreationId(value: unknown): string {
  return requireString(value, "Creation ID", {
    minLength: 3,
    maxLength: 120,
  });
}

export function validateClerkUserId(value: unknown): string {
  return requireString(value, "Clerk user ID", {
    minLength: 3,
    maxLength: 120,
  });
}

export function validateEmail(value: unknown): string {
  const email = requireString(value, "Email", {
    minLength: 3,
    maxLength: 254,
  }).toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    throw validationError("Email must be valid.");
  }

  return email;
}

export function validateUrl(value: unknown, fieldName = "URL"): string {
  const url = requireString(value, fieldName, {
    minLength: 8,
    maxLength: 2048,
  });

  try {
    const parsedUrl = new URL(url);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol.");
    }

    return parsedUrl.toString();
  } catch {
    throw validationError(`${fieldName} must be a valid URL.`);
  }
}

export function validateArticleLength(
  value: unknown,
): GenerateArticleInput["length"] {
  if (value === undefined || value === null || value === "") {
    return "medium";
  }

  if (value === "short" || value === "medium" || value === "long") {
    return value;
  }

  throw validationError("Length must be short, medium, or long.");
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
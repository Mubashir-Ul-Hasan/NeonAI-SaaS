/// <reference types="node" />

import { Buffer } from "node:buffer";

import type {
  RemoveBackgroundInput,
  RemoveObjectInput,
  UploadedFile,
} from "../types";
import { requireClipdropEnv } from "../env";
import { aiProviderError, validationError } from "../utils/errors";
import { getSafeFileName } from "../utils/validators";

const CLIPDROP_TEXT_TO_IMAGE_URL = "https://clipdrop-api.co/text-to-image/v1";

const CLIPDROP_REMOVE_BACKGROUND_URL =
  "https://clipdrop-api.co/remove-background/v1";

const CLIPDROP_CLEANUP_URL = "https://clipdrop-api.co/cleanup/v1";

export type ClipdropOutputMimeType = "image/png" | "image/webp" | "image/jpg";

export type ClipdropCleanupMode = "fast" | "quality";

export type ClipdropImageStyle =
  | "realistic"
  | "digital-art"
  | "anime"
  | "3d-render"
  | "cyberpunk"
  | "minimal"
  | "product-shot"
  | "cinematic";

export type ClipdropImageSize =
  | "1024x1024"
  | "1024x1536"
  | "1536x1024"
  | "square"
  | "portrait"
  | "landscape";

export type GenerateClipdropImageInput = {
  prompt: string;
  negativePrompt?: string;
  style?: ClipdropImageStyle;
  size?: ClipdropImageSize;
};

export type ClipdropImageResult = {
  outputBuffer: Buffer;
  outputMimeType: string;
  outputFileName: string;
  originalFileSize: number;
  outputFileSize: number;
  remainingCredits?: string;
  creditsConsumed?: string;
  latencyMs: number;
};

export type ClipdropGeneratedImageResult = ClipdropImageResult & {
  revisedPrompt: string;
};

export type ClipdropCleanupInput = RemoveObjectInput & {
  maskBuffer: Buffer;
  maskFileName?: string;
  maskMimeType?: string;
  mode?: ClipdropCleanupMode;
};

export type ClipdropRequestOptions = {
  outputMimeType?: ClipdropOutputMimeType;
};

const STYLE_PROMPTS: Record<ClipdropImageStyle, string> = {
  realistic: "highly realistic professional photography, sharp focus, natural lighting",
  "digital-art": "high-quality digital art, vibrant colors, polished illustration",
  anime: "anime-inspired illustration, clean line art, expressive composition",
  "3d-render": "premium 3D render, cinematic lighting, detailed materials",
  cyberpunk: "cyberpunk aesthetic, neon lighting, futuristic atmosphere",
  minimal: "minimal modern design, clean composition, elegant visual style",
  "product-shot": "professional product photography, studio lighting, commercial quality",
  cinematic: "cinematic scene, dramatic lighting, high detail, film still quality",
};

const SIZE_PROMPTS: Record<ClipdropImageSize, string> = {
  "1024x1024": "square 1:1 composition",
  "1024x1536": "portrait 2:3 composition",
  "1536x1024": "landscape 3:2 composition",
  square: "square 1:1 composition",
  portrait: "portrait 2:3 composition",
  landscape: "landscape 3:2 composition",
};

export async function generateImageWithClipdrop(
  input: GenerateClipdropImageInput,
  options: ClipdropRequestOptions = {},
): Promise<ClipdropGeneratedImageResult> {
  const revisedPrompt = buildTextToImagePrompt(input);

  const formData = new FormData();

  formData.append("prompt", revisedPrompt);

  const result = await callClipdropImageEndpoint({
    endpoint: CLIPDROP_TEXT_TO_IMAGE_URL,
    formData,
    outputMimeType: options.outputMimeType ?? "image/png",
    fallbackFileName: createGeneratedImageFileName(input.prompt),
  });

  return {
    ...result,
    revisedPrompt,
    originalFileSize: Buffer.byteLength(revisedPrompt, "utf8"),
  };
}

export async function removeBackgroundWithClipdrop(
  input: RemoveBackgroundInput,
  options: ClipdropRequestOptions = {},
): Promise<ClipdropImageResult> {
  const formData = new FormData();

  appendBufferToFormData(formData, "image_file", {
    buffer: input.imageBuffer,
    fileName: input.fileName,
    mimeType: input.mimeType,
  });

  const result = await callClipdropImageEndpoint({
    endpoint: CLIPDROP_REMOVE_BACKGROUND_URL,
    formData,
    outputMimeType: options.outputMimeType ?? "image/png",
    fallbackFileName: createOutputFileName(input.fileName, "background-removed"),
  });

  return {
    ...result,
    originalFileSize: input.imageBuffer.byteLength,
  };
}

export async function cleanupImageWithClipdrop(
  input: ClipdropCleanupInput,
  options: ClipdropRequestOptions = {},
): Promise<ClipdropImageResult> {
  if (!input.maskBuffer?.byteLength) {
    throw validationError(
      "Object removal requires a mask image. Clipdrop Cleanup does not remove an object from text alone.",
      {
        requiredField: "mask_file",
        expected: "A black/white PNG mask with the same resolution as image_file.",
      },
    );
  }

  const formData = new FormData();

  appendBufferToFormData(formData, "image_file", {
    buffer: input.imageBuffer,
    fileName: input.fileName,
    mimeType: input.mimeType,
  });

  appendBufferToFormData(formData, "mask_file", {
    buffer: input.maskBuffer,
    fileName: input.maskFileName ?? "mask.png",
    mimeType: input.maskMimeType ?? "image/png",
  });

  if (input.mode) {
    formData.append("mode", input.mode);
  }

  const result = await callClipdropImageEndpoint({
    endpoint: CLIPDROP_CLEANUP_URL,
    formData,
    outputMimeType: options.outputMimeType ?? "image/png",
    fallbackFileName: createOutputFileName(input.fileName, "object-removed"),
  });

  return {
    ...result,
    originalFileSize: input.imageBuffer.byteLength,
  };
}

export async function removeObjectWithClipdrop(
  input: RemoveObjectInput & {
    maskBuffer?: Buffer;
    maskFileName?: string;
    maskMimeType?: string;
    mode?: ClipdropCleanupMode;
  },
  options: ClipdropRequestOptions = {},
): Promise<ClipdropImageResult> {
  if (!input.objectPrompt?.trim()) {
    throw validationError("Object prompt is required.");
  }

  if (!input.maskBuffer) {
    throw validationError(
      "Object removal needs a mask image before calling Clipdrop Cleanup.",
      {
        objectPrompt: input.objectPrompt,
        note:
          "The frontend can collect a user-drawn mask, or the backend can generate a mask later using a separate segmentation model.",
      },
    );
  }

  return cleanupImageWithClipdrop(
    {
      ...input,
      maskBuffer: input.maskBuffer,
      maskFileName: input.maskFileName,
      maskMimeType: input.maskMimeType,
      mode: input.mode,
    },
    options,
  );
}

export async function removeBackgroundFromUploadedFile(
  file: UploadedFile,
  options: ClipdropRequestOptions = {},
): Promise<ClipdropImageResult> {
  return removeBackgroundWithClipdrop(
    {
      imageBuffer: file.buffer,
      fileName: file.fileName,
      mimeType: file.mimeType,
    },
    options,
  );
}

export async function cleanupUploadedFileWithMask(
  file: UploadedFile,
  maskFile: UploadedFile,
  options: {
    objectPrompt?: string;
    mode?: ClipdropCleanupMode;
    outputMimeType?: ClipdropOutputMimeType;
  } = {},
): Promise<ClipdropImageResult> {
  return cleanupImageWithClipdrop(
    {
      imageBuffer: file.buffer,
      fileName: file.fileName,
      mimeType: file.mimeType,
      objectPrompt: options.objectPrompt ?? "Remove masked object",
      maskBuffer: maskFile.buffer,
      maskFileName: maskFile.fileName,
      maskMimeType: maskFile.mimeType,
      mode: options.mode,
    },
    {
      outputMimeType: options.outputMimeType,
    },
  );
}

export function isClipdropConfigured(): boolean {
  try {
    requireClipdropEnv();
    return true;
  } catch {
    return false;
  }
}

async function callClipdropImageEndpoint({
  endpoint,
  formData,
  outputMimeType,
  fallbackFileName,
}: {
  endpoint: string;
  formData: FormData;
  outputMimeType: ClipdropOutputMimeType;
  fallbackFileName: string;
}): Promise<Omit<ClipdropImageResult, "originalFileSize">> {
  const { clipdropApiKey } = requireClipdropEnv();
  const startedAt = Date.now();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-api-key": clipdropApiKey,
        Accept: outputMimeType,
      },
      body: formData,
    });

    const responseContentType =
      response.headers.get("content-type") ?? outputMimeType;

    if (!response.ok) {
  const errorBody = await readClipdropErrorBody(response);

  throw new Error(
    `Clipdrop API failed with ${response.status}: ${errorBody}`,
  );
}

    if (!responseContentType.toLowerCase().startsWith("image/")) {
      const unexpectedBody = await response.text();

      throw new Error(
        `Clipdrop returned a non-image response: ${responseContentType} ${unexpectedBody}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const outputBuffer = Buffer.from(arrayBuffer);

    if (!outputBuffer.byteLength) {
      throw new Error("Clipdrop returned an empty image response.");
    }

    return {
      outputBuffer,
      outputMimeType: responseContentType,
      outputFileName: ensureImageExtension(
        fallbackFileName,
        responseContentType,
      ),
      outputFileSize: outputBuffer.byteLength,
      remainingCredits: response.headers.get("x-remaining-credits") ?? undefined,
      creditsConsumed: response.headers.get("x-credits-consumed") ?? undefined,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : "Clipdrop image processing failed.";

  console.error("Clipdrop image endpoint failed", {
    endpoint,
    errorMessage,
    latencyMs: Date.now() - startedAt,
  });

  throw aiProviderError("clipdrop", errorMessage, {
    error,
    endpoint,
    latencyMs: Date.now() - startedAt,
  });
}
}

function buildTextToImagePrompt(input: GenerateClipdropImageInput): string {
  const cleanPrompt = input.prompt.trim();

  if (!cleanPrompt) {
    throw validationError("Image prompt is required.");
  }

  if (cleanPrompt.length > 1000) {
    throw validationError("Image prompt must be 1000 characters or less.");
  }

  const style = input.style ? STYLE_PROMPTS[input.style] : STYLE_PROMPTS.realistic;
  const size = input.size ? SIZE_PROMPTS[input.size] : SIZE_PROMPTS["1024x1024"];
  const negativePrompt = input.negativePrompt?.trim();

  const promptParts = [
    style,
    size,
    cleanPrompt,
    "polished, detailed, high quality, no watermark, no text overlay",
  ];

  if (negativePrompt) {
    promptParts.push(`avoid ${negativePrompt}`);
  }

  return promptParts.filter(Boolean).join(". ");
}

function appendBufferToFormData(
  formData: FormData,
  fieldName: string,
  file: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
  },
): void {
  const safeFileName = getSafeFileName(file.fileName || "image.png");
  const blob = new Blob([new Uint8Array(file.buffer)], {
    type: file.mimeType || "application/octet-stream",
  });

  formData.append(fieldName, blob, safeFileName);
}

async function readClipdropErrorBody(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    const text = await response.text();

    if (!text.trim()) {
      return response.statusText || "No error body returned.";
    }

    if (contentType.includes("application/json")) {
      try {
        const parsed = JSON.parse(text) as unknown;

        return JSON.stringify(parsed);
      } catch {
        return text;
      }
    }

    return text;
  } catch {
    return response.statusText || "Unable to read Clipdrop error body.";
  }
}

function createGeneratedImageFileName(prompt: string): string {
  const safePrompt = prompt
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${safePrompt || "generated-image"}-${Date.now()}.png`;
}

function createOutputFileName(fileName: string, suffix: string): string {
  const safeFileName = getSafeFileName(fileName || "image.png");
  const withoutExtension = safeFileName.replace(/\.[^/.]+$/, "");

  return `${withoutExtension}-${suffix}.png`;
}

function ensureImageExtension(fileName: string, mimeType: string): string {
  const extension = getImageExtension(mimeType);
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");

  return `${withoutExtension}.${extension}`;
}

function getImageExtension(mimeType: string): "png" | "webp" | "jpg" {
  const cleanMimeType = mimeType.toLowerCase();

  if (cleanMimeType.includes("webp")) return "webp";
  if (cleanMimeType.includes("jpeg") || cleanMimeType.includes("jpg")) {
    return "jpg";
  }

  return "png";
}
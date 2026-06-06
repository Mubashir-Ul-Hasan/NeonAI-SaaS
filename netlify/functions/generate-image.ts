/// <reference types="node" />

import type { GenerateImageInput } from "../../server/types";
import { requireUserWithUsageLimit } from "../../server/auth/requirePremium";
import {
  generateImageWithClipdrop,
  type ClipdropImageSize,
  type ClipdropImageStyle,
} from "../../server/ai/clipdrop";
import {
  createCreation,
  createFailedCreation,
  mapCreationToPublicCreation,
} from "../../server/services/creationService";
import { trackFailure, trackSuccess } from "../../server/services/usageService";
import { uploadBufferToCloudinary } from "../../server/storage/cloudinary";
import { getErrorMessage } from "../../server/utils/errors";
import { createPostHandler } from "../../server/utils/handler";
import { parseJsonBody } from "../../server/utils/parseBody";
import { success } from "../../server/utils/response";
import { validateGenerateImageInput } from "../../server/utils/validators";

type GenerateImageInputWithNegativePrompt = GenerateImageInput & {
  negativePrompt?: string;
};

export const handler = createPostHandler(async ({ event }) => {
  const startedAt = Date.now();

  const auth = await requireUserWithUsageLimit({
    event,
    toolType: "image",
  });

  const body = parseJsonBody(event);
  const input = validateGenerateImageInput(
    body,
  ) as GenerateImageInputWithNegativePrompt;

  try {
    const clipdropStyle = toClipdropImageStyle(input.style);
    const clipdropSize = toClipdropImageSize(input.size);

    const generatedImage = await generateImageWithClipdrop({
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      style: clipdropStyle,
      size: clipdropSize,
    });

    const uploadedImage = await uploadBufferToCloudinary(
      generatedImage.outputBuffer,
      {
        folder: "quickai/images",
        fileName: generatedImage.outputFileName,
        resourceType: "image",
        tags: ["quickai", "generated-image", `user-${auth.clerkUserId}`],
        metadata: {
          toolType: "image",
          provider: "clipdrop",
          clerkUserId: auth.clerkUserId,
          prompt: input.prompt.slice(0, 240),
          revisedPrompt: generatedImage.revisedPrompt.slice(0, 240),
          style: clipdropStyle ?? null,
          size: clipdropSize ?? null,
        },
      },
    );

    const creation = await createCreation({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      toolType: "image",
      prompt: input.prompt,
      resultImageUrl: uploadedImage.secureUrl,
      cloudinaryPublicId: uploadedImage.publicId,
      status: "completed",
      metadata: {
        provider: "clipdrop",
        style: clipdropStyle ?? null,
        size: clipdropSize ?? null,
        negativePrompt: input.negativePrompt ?? null,
        revisedPrompt: generatedImage.revisedPrompt,
        mimeType: generatedImage.outputMimeType,
        originalFileSize: generatedImage.originalFileSize,
        outputFileSize: generatedImage.outputFileSize,
        cloudinaryBytes: uploadedImage.bytes,
        cloudinaryFormat: uploadedImage.format,
        width: uploadedImage.width ?? null,
        height: uploadedImage.height ?? null,
        remainingCredits: generatedImage.remainingCredits ?? null,
        creditsConsumed: generatedImage.creditsConsumed ?? null,
        clipdropLatencyMs: generatedImage.latencyMs,
        usageLimitUsed: auth.usageLimit.used,
        usageLimitRemaining: auth.usageLimit.remaining,
      },
    });

    await trackSuccess({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      creationId: creation.id,
      toolType: "image",
      provider: "clipdrop",
      tokensUsed: 0,
      latencyMs: Date.now() - startedAt,
      metadata: {
        style: clipdropStyle ?? null,
        size: clipdropSize ?? null,
        outputFileSize: generatedImage.outputFileSize,
        cloudinaryPublicId: uploadedImage.publicId,
        remainingCredits: generatedImage.remainingCredits ?? null,
        creditsConsumed: generatedImage.creditsConsumed ?? null,
        clipdropLatencyMs: generatedImage.latencyMs,
      },
    });

    return success(
      {
        creation: mapCreationToPublicCreation(creation),
        image: {
          imageUrl: uploadedImage.secureUrl,
          resultImageUrl: uploadedImage.secureUrl,
          cloudinaryPublicId: uploadedImage.publicId,
          width: uploadedImage.width ?? null,
          height: uploadedImage.height ?? null,
          format: uploadedImage.format,
          bytes: uploadedImage.bytes,
        },
        imageUrl: uploadedImage.secureUrl,
        resultImageUrl: uploadedImage.secureUrl,
        usage: {
          used: auth.usageLimit.used + 1,
          limit: auth.usageLimit.limit,
          remaining: Math.max(auth.usageLimit.remaining - 1, 0),
          plan: auth.usageLimit.plan,
        },
      },
      {
        message: "Image generated successfully.",
      },
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error, "Image generation failed.");

    const failedCreation = await createFailedCreation({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      toolType: "image",
      prompt: input.prompt,
      errorMessage,
      metadata: {
        provider: "clipdrop",
        style: input.style ?? null,
        size: input.size ?? null,
        negativePrompt: input.negativePrompt ?? null,
      },
    });

    await trackFailure({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      creationId: failedCreation.id,
      toolType: "image",
      provider: "clipdrop",
      latencyMs: Date.now() - startedAt,
      errorMessage,
      metadata: {
        style: input.style ?? null,
        size: input.size ?? null,
      },
    });

    throw error;
  }
});

function toClipdropImageStyle(
  style: string | undefined,
): ClipdropImageStyle | undefined {
  if (
    style === "realistic" ||
    style === "digital-art" ||
    style === "anime" ||
    style === "3d-render" ||
    style === "cyberpunk" ||
    style === "minimal" ||
    style === "product-shot" ||
    style === "cinematic"
  ) {
    return style;
  }

  return undefined;
}

function toClipdropImageSize(
  size: string | undefined,
): ClipdropImageSize | undefined {
  if (
    size === "1024x1024" ||
    size === "1024x1536" ||
    size === "1536x1024" ||
    size === "square" ||
    size === "portrait" ||
    size === "landscape"
  ) {
    return size;
  }

  return undefined;
}
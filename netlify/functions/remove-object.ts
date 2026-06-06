/// <reference types="node" />

import { cleanupUploadedFileWithMask } from "../../server/ai/clipdrop";
import { requirePremiumWithUsageLimit } from "../../server/auth/requirePremium";
import {
  createCreation,
  createFailedCreation,
  mapCreationToPublicCreation,
} from "../../server/services/creationService";
import { trackFailure, trackSuccess } from "../../server/services/usageService";
import { uploadBufferToCloudinary } from "../../server/storage/cloudinary";
import { getErrorMessage, validationError } from "../../server/utils/errors";
import { createPostHandler } from "../../server/utils/handler";
import {
  getFirstFile,
  getMultipartField,
  getOptionalFirstFile,
  parseMultipartFormData,
} from "../../server/utils/parseMultipart";
import { success } from "../../server/utils/response";
import {
  validateImageFile,
  validateRemoveObjectInput,
} from "../../server/utils/validators";

export const handler = createPostHandler(async ({ event }) => {
  const startedAt = Date.now();

  const auth = await requirePremiumWithUsageLimit({
    event,
    toolType: "object-removal",
  });

  const form = parseMultipartFormData(event, {
    maxFiles: 2,
  });

  const imageFile = validateImageFile(getFirstFile(form, "file"));

  const maskFileRaw =
    getOptionalFirstFile(form, "mask_file") ||
    getOptionalFirstFile(form, "mask");

  if (!maskFileRaw) {
    throw validationError(
      "Object removal requires a mask image. Send it as `mask_file` or `mask`.",
      {
        requiredFields: ["file", "mask_file"],
        note:
          "Clipdrop Cleanup needs a user-drawn mask image. The text prompt alone is not enough for this endpoint.",
      },
    );
  }

  const maskFile = validateImageFile(maskFileRaw);

  const objectPrompt =
    getMultipartField(form, "objectPrompt") ||
    getMultipartField(form, "object_prompt") ||
    getMultipartField(form, "prompt") ||
    "Remove the masked object";

  const input = validateRemoveObjectInput({
    objectPrompt,
  });

  try {
    const clipdropResult = await cleanupUploadedFileWithMask(
      imageFile,
      maskFile,
      {
        objectPrompt: input.objectPrompt,
        mode: "quality",
      },
    );

    const uploadedImage = await uploadBufferToCloudinary(
      clipdropResult.outputBuffer,
      {
        folder: "quickai/object-removal",
        fileName: clipdropResult.outputFileName,
        resourceType: "image",
        tags: ["quickai", "object-removal", `user-${auth.clerkUserId}`],
        metadata: {
          toolType: "object-removal",
          clerkUserId: auth.clerkUserId,
          originalFileName: imageFile.fileName,
          originalMimeType: imageFile.mimeType,
          maskFileName: maskFile.fileName,
          objectPrompt: input.objectPrompt.slice(0, 240),
        },
      },
    );

    const creation = await createCreation({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      toolType: "object-removal",
      prompt: input.objectPrompt,
      resultImageUrl: uploadedImage.secureUrl,
      cloudinaryPublicId: uploadedImage.publicId,
      status: "completed",
      metadata: {
        originalFileName: imageFile.fileName,
        originalFileSize: clipdropResult.originalFileSize,
        maskFileName: maskFile.fileName,
        maskFileSize: maskFile.size,
        outputFileSize: clipdropResult.outputFileSize,
        outputMimeType: clipdropResult.outputMimeType,
        cloudinaryBytes: uploadedImage.bytes,
        cloudinaryFormat: uploadedImage.format,
        width: uploadedImage.width ?? null,
        height: uploadedImage.height ?? null,
        remainingCredits: clipdropResult.remainingCredits ?? null,
        creditsConsumed: clipdropResult.creditsConsumed ?? null,
        clipdropLatencyMs: clipdropResult.latencyMs,
        usageLimitUsed: auth.usageLimit.used,
        usageLimitRemaining: auth.usageLimit.remaining,
      },
    });

    await trackSuccess({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      creationId: creation.id,
      toolType: "object-removal",
      provider: "clipdrop",
      latencyMs: Date.now() - startedAt,
      metadata: {
        originalFileName: imageFile.fileName,
        originalFileSize: clipdropResult.originalFileSize,
        maskFileName: maskFile.fileName,
        maskFileSize: maskFile.size,
        outputFileSize: clipdropResult.outputFileSize,
        outputMimeType: clipdropResult.outputMimeType,
        cloudinaryPublicId: uploadedImage.publicId,
        clipdropLatencyMs: clipdropResult.latencyMs,
        remainingCredits: clipdropResult.remainingCredits ?? null,
        creditsConsumed: clipdropResult.creditsConsumed ?? null,
      },
    });

    return success(
      {
        creation: mapCreationToPublicCreation(creation),
        image: {
          imageUrl: uploadedImage.secureUrl,
          cloudinaryPublicId: uploadedImage.publicId,
          width: uploadedImage.width ?? null,
          height: uploadedImage.height ?? null,
          format: uploadedImage.format,
          bytes: uploadedImage.bytes,
        },
        usage: {
          used: auth.usageLimit.used + 1,
          limit: auth.usageLimit.limit,
          remaining: Math.max(auth.usageLimit.remaining - 1, 0),
          plan: auth.usageLimit.plan,
        },
      },
      {
        message: "Object removed successfully.",
      },
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error, "Object removal failed.");

    const failedCreation = await createFailedCreation({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      toolType: "object-removal",
      prompt: input.objectPrompt,
      errorMessage,
      metadata: {
        originalFileName: imageFile.fileName,
        originalFileSize: imageFile.size,
        originalMimeType: imageFile.mimeType,
        maskFileName: maskFile.fileName,
        maskFileSize: maskFile.size,
        maskMimeType: maskFile.mimeType,
      },
    });

    await trackFailure({
      userId: auth.user.id,
      clerkUserId: auth.clerkUserId,
      creationId: failedCreation.id,
      toolType: "object-removal",
      provider: "clipdrop",
      latencyMs: Date.now() - startedAt,
      errorMessage,
      metadata: {
        originalFileName: imageFile.fileName,
        originalFileSize: imageFile.size,
        originalMimeType: imageFile.mimeType,
        maskFileName: maskFile.fileName,
        maskFileSize: maskFile.size,
        maskMimeType: maskFile.mimeType,
      },
    });

    throw error;
  }
});